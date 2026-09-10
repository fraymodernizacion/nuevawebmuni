<?php

use App\Enums\ComplaintStatus;
use App\Enums\WorkRouteStatus;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use App\Models\Crew;
use App\Models\Locality;
use App\Models\OperationalZone;
use App\Models\User;
use App\Models\WorkRoute;
use Database\Seeders\ComplaintModuleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(ComplaintModuleSeeder::class);
});

test('public lighting complaint form is available', function () {
    $this->get(route('complaints.public.create', ['category' => 'alumbrado-publico']))->assertOk();
});

test('public lighting complaint short URL redirects to the active form', function () {
    $this->get('/reclamos/alumbrado')
        ->assertRedirect('/reclamos/alumbrado-publico');
});

test('citizen can create public lighting complaint and it is assigned to locality zone', function () {
    $type = ComplaintType::where('name', 'Luminaria apagada')->firstOrFail();

    $response = $this->post(route('complaints.public.store', ['category' => 'alumbrado-publico']), [
        'full_name' => 'Ana Gómez',
        'dni' => '30.123.456',
        'phone' => '383 400 0000',
        'complaint_type_id' => $type->id,
        'location_reference' => 'Frente a la plaza',
        'latitude' => -28.3875664,
        'longitude' => -65.7009248,
    ]);

    $complaint = Complaint::firstOrFail();
    $locality = Locality::with('operationalZone')->where('name', 'San José')->firstOrFail();

    $response->assertRedirect(route('complaints.public.received', $complaint));
    expect($complaint->public_code)->toStartWith('ALU-'.now()->format('Y').'-')
        ->and($complaint->locality_id)->toBe($locality->id)
        ->and($complaint->operational_zone_id)->toBe($locality->operational_zone_id)
        ->and($complaint->first_name)->toBe('Ana')
        ->and($complaint->last_name)->toBe('Gómez')
        ->and($complaint->dni)->toBe('30123456')
        ->and($complaint->phone)->toBe('543834000000')
        ->and($complaint->current_status)->toBe(ComplaintStatus::New)
        ->and($complaint->statusHistories()->where('action', 'created')->exists())->toBeTrue();
});

test('public tracking requires matching phone', function () {
    $complaint = Complaint::factory()->create(['phone' => '3834000000']);

    $this->post(route('complaints.public.track.submit'), [
        'public_code' => $complaint->public_code,
        'phone' => 'otro',
    ])->assertSessionHasErrors('public_code');

    $this->post(route('complaints.public.track.submit'), [
        'public_code' => $complaint->public_code,
        'phone' => '3834000000',
    ])->assertOk();
});

test('public tracking shows complaint details and public observations', function () {
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'phone' => '3834555000',
        'street' => 'Av. La Callecita',
        'street_number' => '123',
        'neighborhood' => 'Centro',
        'location_reference' => 'Frente a la plaza principal',
        'description' => 'La luminaria parpadea durante la noche.',
        'current_status' => ComplaintStatus::InProgress,
    ]);

    $complaint->statusHistories()->create([
        'from_status' => ComplaintStatus::Assigned,
        'to_status' => ComplaintStatus::InProgress,
        'action' => 'intervention',
        'observation' => 'La cuadrilla reviso el tablero y volvera con repuesto.',
        'changed_at' => now(),
    ]);

    $this->post(route('complaints.public.track.submit'), [
        'public_code' => $complaint->public_code,
        'phone' => '3834555000',
    ])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/public/status')
            ->where('complaint.public_code', $complaint->public_code)
            ->where('complaint.description', 'La luminaria parpadea durante la noche.')
            ->where('complaint.location.locality', $locality->name)
            ->where('complaint.location.reference', 'Frente a la plaza principal')
            ->where('complaint.timeline.0.observation', 'La cuadrilla reviso el tablero y volvera con repuesto.'),
        );
});

test('admin can open complaint detail page', function () {
    $admin = User::factory()->admin()->create();
    $zone = OperationalZone::where('code', 'B')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.complaints.show', $complaint))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/admin/show')
            ->where('complaint.public_code', $complaint->public_code),
        );
});

test('complaint management index exposes operational summary and filters by status ordered by age', function () {
    $admin = User::factory()->admin()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $olderComplaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'current_status' => ComplaintStatus::New,
        'created_at' => now()->subDays(5),
    ]);
    $newerComplaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'current_status' => ComplaintStatus::New,
        'created_at' => now(),
    ]);
    Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.complaints.index', [
            'status' => ComplaintStatus::New->value,
            'order' => 'oldest',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/admin/index')
            ->where('filters.status', ComplaintStatus::New->value)
            ->where('filters.order', 'oldest')
            ->where('operationalSummary.new', 2)
            ->where('operationalSummary.assigned', 1)
            ->where('complaints.data.0.id', $olderComplaint->id)
            ->where('complaints.data.1.id', $newerComplaint->id)
            ->where('options.statuses.0.value', ComplaintStatus::New->value),
        );
});

test('complaint management search is normalized across code phone locality and problem', function () {
    $admin = User::factory()->admin()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::where('name', 'San José')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('name', 'Cableado visible o en mal estado')->firstOrFail();
    $complaint = Complaint::factory()->create([
        'public_code' => 'ALU-2026-000008',
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'first_name' => 'Matías',
        'last_name' => 'Cardozo',
        'dni' => '30123456',
        'phone' => '543834218946',
        'location_reference' => 'Frente a la plaza',
        'current_status' => ComplaintStatus::New,
    ]);

    foreach (['ALU2026000008', '30123456', '3834 218946', 'san jose', 'matias san jose', 'matías san josé', 'cable'] as $search) {
        $this->actingAs($admin)
            ->get(route('admin.complaints.index', ['search' => $search]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('complaints/admin/index')
                ->where('complaints.data.0.id', $complaint->id),
            );
    }
});

test('crew leader can open assigned complaint detail page', function () {
    $crew = Crew::firstOrFail();
    $crewLeader = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => $crew->id,
    ]);

    $this->actingAs($crewLeader)
        ->get(route('crew.work.show', $complaint))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/crew/show')
            ->where('complaint.public_code', $complaint->public_code)
            ->has('responseOptions')
            ->where('responseOptions.0.code', 'falta_insumos'),
        );
});

test('crew work index only exposes assigned pending complaints on the map', function () {
    $crew = Crew::firstOrFail();
    $crewLeader = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $otherCrew = Crew::factory()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();

    $assignedComplaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => $crew->id,
        'current_status' => ComplaintStatus::Assigned,
        'latitude' => -28.39,
        'longitude' => -65.7,
    ]);
    Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => $otherCrew->id,
        'current_status' => ComplaintStatus::Assigned,
        'latitude' => -28.38,
        'longitude' => -65.71,
    ]);
    WorkRoute::factory()->create([
        'date' => today(),
        'operational_zone_id' => $zone->id,
        'crew_id' => $crew->id,
        'created_by' => $crewLeader->id,
        'status' => WorkRouteStatus::Planned,
    ]);

    $this->actingAs($crewLeader)
        ->get(route('crew.work.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/crew/index')
            ->where('summary.pending', 1)
            ->where('routePlanningEnabled', false)
            ->where('todayRoute', null)
            ->has('pendingMapComplaints', 1)
            ->where('pendingMapComplaints.0.id', $assignedComplaint->id),
        );
});

test('complaint manager work index exposes new unassigned complaints', function () {
    $operator = User::factory()->operator()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => null,
        'current_status' => ComplaintStatus::New,
        'latitude' => -28.39,
        'longitude' => -65.7,
    ]);

    $this->actingAs($operator)
        ->get(route('crew.work.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/crew/index')
            ->where('canManageComplaintOperations', true)
            ->where('summary.pending', 1)
            ->has('complaints', 1)
            ->where('complaints.0.id', $complaint->id)
            ->has('pendingMapComplaints', 1)
            ->where('pendingMapComplaints.0.id', $complaint->id),
        );
});

test('complaint manager can intervene unassigned complaint', function () {
    $operator = User::factory()->operator()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => null,
        'current_status' => ComplaintStatus::New,
    ]);

    $this->actingAs($operator)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::InProgress->value,
            'observations' => 'Reclamo tomado por jefatura de reclamos.',
            'photo_type' => 'intervention',
        ])
        ->assertRedirect();

    $intervention = $complaint->interventions()->firstOrFail();

    expect($complaint->fresh()->current_status)->toBe(ComplaintStatus::InProgress)
        ->and($intervention->crew_id)->toBeNull()
        ->and($intervention->user_id)->toBe($operator->id);
});

test('assigned second visit stays visible in crew work without a route', function () {
    $crew = Crew::firstOrFail();
    $crewLeader = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => $crew->id,
        'current_status' => ComplaintStatus::NeedsSecondVisit,
    ]);

    $this->actingAs($crewLeader)
        ->get(route('crew.work.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/crew/index')
            ->where('summary.pending', 1)
            ->has('complaints', 1)
            ->where('complaints.0.id', $complaint->id)
            ->where('complaints.0.current_status', ComplaintStatus::NeedsSecondVisit->value),
        );
});

test('route planning stays disabled by default for the mvp', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.complaints.planning'))
        ->assertNotFound();

    $this->actingAs($admin)
        ->get(route('admin.complaints.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/admin/dashboard')
            ->where('routePlanningEnabled', false),
        );
});

test('admin can create work route with multiple complaints', function () {
    config(['complaints.route_planning_enabled' => true]);

    $admin = User::factory()->admin()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $crew = Crew::firstOrFail();
    $complaints = Complaint::factory()
        ->count(2)
        ->create([
            'complaint_category_id' => $category->id,
            'complaint_type_id' => $type->id,
            'locality_id' => $locality->id,
            'operational_zone_id' => $zone->id,
        ]);

    $this->actingAs($admin)
        ->post(route('admin.complaints.planning.routes.store'), [
            'date' => today()->toDateString(),
            'operational_zone_id' => $zone->id,
            'crew_id' => $crew->id,
            'complaint_ids' => $complaints->pluck('id')->all(),
        ])
        ->assertRedirect();

    expect($complaints->first()->fresh()->assigned_crew_id)->toBe($crew->id);
});

test('crew leader can create work route', function () {
    config(['complaints.route_planning_enabled' => true]);

    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $crew = Crew::firstOrFail();
    $crewLeader = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
    ]);

    $this->actingAs($crewLeader)
        ->post(route('admin.complaints.planning.routes.store'), [
            'date' => today()->toDateString(),
            'operational_zone_id' => $zone->id,
            'crew_id' => $crew->id,
            'complaint_ids' => [$complaint->id],
        ])
        ->assertRedirect();

    expect($complaint->fresh()->assigned_crew_id)->toBe($crew->id);
});

test('operator cannot create work route', function () {
    config(['complaints.route_planning_enabled' => true]);

    $operator = User::factory()->operator()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $crew = Crew::firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
    ]);

    $this->actingAs($operator)
        ->post(route('admin.complaints.planning.routes.store'), [
            'date' => today()->toDateString(),
            'operational_zone_id' => $zone->id,
            'crew_id' => $crew->id,
            'complaint_ids' => [$complaint->id],
        ])
        ->assertForbidden();
});

test('complaints dashboard exposes management capability by role', function (string $role, bool $expected) {
    $user = match ($role) {
        'admin' => User::factory()->admin()->create(),
        'operator' => User::factory()->operator()->create(),
        'crew' => User::factory()->crewMember()->create(),
    };

    $this->actingAs($user)
        ->get(route('admin.complaints.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('complaints/admin/dashboard')
            ->where('canManageComplaints', $expected),
        );
})->with([
    'admin' => ['admin', true],
    'operator' => ['operator', true],
    'crew leader' => ['crew', false],
]);

test('crew leader can finish todays route with pending complaints', function () {
    config(['complaints.route_planning_enabled' => true]);

    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $crew = Crew::firstOrFail();
    $crewLeader = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $route = WorkRoute::factory()->create([
        'date' => today(),
        'operational_zone_id' => $zone->id,
        'crew_id' => $crew->id,
        'created_by' => $crewLeader->id,
        'status' => WorkRouteStatus::Planned,
    ]);

    $this->actingAs($crewLeader)
        ->patch(route('crew.work.routes.finish', $route))
        ->assertRedirect();

    expect($route->fresh()->status)->toBe(WorkRouteStatus::Finished)
        ->and($route->fresh()->finished_at)->not->toBeNull();
});

test('crew leader cannot finish another crews route', function () {
    config(['complaints.route_planning_enabled' => true]);

    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $crew = Crew::firstOrFail();
    $otherCrew = Crew::factory()->create();
    $crewLeader = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $route = WorkRoute::factory()->create([
        'date' => today(),
        'operational_zone_id' => $zone->id,
        'crew_id' => $otherCrew->id,
        'created_by' => $crewLeader->id,
        'status' => WorkRouteStatus::Planned,
    ]);

    $this->actingAs($crewLeader)
        ->patch(route('crew.work.routes.finish', $route))
        ->assertForbidden();
});

test('admin cannot create work route with complaints from another zone', function () {
    config(['complaints.route_planning_enabled' => true]);

    $admin = User::factory()->admin()->create();
    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $otherZone = OperationalZone::where('code', 'B')->firstOrFail();
    $locality = Locality::whereBelongsTo($otherZone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();
    $crew = Crew::firstOrFail();
    $complaint = Complaint::factory()->create([
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $otherZone->id,
    ]);

    $this->actingAs($admin)
        ->from(route('admin.complaints.planning', ['zone' => $zone->id]))
        ->post(route('admin.complaints.planning.routes.store'), [
            'date' => today()->toDateString(),
            'operational_zone_id' => $zone->id,
            'crew_id' => $crew->id,
            'complaint_ids' => [$complaint->id],
        ])
        ->assertRedirect(route('admin.complaints.planning', ['zone' => $zone->id]))
        ->assertSessionHasErrors('complaint_ids');
});
