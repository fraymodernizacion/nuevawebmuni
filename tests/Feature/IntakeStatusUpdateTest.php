<?php

use App\Enums\IntakeRequestStatus;
use App\Models\IntakeRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('status updates that ask for documents or answer the applicant require a public message', function (IntakeRequestStatus $status, string $message) {
    $intake = IntakeRequest::factory()->create(['status' => IntakeRequestStatus::Received]);

    $this->actingAs(User::factory()->operator()->create())
        ->patch(route('admin.intake.status.update', $intake), [
            'status' => $status->value,
            'public_comment' => '   ',
            'internal_comment' => 'Nota reservada.',
        ])->assertSessionHasErrors(['public_comment' => $message]);

    expect($intake->fresh()->status)->toBe(IntakeRequestStatus::Received)
        ->and($intake->histories()->count())->toBe(0);
})->with([
    'documentation' => [IntakeRequestStatus::NeedsDocumentation, 'Indicá qué documentación debe presentar el vecino.'],
    'answer' => [IntakeRequestStatus::Answered, 'Escribí la respuesta que verá el vecino.'],
]);

test('a retried update keeps one history movement and exposes only the public message', function () {
    $intake = IntakeRequest::factory()->create([
        'public_code' => 'FME-2026-000042',
        'applicant_dni' => '30123456',
        'status' => IntakeRequestStatus::Received,
    ]);
    $original = $intake->histories()->create([
        'to_status' => IntakeRequestStatus::Received,
        'action' => 'created',
        'changed_at' => now()->subMinute(),
    ]);
    $operator = User::factory()->operator()->create();
    $updateUrl = route('admin.intake.status.update', $intake);
    $payload = [
        'status' => IntakeRequestStatus::Answered->value,
        'area' => 'Tesorería',
        'public_comment' => 'El municipio verificó tu solicitud.',
        'internal_comment' => 'Control interno realizado.',
        'submission_id' => Str::uuid()->toString(),
    ];

    $this->actingAs($operator);
    $this->patch($updateUrl, $payload)->assertRedirect();
    $this->patch($updateUrl, $payload)->assertRedirect();

    $movement = $intake->histories()->where('action', 'status_changed')->sole();
    expect($movement->user_id)->toBe($operator->id)
        ->and($movement->changed_at)->not->toBeNull()
        ->and($movement->from_status)->toBe(IntakeRequestStatus::Received)
        ->and($movement->to_status)->toBe(IntakeRequestStatus::Answered)
        ->and($intake->fresh()->finished_at)->toBeNull();

    $this->get(route('admin.intake.show', $intake))->assertInertia(fn (Assert $page) => $page
        ->where('request.status', 'answered')
        ->where('request.histories.0.internal_comment', $payload['internal_comment'])
        ->where('request.histories.1.id', $original->id));

    $this->post(route('intake.public.track.submit'), ['year' => '2026', 'number' => '42', 'applicant_dni' => '30123456'])
        ->assertRedirect();
    $this->get(route('intake.public.status', $intake->public_code))->assertInertia(fn (Assert $page) => $page
        ->where('request.status_code', 'answered')
        ->where('request.response.text', $payload['public_comment'])
        ->missing('request.timeline.0.internal_comment'));

    $this->patch($updateUrl, ['status' => IntakeRequestStatus::UnderReview->value])->assertRedirect();
    $this->patch($updateUrl, $payload)->assertRedirect();
    expect($intake->fresh()->status)->toBe(IntakeRequestStatus::UnderReview)
        ->and($intake->histories()->where('action', 'status_changed')->count())->toBe(2);
});
