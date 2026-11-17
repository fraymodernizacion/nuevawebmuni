<?php

use App\Enums\IntakeRequestStatus;
use App\Mail\IntakeStatusMail;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestType;
use App\Models\User;
use Database\Seeders\IntakeCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['mail.intake.enabled' => true]);
    Mail::fake();
});

test('a new public request requires an address and queues a receipt', function () {
    $type = IntakeRequestType::factory()->create(['active' => true, 'schema' => []]);
    $route = route('intake.public.store', $type->slug);
    $payload = [
        'applicant_name' => 'Vecina de prueba',
        'applicant_dni' => '30123456',
        'applicant_phone' => '3834000000',
        'summary' => 'Una consulta de prueba.',
    ];

    $this->post($route, $payload)->assertSessionHasErrors('applicant_email');
    Mail::assertNothingQueued();

    $this->post($route, $payload + ['applicant_email' => 'vecina@example.test'])->assertRedirect();
    $intake = IntakeRequest::sole();

    Mail::assertQueued(IntakeStatusMail::class, fn (IntakeStatusMail $mail): bool => $mail->hasTo('vecina@example.test')
        && $mail->publicCode === $intake->public_code
        && $mail->status === IntakeRequestStatus::Received
        && $mail->received
    );
    Mail::assertQueuedCount(1);
});

test('a status change queues one message even when the same submission is retried', function () {
    $intake = IntakeRequest::factory()->create(['applicant_email' => 'vecina@example.test']);
    $this->actingAs(User::factory()->operator()->create());
    $url = route('admin.intake.status.update', $intake);
    $update = [
        'status' => 'needs_documentation',
        'public_comment' => 'Adjuntá un comprobante.',
        'internal_comment' => 'Nota interna de prueba.',
        'submission_id' => Str::uuid()->toString(),
    ];

    $this->patch($url, $update)->assertRedirect();
    $this->patch($url, $update)->assertRedirect();
    $this->patch($url, array_replace($update, ['submission_id' => Str::uuid()->toString()]))->assertRedirect();

    Mail::assertQueuedCount(1);
    Mail::assertQueued(IntakeStatusMail::class, fn (IntakeStatusMail $mail): bool => $mail->hasTo('vecina@example.test') && $mail->status === IntakeRequestStatus::NeedsDocumentation && ! $mail->received
    );
});

test('deriving a request and receiving documentation notify the resulting status', function () {
    $this->seed(IntakeCatalogSeeder::class);
    Storage::fake('local');
    $intake = IntakeRequest::factory()->create(['applicant_email' => 'vecina@example.test']);
    $assistance = IntakeAssistanceType::whereNotNull('default_intake_department_id')->firstOrFail();
    $this->actingAs(User::factory()->operator()->create())
        ->post(route('admin.intake.derivations.store', $intake), ['assistance_type_ids' => [$assistance->id]])
        ->assertRedirect();

    Mail::assertQueued(IntakeStatusMail::class, fn (IntakeStatusMail $mail): bool => $mail->status === IntakeRequestStatus::Routed);

    $this->patch(route('admin.intake.status.update', $intake), [
        'status' => 'needs_documentation',
        'public_comment' => 'Adjuntá un comprobante.',
    ])->assertRedirect();
    $requestHistory = $intake->histories()->where('to_status', 'needs_documentation')->sole();

    $this->withSession(['intake_tracking' => [
        'public_code' => $intake->public_code,
        'expires_at' => now()->addMinutes(30)->timestamp,
    ]])->post(route('intake.public.documentation.store', $intake->public_code), [
        'documentation_request_id' => $requestHistory->id,
        'attachments' => [UploadedFile::fake()->create('comprobante.pdf', 15, 'application/pdf')],
    ])->assertRedirect();

    Mail::assertQueued(IntakeStatusMail::class, fn (IntakeStatusMail $mail): bool => $mail->status === IntakeRequestStatus::UnderReview);
    Mail::assertQueuedCount(3);
});

test('no email is queued when a change rolls back or the request has no address', function () {
    $intake = IntakeRequest::factory()->create(['applicant_email' => 'vecina@example.test']);
    DB::beginTransaction();
    $intake->histories()->create([
        'action' => 'status_changed',
        'from_status' => 'received',
        'to_status' => 'under_review',
        'changed_at' => now(),
    ]);
    Mail::assertNothingQueued();
    DB::rollBack();

    $withoutEmail = IntakeRequest::factory()->create(['applicant_email' => null]);
    $this->actingAs(User::factory()->operator()->create())
        ->patch(route('admin.intake.status.update', $withoutEmail), ['status' => 'under_review'])
        ->assertRedirect();
    Mail::assertNothingQueued();
});

test('the email provides the official sender, status and public tracking route', function () {
    $mail = new IntakeStatusMail('FME-2026-000042', IntakeRequestStatus::NeedsDocumentation, false);

    $mail->assertFrom('mesavirtual@fraymunicipalidad.gob.ar', 'Mesa de Entrada Virtual');
    $mail->assertSeeInHtml('FME-2026-000042');
    $mail->assertSeeInHtml('Requiere documentación');
    $mail->assertSeeInHtml(route('intake.public.track'));
});
