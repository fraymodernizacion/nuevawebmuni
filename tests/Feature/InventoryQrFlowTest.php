<?php

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest scanning an inventory qr is sent to login with intended url preserved', function () {
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-LUM-001',
        'qr_value' => 'ALU-LUM-001',
    ]);

    $this->get(route('inventory.qr.show', ['code' => $item->code]))
        ->assertRedirect(route('login'))
        ->assertSessionHas('url.intended', route('inventory.qr.show', ['code' => $item->code]));
});

test('operative user can open the mobile quick movement screen from qr code', function () {
    $crewUser = User::factory()->crewMember()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-LUM-002',
        'name' => 'Luminaria LED 100W',
        'qr_value' => 'ALU-LUM-002',
        'current_stock' => 4,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($crewUser)
        ->get(route('inventory.qr.show', ['code' => $item->code]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/quick/show')
            ->where('item.code', 'ALU-LUM-002')
            ->where('item.current_stock', 4)
            ->where('permissions.can_exit', true)
            ->where('permissions.can_entry', false)
            ->where('permissions.can_recycled', true),
        );
});

test('qr screen shows a clear message when the item code does not exist', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('inventory.qr.show', ['code' => 'ALU-NOPE-404']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/quick/show')
            ->where('code', 'ALU-NOPE-404')
            ->where('item', null),
        );
});

test('operative user can record an exit that leaves negative stock and backend audits the movement', function () {
    $crewUser = User::factory()->crewMember()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-LUM-003',
        'qr_value' => 'ALU-LUM-003',
        'current_stock' => 1,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($crewUser)
        ->withServerVariables([
            'REMOTE_ADDR' => '10.0.0.25',
            'HTTP_USER_AGENT' => 'Municipal QR Scanner',
        ])
        ->post(route('inventory.qr.movements.store', ['code' => $item->code]), [
            'movement_type' => 'exit',
            'quantity' => 3,
            'reference' => 'REC-2026-0001',
            'reason' => 'Reparacion urgente',
        ])
        ->assertRedirect(route('inventory.qr.show', ['code' => $item->code]));

    $movement = InventoryMovement::query()->whereBelongsTo($item)->firstOrFail();

    expect($item->refresh()->current_stock)->toBe('-2.00')
        ->and($movement->user_id)->toBe($crewUser->id)
        ->and($movement->movement_type)->toBe('exit')
        ->and($movement->quantity)->toBe('3.00')
        ->and($movement->stock_before)->toBe('1.00')
        ->and($movement->stock_after)->toBe('-2.00')
        ->and($movement->metadata['inventory_item_code'])->toBe('ALU-LUM-003')
        ->and($movement->metadata['reference'])->toBe('REC-2026-0001')
        ->and($movement->metadata['ip_address'])->toBe('10.0.0.25')
        ->and($movement->metadata['user_agent'])->toBe('Municipal QR Scanner');
});

test('operative user cannot record inventory entries but warehouse manager can', function () {
    $crewUser = User::factory()->crewMember()->create();
    $warehouseManager = User::factory()->warehouseManager()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-CAB-001',
        'qr_value' => 'ALU-CAB-001',
        'current_stock' => 5,
    ]);

    $this->actingAs($crewUser)
        ->post(route('inventory.qr.movements.store', ['code' => $item->code]), [
            'movement_type' => 'entry',
            'quantity' => 2,
        ])
        ->assertSessionHasErrors('movement_type');

    expect($item->refresh()->current_stock)->toBe('5.00')
        ->and(InventoryMovement::query()->whereBelongsTo($item)->count())->toBe(0);

    $this->actingAs($warehouseManager)
        ->post(route('inventory.qr.movements.store', ['code' => $item->code]), [
            'movement_type' => 'entry',
            'quantity' => 2,
            'reason' => 'Reposicion de deposito',
        ])
        ->assertRedirect(route('inventory.qr.show', ['code' => $item->code]));

    expect($item->refresh()->current_stock)->toBe('7.00')
        ->and(InventoryMovement::query()->whereBelongsTo($item)->where('movement_type', 'entry')->count())->toBe(1);
});
