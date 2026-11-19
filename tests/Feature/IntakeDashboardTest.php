<?php

use App\Enums\IntakeRequestStatus;
use App\Models\IntakeDepartment;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(fn () => $this->withoutVite());

test('the dashboard is restricted to intake management users', function () {
    $this->get(route('admin.intake.dashboard'))->assertRedirect(route('login'));
    $this->actingAs(User::factory()->intakeDepartment()->create())
        ->get(route('admin.intake.dashboard'))->assertForbidden();
    $this->actingAs(User::factory()->operator()->create())
        ->get(route('admin.intake.dashboard'))->assertSuccessful();
});

test('the dashboard counts each request once and separates completion from historical answers', function () {
    $type = IntakeRequestType::factory()->create();
    foreach (IntakeRequestStatus::cases() as $status) {
        IntakeRequest::factory()->create([
            'intake_request_type_id' => $type->id,
            'status' => $status,
            'created_at' => '2026-10-15 12:00:00',
            'applicant_dni' => '30123456',
            'internal_notes' => 'No debe exponerse en el informe.',
        ]);
    }
    $this->actingAs(User::factory()->operator()->create())
        ->get(route('admin.intake.dashboard', ['year' => 2026, 'month' => 10]))
        ->assertInertia(fn (Assert $page) => $page->component('intake/admin/dashboard')
            ->where('summary', ['total' => 9, 'finished' => 1, 'in_progress' => 6, 'rejected' => 1, 'suspended' => 1])
            ->has('statuses', 9)->where('statuses.8.label', 'Respondido (histórico)')
            ->where('statuses.8.total', 1)->where('monthly.9.total', 9)
            ->where('types.0.total', 9)->where('secretariats.0.label', 'Sin secretaría asignada')
            ->where('secretariats.0.total', 9)
            ->missing('requests')->missing('applicant_dni')->missing('internal_notes'));
});

test('period boundaries and monthly counts follow municipal local time', function () {
    $type = IntakeRequestType::factory()->create();
    foreach (['2026-10-01 02:59:59', '2026-10-01 03:00:00', '2026-11-01 02:59:59', '2026-11-01 03:00:00', '2027-01-01 02:59:59', '2027-01-01 03:00:00'] as $timestamp) {
        IntakeRequest::factory()->create(['intake_request_type_id' => $type->id, 'created_at' => $timestamp]);
    }
    $this->actingAs(User::factory()->operator()->create())
        ->get(route('admin.intake.dashboard', ['year' => 2026, 'month' => 10]))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 2)
            ->where('period', ['from' => '01/10/2026', 'to' => '31/10/2026'])
            ->where('monthly.8.total', 1)->where('monthly.9.total', 2)
            ->where('monthly.10.total', 1)->where('monthly.11.total', 1));
    $this->get(route('admin.intake.dashboard', ['year' => 2026]))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 5));
});

test('secretariat demand deduplicates departments and allows requests assigned to multiple secretariats', function () {
    $operator = User::factory()->operator()->create();
    $request = IntakeRequest::factory()->create(['created_at' => '2026-10-15 12:00:00']);
    $unassigned = IntakeRequest::factory()->create(['created_at' => '2026-10-15 12:00:00']);
    foreach (['Obras Públicas', 'Obras Públicas', 'Gobierno'] as $index => $name) {
        $department = IntakeDepartment::factory()->create(['slug' => 'area-'.$index, 'name' => 'Área '.$index, 'secretariat' => $name]);
        $request->derivations()->create(['intake_department_id' => $department->id, 'created_by' => $operator->id]);
    }
    $this->actingAs($operator)->get(route('admin.intake.dashboard', ['year' => 2026, 'month' => 10]))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 2)->has('secretariats', 3)
            ->where('secretariats.0.total', 1)->where('secretariats.1.total', 1)->where('secretariats.2.total', 1));
    $this->get(route('admin.intake.dashboard', ['year' => 2026, 'month' => 10, 'secretariat' => 'Obras Públicas']))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 1)->has('secretariats', 1)
            ->where('secretariats.0.label', 'Obras Públicas')->where('secretariats.0.total', 1)
            ->where('monthly.9.total', 1));
    $this->get(route('admin.intake.dashboard', ['year' => 2026, 'month' => 10, 'secretariat' => '__unassigned']))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 1)->has('secretariats', 1)
            ->where('secretariats.0.value', '__unassigned'));
});

test('type breakdown uses subprocedures and groups the remaining types without losing requests', function () {
    $type = IntakeRequestType::factory()->create();
    for ($i = 1; $i <= 7; $i++) {
        $subtype = IntakeRequestSubtype::factory()->create(['intake_request_type_id' => $type->id, 'name' => 'Subtrámite '.$i]);
        IntakeRequest::factory()->count($i)->create([
            'intake_request_type_id' => $type->id, 'intake_request_subtype_id' => $subtype->id,
            'created_at' => '2026-10-15 12:00:00',
        ]);
    }
    $this->actingAs(User::factory()->operator()->create())
        ->get(route('admin.intake.dashboard', ['year' => 2026, 'month' => 10]))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 28)
            ->has('types', 6)->where('types.0.label', 'Subtrámite 7')->where('types.0.total', 7)
            ->where('types.5.label', 'Otros trámites')->where('types.5.total', 3));
});

test('empty reports return zero counts for every state and month', function () {
    $this->actingAs(User::factory()->operator()->create())->get(route('admin.intake.dashboard', ['year' => 2026]))
        ->assertInertia(fn (Assert $page) => $page->where('summary.total', 0)->where('summary.in_progress', 0)
            ->has('statuses', 8)->has('types', 0)->has('secretariats', 0)
            ->has('monthly', 12)->where('monthly.0.total', 0)->where('monthly.11.total', 0));
});

test('invalid report dates are rejected before querying', function (array $filters, string $field) {
    $this->actingAs(User::factory()->operator()->create())->getJson(route('admin.intake.dashboard', $filters))
        ->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    [['year' => 'invalid'], 'year'],
    [['year' => 2101], 'year'],
    [['month' => 13], 'month'],
    [['month' => 0], 'month'],
    [['secretariat' => str_repeat('a', 256)], 'secretariat'],
]);
