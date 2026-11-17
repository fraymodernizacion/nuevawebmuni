<?php

use App\Enums\IntakeRequestStatus;
use App\Models\IntakeDepartment;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Models\User;
use App\Support\LocalDateTime;
use Database\Seeders\IntakeModuleSeeder;
use Database\Seeders\IntakeNovemberCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(IntakeModuleSeeder::class);
});

test('the November catalog reloads without duplicates and hides institutional payroll', function () {
    $total = IntakeRequestSubtype::count();
    $this->seed(IntakeNovemberCatalogSeeder::class);

    expect(IntakeRequestSubtype::count())->toBe($total);
    $type = IntakeRequestType::where('slug', 'ambiente')->sole();
    $subtype = $type->subtypes()->where('slug', 'castracion-domiciliaria')->sole();

    $this->get(route('intake.public.create', ['type' => $type->slug, 'subtipo' => $subtype->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->where('initialSubtypeId', $subtype->id));

    $this->get(route('intake.public.create', 'haberes-institucional'))->assertNotFound();
    $this->post(route('intake.public.store', 'haberes-institucional'), [
        'applicant_name' => 'Organismo',
        'applicant_phone' => '3834000000',
        'applicant_dni' => '30123456',
    ])->assertNotFound();
});

test('Punto Digital reservation lists each site and records the selected site for the operator', function () {
    $type = IntakeRequestType::where('slug', 'modernizacion-punto-digital')->sole();
    $subtype = $type->subtypes()->where('slug', 'uso-punto-digital-microcine')->sole();
    $spaces = ['Punto Digital Piedra Blanca', 'Punto Digital La Tercena', 'Punto Digital San Antonio'];
    expect($subtype->name)->toBe('Pedir un espacio en Punto Digital');
    $this->get(route('intake.public.create', ['type' => $type->slug, 'subtipo' => $subtype->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('initialSubtypeId', $subtype->id)
            ->where('type.subtypes', function ($subtypes) use ($subtype, $spaces): bool {
                $selected = collect($subtypes)->firstWhere('id', $subtype->id);

                return collect($selected['schema'] ?? [])->firstWhere('name', 'espacio')['options'] === $spaces;
            }));

    $fields = [
        'institucion' => 'Institución de prueba',
        'espacio' => 'Punto Digital La Tercena',
        'actividad' => 'Capacitación',
        'fecha' => '2027-03-15',
        'desde' => '10:00',
        'duracion' => '2 horas',
        'personas' => '20',
        'equipos' => 'Sin equipamiento adicional',
        'refrigerios' => 'No',
    ];
    $payload = [
        'applicant_name' => 'Persona de prueba',
        'applicant_phone' => '3834000000',
        'applicant_dni' => '30123456',
        'intake_request_subtype_id' => $subtype->id,
        'fields' => $fields,
    ];
    $storeUrl = route('intake.public.store', $type->slug);

    $this->post($storeUrl, [...$payload, 'fields' => [...$fields, 'espacio' => 'Punto Digital']])
        ->assertSessionHasErrors('fields.espacio');
    $this->post($storeUrl, [...$payload, 'fields' => [...$fields, 'espacio' => 'Microcine']])
        ->assertSessionHasErrors('fields.espacio');
    $this->post($storeUrl, $payload)->assertRedirect();

    $intake = IntakeRequest::where('intake_request_subtype_id', $subtype->id)->sole();
    $this->actingAs(User::factory()->operator()->create())
        ->get(route('admin.intake.show', $intake))
        ->assertInertia(fn (Assert $page) => $page->where('request.payload.espacio', 'Punto Digital La Tercena'));
});

test('public tracking starts at the local year and accepts a short number and DNI', function () {
    $intake = IntakeRequest::factory()->create([
        'public_code' => 'FME-2025-000042',
        'applicant_dni' => '30.123.456',
    ]);

    $this->get(route('intake.public.track'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('intake/public/track')
            ->where('currentYear', LocalDateTime::today()->format('Y')));

    $this->post(route('intake.public.track.submit'), [
        'year' => '2025',
        'number' => '42',
        'applicant_dni' => '30123456',
    ])->assertRedirect(route('intake.public.status', $intake->public_code));

    $this->get(route('intake.public.status', $intake->public_code))->assertInertia(fn (Assert $page) => $page
        ->component('intake/public/status')
        ->where('request.public_code', $intake->public_code)
        ->missing('request.applicant_dni'));

    $this->post(route('intake.public.track.submit'), [
        'year' => '2026',
        'number' => 'FME-2025-000042',
        'applicant_dni' => '30123456',
    ])->assertRedirect(route('intake.public.status', $intake->public_code));

    $this->post(route('intake.public.track.submit'), [
        'year' => '2025',
        'number' => '42',
        'applicant_dni' => '30123457',
    ])->assertSessionHasErrors('number');

    $this->post(route('intake.public.track.submit'), [
        'year' => '2025',
        'number' => '42',
        'applicant_phone' => $intake->applicant_phone,
    ])->assertSessionHasErrors('applicant_dni');

    $this->post(route('intake.public.track.submit'), [
        'year' => '2025',
        'number' => '42',
        'applicant_dni' => '30.123.456',
    ])->assertSessionHasErrors('applicant_dni');
});

test('public tracking highlights the latest public reply and keeps the request answered', function () {
    $intake = IntakeRequest::factory()->create([
        'public_code' => 'FME-2026-000042',
        'applicant_dni' => '30123456',
        'status' => IntakeRequestStatus::Answered,
    ]);
    $time = now()->startOfMinute();
    $received = $intake->histories()->create([
        'action' => 'created',
        'to_status' => IntakeRequestStatus::Received,
        'public_comment' => 'Solicitud recibida.',
        'changed_at' => $time->copy()->subMinute(),
    ]);
    $previous = $intake->histories()->create([
        'action' => 'status_changed',
        'to_status' => IntakeRequestStatus::Answered,
        'public_comment' => 'Vamos a confirmar la fecha.',
        'changed_at' => $time,
    ]);
    $reply = $intake->histories()->create([
        'action' => 'status_changed',
        'to_status' => IntakeRequestStatus::Answered,
        'public_comment' => 'Su pago se realizará el próximo lunes.',
        'changed_at' => $time,
    ]);
    $latest = $intake->histories()->create([
        'action' => 'status_changed',
        'to_status' => IntakeRequestStatus::Answered,
        'internal_comment' => 'Nota reservada del operador.',
        'changed_at' => $time->copy()->addMinute(),
    ]);

    $this->post(route('intake.public.track.submit'), [
        'year' => '2026',
        'number' => '42',
        'applicant_dni' => '30123456',
    ])->assertRedirect();

    $this->get(route('intake.public.status', $intake->public_code))->assertInertia(fn (Assert $page) => $page
        ->component('intake/public/status')
        ->where('request.status_code', 'answered')
        ->where('request.updated_at', LocalDateTime::format($latest->changed_at))
        ->where('request.response.id', $reply->id)
        ->where('request.response.text', $reply->public_comment)
        ->where('request.response.date', LocalDateTime::format($reply->changed_at))
        ->where('request.timeline.0.id', $latest->id)
        ->where('request.timeline.0.comment', null)
        ->missing('request.timeline.0.internal_comment')
        ->where('request.timeline.1.id', $reply->id)
        ->where('request.timeline.2.id', $previous->id)
        ->where('request.timeline.3.id', $received->id));
});

test('public tracking uses only current documentation instructions in the highlighted message', function () {
    $intake = IntakeRequest::factory()->create([
        'public_code' => 'FME-2026-000042',
        'applicant_dni' => '30123456',
        'status' => IntakeRequestStatus::NeedsDocumentation,
    ]);
    $intake->histories()->create([
        'action' => 'status_changed',
        'to_status' => IntakeRequestStatus::Answered,
        'public_comment' => 'Su solicitud está en curso.',
        'changed_at' => now()->subMinute(),
    ]);
    $documentation = $intake->histories()->create([
        'action' => 'status_changed',
        'to_status' => IntakeRequestStatus::NeedsDocumentation,
        'changed_at' => now(),
    ]);
    $payload = ['year' => '2026', 'number' => '42', 'applicant_dni' => '30123456'];

    $this->post(route('intake.public.track.submit'), $payload)->assertRedirect();
    $statusUrl = route('intake.public.status', $intake->public_code);
    $this->get($statusUrl)
        ->assertInertia(fn (Assert $page) => $page
            ->where('request.status_code', 'needs_documentation')
            ->where('request.response', null));

    $documentation->update(['public_comment' => 'Presentá una copia de la factura en Mesa de Entrada.']);

    $this->get($statusUrl)
        ->assertInertia(fn (Assert $page) => $page
            ->where('request.response.id', $documentation->id)
            ->where('request.response.text', $documentation->public_comment));
});

test('the verified applicant can send requested documents once and Mesa de Entrada can download them', function () {
    Storage::fake('local');
    $intake = IntakeRequest::factory()->create([
        'public_code' => 'FME-2026-000042',
        'applicant_dni' => '30123456',
        'status' => IntakeRequestStatus::NeedsDocumentation,
    ]);
    $second = IntakeRequest::factory()->create(['status' => IntakeRequestStatus::NeedsDocumentation]);
    $history = $intake->histories()->create([
        'to_status' => IntakeRequestStatus::NeedsDocumentation,
        'action' => 'status_changed',
        'public_comment' => 'Adjuntá la factura.',
        'changed_at' => now(),
    ]);
    $statusUrl = route('intake.public.status', $intake->public_code);
    $uploadUrl = route('intake.public.documentation.store', $intake->public_code);
    $trackUrl = route('intake.public.track');
    $payload = [
        'documentation_request_id' => $history->id,
        'attachments' => [UploadedFile::fake()->create('factura.pdf', 3072, 'application/pdf')],
    ];

    $this->get($statusUrl)->assertRedirect($trackUrl);
    $this->post($uploadUrl, $payload)->assertRedirect($trackUrl);
    $this->get(route('intake.public.status', 'FME-2026-999999'))->assertRedirect($trackUrl);

    $this->post(route('intake.public.track.submit'), [
        'year' => '2026',
        'number' => '42',
        'applicant_dni' => '30123456',
    ])->assertRedirect($statusUrl);

    $this->post(route('intake.public.documentation.store', $second->public_code), $payload)->assertRedirect($trackUrl);
    $this->get($statusUrl)->assertInertia(fn (Assert $page) => $page
        ->where('request.documentation_request_id', $history->id)
        ->where('request.documentation_received', false));

    $this->from($statusUrl)->post($uploadUrl, [
        ...$payload,
        'attachments' => [UploadedFile::fake()->create('factura.pdf', 10241, 'application/pdf')],
    ])->assertRedirect($statusUrl)->assertSessionHasErrors('attachments.0');

    $this->post($uploadUrl, [...$payload, 'documentation_request_id' => $history->id + 1])
        ->assertRedirect($statusUrl)
        ->assertSessionHasErrors('documentation_request_id');
    expect($intake->attachments()->count())->toBe(0);

    $this->post($uploadUrl, $payload)->assertRedirect($statusUrl);
    $this->get($statusUrl)->assertInertia(fn (Assert $page) => $page
        ->where('request.status_code', 'under_review')
        ->where('request.documentation_received', true)
        ->where('request.documentation_request_id', null)
        ->where('request.response', null)
        ->where('request.timeline.0.action', 'documentation_received'));

    $this->post($uploadUrl, $payload)->assertSessionHasErrors('documentation_request_id');
    $attachment = $intake->attachments()->sole();
    expect($attachment->type)->toBe('supplemental');
    Storage::disk('local')->assertExists($attachment->path);
    $this->get($attachment->url())->assertRedirect();

    $operator = User::factory()->operator()->create();
    $this->actingAs($operator)->get(route('admin.intake.show', $intake))
        ->assertInertia(fn (Assert $page) => $page->where('request.attachments.0.type', 'supplemental'));
    $this->get($attachment->url())->assertDownload('factura.pdf');

    $this->travel(30)->minutes();
    $this->get($statusUrl)->assertRedirect($trackUrl);
    $this->post($uploadUrl, $payload)->assertRedirect($trackUrl);
});

test('event coverage keeps one code and suggests both areas, with private attachments', function () {
    Storage::fake('local');
    $type = IntakeRequestType::where('slug', 'eventos')->sole();
    $subtype = $type->subtypes()->where('slug', 'cobertura-eventos')->sole();
    $payload = [
        'applicant_name' => 'Organización local',
        'applicant_phone' => '3834000000',
        'applicant_dni' => '30123456',
        'intake_request_subtype_id' => $subtype->id,
        'fields' => [
            'cobertura' => 'Tránsito y Guardia Urbana',
            'lugar' => 'Plaza principal',
            'fecha' => '2027-03-15',
            'desde' => '10:00',
            'hasta' => '12:00',
            'personas' => '80',
            'detalle' => 'Cobertura de un acto',
        ],
        'attachments' => [UploadedFile::fake()->create('croquis.pdf', 3072, 'application/pdf')],
    ];

    $this->post(route('intake.public.store', $type->slug), [
        ...$payload,
        'fields' => [...$payload['fields'], 'cobertura' => 'Opción inválida', 'fecha' => 'mañana'],
    ])->assertSessionHasErrors(['fields.cobertura', 'fields.fecha']);

    $this->post(route('intake.public.store', $type->slug), [
        ...$payload,
        'attachments' => [UploadedFile::fake()->create('muy-grande.pdf', 10241, 'application/pdf')],
    ])->assertSessionHasErrors('attachments.0');

    $response = $this->post(route('intake.public.store', $type->slug), $payload)->assertRedirect();
    $intake = IntakeRequest::where('intake_request_subtype_id', $subtype->id)->sole();
    $this->get($response->headers->get('Location'))->assertSuccessful();
    $this->get(route('intake.public.received', $intake))->assertForbidden();

    $attachment = $intake->attachments()->sole();
    expect($attachment->disk)->toBe('local');
    Storage::disk('local')->assertExists($attachment->path);
    $this->get($attachment->url())->assertRedirect();

    $operator = User::factory()->operator()->create();
    $details = $this->actingAs($operator)->get(route('admin.intake.show', $intake));
    $details->assertInertia(fn (Assert $page) => $page->has('suggestedAssistanceIds', 2));
    $suggestions = $details->inertiaProps()['suggestedAssistanceIds'];
    $this->get($attachment->url())->assertDownload('croquis.pdf');

    $this->post(route('admin.intake.derivations.store', $intake), [
        'assistance_type_ids' => $suggestions,
    ])->assertRedirect();

    expect($intake->derivations()->with('department')->get()->pluck('department.slug')->sort()->values()->all())
        ->toBe(['guardia-urbana', 'transito']);

    $unassignedArea = IntakeDepartment::where('slug', 'bromatologia')->sole();
    $this->actingAs(User::factory()->intakeDepartment()->create(['intake_department_id' => $unassignedArea->id]))
        ->get($attachment->url())->assertForbidden();
});
