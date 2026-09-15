<?php

use App\Enums\ComplaintStatus;
use App\Models\Complaint;
use App\Models\ComplaintType;
use App\Services\Notifications\BuilderBotWhatsAppNotificationService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

test('builderbot service sends message with normalized phone', function (string $rawPhone, string $expectedPhone) {
    Http::preventStrayRequests();
    Http::fake([
        'app.builderbot.cloud/api/v2/bot-id/messages' => Http::response(['id' => 'message-1']),
    ]);

    builderBotConfig();

    $complaint = complaintForWhatsApp();
    $complaint->phone = $rawPhone;

    $result = app(BuilderBotWhatsAppNotificationService::class)
        ->sendComplaintMessage($complaint, ComplaintStatus::Resolved->value);

    expect($result['status'])->toBe('sent')
        ->and($result['recipient'])->toBe($expectedPhone);

    Http::assertSent(function (Request $request) use ($expectedPhone): bool {
        return $request->url() === 'https://app.builderbot.cloud/api/v2/bot-id/messages'
            && $request->hasHeader('x-api-builderbot', 'secret-key')
            && $request['number'] === $expectedPhone
            && $request['checkIfExists'] === false
            && str_contains($request['messages']['content'], 'Estimado/a vecino/a Ana Gomez')
            && str_contains($request['messages']['content'], 'fue resuelto')
            && str_contains($request['messages']['content'], '/reclamos/seguimiento/123')
            && ! str_contains($request['messages']['content'], '/reclamos/recibido/123');
    });
})->with([
    'local number' => ['3834 123456', '5493834123456'],
    'local number with leading zero' => ['03834 123456', '5493834123456'],
    'country code without mobile 9' => ['54 3834 123456', '5493834123456'],
    'country code with plus sign' => ['+54 3834 123456', '5493834123456'],
    'already normalized' => ['5493834123456', '5493834123456'],
]);

test('builderbot service sends resolution photo as media url', function () {
    Http::preventStrayRequests();
    Http::fake([
        'app.builderbot.cloud/api/v2/bot-id/messages' => Http::response(['messageId' => 'message-2']),
    ]);

    builderBotConfig();

    $result = app(BuilderBotWhatsAppNotificationService::class)
        ->sendComplaintMessage(complaintForWhatsApp(), ComplaintStatus::Resolved->value, [
            'resolution_photo_url' => 'https://municipio.test/storage/resuelto.jpg',
        ]);

    expect($result['status'])->toBe('sent')
        ->and($result['external_id'])->toBe('message-2');

    Http::assertSent(function (Request $request): bool {
        return $request['messages']['mediaUrl'] === 'https://municipio.test/storage/resuelto.jpg'
            && str_contains($request['messages']['content'], 'ALU-2026-000123')
            && str_contains($request['messages']['content'], 'fue resuelto');
    });
});

test('builderbot service sends intervention photo as media url and text link', function () {
    Http::preventStrayRequests();
    Http::fake([
        'app.builderbot.cloud/api/v2/bot-id/messages' => Http::response(['messageId' => 'message-4']),
    ]);

    builderBotConfig();

    $result = app(BuilderBotWhatsAppNotificationService::class)
        ->sendComplaintMessage(complaintForWhatsApp(), ComplaintStatus::InProgress->value, [
            'intervention_photo_url' => 'https://municipio.test/storage/intervencion.jpg',
        ]);

    expect($result['status'])->toBe('sent')
        ->and($result['external_id'])->toBe('message-4');

    Http::assertSent(function (Request $request): bool {
        return $request['messages']['mediaUrl'] === 'https://municipio.test/storage/intervencion.jpg'
            && str_contains($request['messages']['content'], 'Foto de la intervencion: https://municipio.test/storage/intervencion.jpg')
            && str_contains($request['messages']['content'], '/reclamos/seguimiento/123');
    });
});

test('builderbot service uses the same payload shape as the provided messages curl', function () {
    Http::preventStrayRequests();
    Http::fake([
        'app.builderbot.cloud/api/v2/bot-id/messages' => Http::response(['messageId' => 'message-3']),
    ]);

    builderBotConfig();

    app(BuilderBotWhatsAppNotificationService::class)
        ->sendComplaintMessage(complaintForWhatsApp(), 'received');

    Http::assertSent(function (Request $request): bool {
        return $request->url() === 'https://app.builderbot.cloud/api/v2/bot-id/messages'
            && $request->hasHeader('x-api-builderbot', 'secret-key')
            && is_array($request['messages'])
            && is_string($request['messages']['content'])
            && $request['number'] === '5493834123456'
            && $request['checkIfExists'] === false;
    });
});

test('builderbot service returns failed when provider rejects the request', function () {
    Http::preventStrayRequests();
    Http::fake([
        'app.builderbot.cloud/api/v2/bot-id/messages' => Http::response([
            'success' => false,
            'error' => 'Invalid number.',
        ], 400),
    ]);

    builderBotConfig();

    $result = app(BuilderBotWhatsAppNotificationService::class)
        ->sendComplaintMessage(complaintForWhatsApp(), 'received');

    expect($result['status'])->toBe('failed')
        ->and($result['recipient'])->toBe('5493834123456')
        ->and($result['error'])->toBe('Invalid number.');
});

function builderBotConfig(): void
{
    config([
        'services.builderbot.base_url' => 'https://app.builderbot.cloud',
        'services.builderbot.bot_id' => 'bot-id',
        'services.builderbot.api_key' => 'secret-key',
        'services.builderbot.check_if_exists' => false,
    ]);
}

function complaintForWhatsApp(): Complaint
{
    $complaint = new Complaint([
        'public_code' => 'ALU-2026-000123',
        'first_name' => 'Ana',
        'last_name' => 'Gomez',
        'phone' => '3834 123456',
        'current_status' => ComplaintStatus::Resolved,
    ]);
    $complaint->id = 123;
    $complaint->exists = true;
    $complaint->setRelation('type', new ComplaintType(['name' => 'Luminaria apagada']));

    return $complaint;
}
