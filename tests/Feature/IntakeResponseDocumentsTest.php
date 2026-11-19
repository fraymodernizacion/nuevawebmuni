<?php

use App\Enums\IntakeRequestStatus;
use App\Mail\IntakeStatusMail;
use App\Models\IntakeRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('operators can select exactly the eight requested states and historical answers remain readable', function () {
    expect(array_column(IntakeRequestStatus::options(), 'label'))->toBe([
        'Recibido', 'En Revisión', 'Derivado', 'Requiere documentación',
        'Finalizado', 'Suspendido', 'Pendiente', 'Rechazado/ No corresponde',
    ]);
    $intake = IntakeRequest::factory()->create(['status' => IntakeRequestStatus::Answered]);

    $this->actingAs(User::factory()->operator()->create())
        ->get(route('admin.intake.show', $intake))->assertInertia(fn (Assert $page) => $page
        ->where('request.status_label', 'Respondido')
        ->has('statuses', 8));

    $url = route('admin.intake.status.update', $intake);
    $this->patch($url, ['status' => 'answered', 'public_comment' => 'Respuesta antigua.'])->assertSessionHasErrors('status');
    foreach (['pending', 'suspended', 'finished'] as $status) {
        $this->patch($url, ['status' => $status])->assertRedirect();
        expect($intake->fresh()->status->value)->toBe($status);
    }
});

test('a published response document is available only in its own verified public request', function () {
    Storage::fake('local');
    Mail::fake();
    config(['mail.intake.enabled' => true]);
    $intake = IntakeRequest::factory()->create([
        'status' => IntakeRequestStatus::UnderReview,
        'applicant_email' => 'vecino@example.test',
    ]);
    $other = IntakeRequest::factory()->create();
    $operator = User::factory()->operator()->create();
    $url = route('admin.intake.status.update', $intake);
    $submission = Str::uuid()->toString();
    $payload = [
        '_method' => 'patch',
        'status' => 'under_review',
        'public_comment' => 'Tu constancia está disponible.',
        'internal_comment' => 'Control privado del operador.',
        'submission_id' => $submission,
        'response_documents' => [UploadedFile::fake()->create('constancia.pdf', 64, 'application/pdf')],
    ];

    $this->actingAs($operator)->post($url, $payload)->assertRedirect();
    $this->post($url, $payload)->assertRedirect();
    $file = $intake->attachments()->sole();
    expect($file->type)->toBe('response')->and($file->disk)->toBe('local')->and($file->uploaded_by)->toBe($operator->id);
    Storage::disk('local')->assertExists($file->path);
    expect($intake->histories()->count())->toBe(1);
    Mail::assertQueuedCount(1);
    $this->get($file->url())->assertDownload('constancia.pdf');

    $downloadUrl = route('intake.public.response.download', [$intake->public_code, $file->id]);
    $this->get($downloadUrl)->assertForbidden();
    $this->withSession(['intake_tracking' => ['public_code' => $other->public_code, 'expires_at' => now()->addMinutes(30)->timestamp]])
        ->get($downloadUrl)->assertForbidden();

    $accessUrl = URL::temporarySignedRoute('intake.public.mail-access', now()->addDays(7), ['code' => $intake->public_code]);
    $this->get($accessUrl)->assertRedirect(route('intake.public.status', $intake->public_code));
    $this->get(route('intake.public.status', $intake->public_code))->assertInertia(fn (Assert $page) => $page
        ->where('request.response_documents.0.name', 'constancia.pdf')
        ->where('request.response_documents.0.url', $downloadUrl)
        ->missing('request.response_documents.0.path')
        ->missing('request.timeline.0.internal_comment'));
    $this->get($downloadUrl)->assertDownload('constancia.pdf');
    $this->get(route('intake.public.response.download', [$other->public_code, $file->id]))->assertForbidden();

    $initial = $intake->attachments()->create([
        'type' => 'initial', 'disk' => 'local', 'path' => 'initial.pdf', 'original_name' => 'initial.pdf',
    ]);
    $this->get(route('intake.public.response.download', [$intake->public_code, $initial->id]))->assertNotFound();

    $this->travel(31)->minutes();
    $this->get($downloadUrl)->assertForbidden();
});

test('mail access rejects expired links and altered codes or signatures', function () {
    $intake = IntakeRequest::factory()->create();
    $url = URL::temporarySignedRoute('intake.public.mail-access', now()->addDays(7), ['code' => $intake->public_code]);
    $this->get($url.'broken')->assertRedirect(route('intake.public.track'));
    $this->get(str_replace($intake->public_code, 'FME-2026-999999', $url))
        ->assertRedirect(route('intake.public.track'));
    $this->travel(8)->days();
    $this->get($url)->assertRedirect(route('intake.public.track'));
});

test('response uploads reject oversized files and unauthorized staff without storing them', function () {
    Storage::fake('local');
    $intake = IntakeRequest::factory()->create();
    $url = route('admin.intake.status.update', $intake);
    $payload = [
        '_method' => 'patch',
        'status' => 'finished',
        'response_documents' => [UploadedFile::fake()->create('large.pdf', 10241, 'application/pdf')],
    ];
    $this->actingAs(User::factory()->intakeDepartment()->create())->post($url, $payload)->assertForbidden();
    $this->actingAs(User::factory()->operator()->create())->post($url, $payload)->assertSessionHasErrors('response_documents.0');
    expect($intake->attachments()->count())->toBe(0)
        ->and($intake->histories()->count())->toBe(0)
        ->and(Storage::disk('local')->allFiles())->toBe([]);
});

test('the branded email generates a signed link for this request without exposing personal identifiers', function () {
    $intake = IntakeRequest::factory()->create(['applicant_dni' => '30123456']);
    $mail = new IntakeStatusMail($intake->public_code, IntakeRequestStatus::Pending, false);
    $mail->assertSeeInHtml('Ver mi trámite');
    $mail->assertSeeInHtml('#123d67');
    $mail->assertSeeInHtml('#84bd1a');
    $mail->assertSeeInHtml('fme-04.png');
    $mail->assertDontSeeInHtml('30123456');
    $html = $mail->render();
    preg_match('/href="([^"]*\/mesa-de-entrada\/acceso\/[^"]*)"/', $html, $matches);
    $url = html_entity_decode($matches[1], ENT_QUOTES);
    $this->get($url)->assertRedirect(route('intake.public.status', $intake->public_code));
    $this->get(route('intake.public.status', $intake->public_code))->assertInertia(fn (Assert $page) => $page
        ->where('request.public_code', $intake->public_code));
});
