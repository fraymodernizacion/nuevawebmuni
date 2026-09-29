<?php

use App\Enums\ComplaintStatus;
use App\Jobs\SendWhatsAppComplaintNotification;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use App\Models\Crew;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Locality;
use App\Models\OperationalZone;
use App\Models\User;
use Database\Seeders\ComplaintModuleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(ComplaintModuleSeeder::class);
});

test('crew intervention consumes previously withdrawn inventory and records the material usage', function () {
    $crew = Crew::where('code', 'ALU-MANANA')->firstOrFail();
    $crewMember = User::factory()->crewMember()->create([
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
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $inventoryItem = InventoryItem::factory()->create([
        'code' => 'ALU-TEST-001',
        'name' => 'Luminaria de prueba',
        'unit' => 'unidad',
        'current_stock' => 5,
        'minimum_stock' => 1,
        'qr_value' => 'ALU-TEST-001',
    ]);

    $this->actingAs($crewMember)
        ->post(route('inventory.qr.movements.store', ['code' => $inventoryItem->code]), [
            'movement_type' => 'exit',
            'quantity' => 3,
            'reference' => $complaint->public_code,
            'reason' => 'Retiro para reclamo',
        ])
        ->assertRedirect(route('inventory.qr.show', ['code' => $inventoryItem->code]));

    $this->actingAs($crewMember)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::Resolved->value,
            'response_code' => 'resuelto',
            'citizen_message' => 'El reclamo fue intervenido y se encuentra resuelto.',
            'observations' => 'Intervencion completada con consumo de prueba.',
            'internal_supplies_notes' => 'Se uso un insumo de prueba.',
            'materials' => [
                [
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => 2,
                ],
            ],
            'send_whatsapp' => false,
        ])
        ->assertRedirect();

    expect($inventoryItem->refresh()->current_stock)->toBe('2.00')
        ->and(InventoryMovement::query()->where('inventory_item_id', $inventoryItem->id)->where('movement_type', 'provisional_withdrawal')->count())->toBe(1)
        ->and(InventoryMovement::query()->where('inventory_item_id', $inventoryItem->id)->where('movement_type', 'complaint_consumption')->count())->toBe(1)
        ->and($complaint->refresh()->interventions()->count())->toBe(1)
        ->and($complaint->interventions()->first()->response_code)->toBe('resuelto')
        ->and($complaint->interventions()->first()->citizen_message)->toBe('El reclamo fue intervenido y se encuentra resuelto.')
        ->and($complaint->interventions()->first()->materials)->toHaveCount(1)
        ->and($complaint->interventions()->first()->materials->first()->inventory_item_code)->toBe('ALU-TEST-001');

    $withdrawal = InventoryMovement::query()
        ->whereBelongsTo($inventoryItem)
        ->where('movement_type', 'provisional_withdrawal')
        ->firstOrFail();

    $this->actingAs($crewMember)
        ->post(route('inventory.qr.returns.store', ['code' => $inventoryItem->code]), [
            'withdrawal_movement_id' => $withdrawal->id,
            'quantity' => 2,
        ])
        ->assertSessionHasErrors('quantity');

    $this->actingAs($crewMember)
        ->post(route('inventory.qr.returns.store', ['code' => $inventoryItem->code]), [
            'withdrawal_movement_id' => $withdrawal->id,
            'quantity' => 1,
        ])
        ->assertRedirect(route('inventory.qr.show', ['code' => $inventoryItem->code]));

    expect($inventoryItem->refresh()->current_stock)->toBe('3.00')
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->where('movement_type', 'return_surplus')->count())->toBe(1);
});

test('crew intervention rejects material that was not previously withdrawn', function () {
    $crew = Crew::where('code', 'ALU-MANANA')->firstOrFail();
    $crewMember = User::factory()->crewMember()->create([
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
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $inventoryItem = InventoryItem::factory()->create([
        'code' => 'ALU-TEST-003',
        'current_stock' => 5,
        'qr_value' => 'ALU-TEST-003',
    ]);

    $this->actingAs($crewMember)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::Resolved->value,
            'response_code' => 'resuelto',
            'citizen_message' => 'El reclamo fue intervenido y se encuentra resuelto.',
            'materials' => [
                [
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => 1,
                ],
            ],
            'send_whatsapp' => false,
        ])
        ->assertSessionHasErrors('materials');

    expect($inventoryItem->refresh()->current_stock)->toBe('5.00')
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->count())->toBe(0);
});

test('manager can consume a general warehouse withdrawal from a complaint', function () {
    $admin = User::factory()->admin()->create();

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
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $inventoryItem = InventoryItem::factory()->create([
        'code' => 'ALU-GEN-001',
        'name' => 'Cable general retirado',
        'unit' => 'unidad',
        'current_stock' => 5,
        'qr_value' => 'ALU-GEN-001',
    ]);

    $this->actingAs($admin)
        ->post(route('inventory.qr.movements.store', ['code' => $inventoryItem->code]), [
            'movement_type' => 'exit',
            'quantity' => 2,
            'reason' => 'Retiro general desde deposito',
        ])
        ->assertRedirect(route('inventory.qr.show', ['code' => $inventoryItem->code]));

    $this->actingAs($admin)
        ->get(route('crew.work.show', $complaint))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('inventoryItems.0.code', 'ALU-GEN-001')
            ->where('inventoryItems.0.pending_quantity', 2),
        );

    $this->actingAs($admin)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::Resolved->value,
            'response_code' => 'resuelto',
            'citizen_message' => 'El reclamo fue intervenido y se encuentra resuelto.',
            'materials' => [
                [
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => 1,
                ],
            ],
            'send_whatsapp' => false,
        ])
        ->assertRedirect();

    expect($inventoryItem->refresh()->current_stock)->toBe('3.00')
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->where('movement_type', 'provisional_withdrawal')->count())->toBe(1)
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->where('movement_type', 'complaint_consumption')->count())->toBe(1);
});

test('crew member can consume a provisional withdrawal created by another user', function () {
    $crew = Crew::where('code', 'ALU-MANANA')->firstOrFail();
    $crewMember = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);
    $warehouseManager = User::factory()->warehouseManager()->create();

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
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $inventoryItem = InventoryItem::factory()->create([
        'code' => 'ALU-GEN-002',
        'name' => 'Cable retirado por deposito',
        'unit' => 'unidad',
        'current_stock' => 5,
        'qr_value' => 'ALU-GEN-002',
    ]);

    $this->actingAs($warehouseManager)
        ->post(route('inventory.qr.movements.store', ['code' => $inventoryItem->code]), [
            'movement_type' => 'exit',
            'quantity' => 2,
            'reason' => 'Retiro general desde deposito',
        ])
        ->assertRedirect(route('inventory.qr.show', ['code' => $inventoryItem->code]));

    $this->actingAs($crewMember)
        ->get(route('crew.work.show', $complaint))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('inventoryItems.0.code', 'ALU-GEN-002')
            ->where('inventoryItems.0.pending_quantity', 2),
        );

    $this->actingAs($crewMember)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::Resolved->value,
            'response_code' => 'resuelto',
            'citizen_message' => 'El reclamo fue intervenido y se encuentra resuelto.',
            'materials' => [
                [
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => 1,
                ],
            ],
            'send_whatsapp' => false,
        ])
        ->assertRedirect();

    expect($inventoryItem->refresh()->current_stock)->toBe('3.00')
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->where('movement_type', 'provisional_withdrawal')->count())->toBe(1)
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->where('movement_type', 'complaint_consumption')->count())->toBe(1);
});

test('crew intervention sends whatsapp notification with uploaded photo url', function () {
    Bus::fake();
    Storage::fake('public');

    $crew = Crew::where('code', 'ALU-MANANA')->firstOrFail();
    $crewMember = User::factory()->crewMember()->create([
        'primary_crew_id' => $crew->id,
    ]);

    $zone = OperationalZone::where('code', 'A')->firstOrFail();
    $locality = Locality::whereBelongsTo($zone, 'operationalZone')->firstOrFail();
    $category = ComplaintCategory::where('code', 'alumbrado_publico')->firstOrFail();
    $type = ComplaintType::where('complaint_category_id', $category->id)->firstOrFail();

    $complaint = Complaint::factory()->create([
        'public_code' => 'ALU-'.now()->format('Y').'-000777',
        'complaint_category_id' => $category->id,
        'complaint_type_id' => $type->id,
        'locality_id' => $locality->id,
        'operational_zone_id' => $zone->id,
        'assigned_crew_id' => $crew->id,
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $this->actingAs($crewMember)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::InProgress->value,
            'observations' => 'Se reviso la luminaria.',
            'photo_type' => 'intervention',
            'photos' => [
                UploadedFile::fake()->image('intervencion.jpg'),
            ],
            'send_whatsapp' => true,
        ])
        ->assertRedirect();

    expect($complaint->photos()->count())->toBe(1);

    Bus::assertDispatched(SendWhatsAppComplaintNotification::class, function (SendWhatsAppComplaintNotification $job): bool {
        return $job->type === ComplaintStatus::InProgress->value
            && filled($job->context['intervention_photo_url'] ?? null)
            && str_contains((string) $job->context['intervention_photo_url'], '/storage/complaints/ALU-'.now()->format('Y').'-000777/');
    });
});

test('crew intervention rejects decimal material quantities', function () {
    $crew = Crew::where('code', 'ALU-MANANA')->firstOrFail();
    $crewMember = User::factory()->crewMember()->create([
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
        'current_status' => ComplaintStatus::Assigned,
    ]);

    $inventoryItem = InventoryItem::factory()->create([
        'code' => 'ALU-TEST-002',
        'current_stock' => 5,
        'qr_value' => 'ALU-TEST-002',
    ]);

    $this->actingAs($crewMember)
        ->post(route('admin.complaints.interventions.store', $complaint), [
            'status' => ComplaintStatus::Resolved->value,
            'response_code' => 'resuelto',
            'citizen_message' => 'El reclamo fue intervenido y se encuentra resuelto.',
            'materials' => [
                [
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => '1.5',
                ],
            ],
            'send_whatsapp' => false,
        ])
        ->assertSessionHasErrors('materials.0.quantity');

    expect($inventoryItem->refresh()->current_stock)->toBe('5.00')
        ->and(InventoryMovement::query()->whereBelongsTo($inventoryItem)->count())->toBe(0);
});
