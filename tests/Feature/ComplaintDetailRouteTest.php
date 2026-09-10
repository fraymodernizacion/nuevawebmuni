<?php

use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use App\Models\Crew;
use App\Models\Locality;
use App\Models\OperationalZone;
use App\Models\User;
use Database\Seeders\ComplaintModuleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(ComplaintModuleSeeder::class);
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
            ->where('complaint.public_code', $complaint->public_code),
        );
});
