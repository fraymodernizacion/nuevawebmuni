<?php

use App\Models\InventoryItem;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can open the inventory management page', function () {
    $admin = User::factory()->admin()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-TEST-001',
        'name' => 'Luminaria de prueba',
        'qr_value' => 'ALU-TEST-001',
        'current_stock' => 3,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.inventory.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/admin/index')
            ->where('items.data.0.code', $item->code)
            ->where('summary.total_items', 1),
        );
});

test('admin can create an inventory item', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.inventory.store'), [
            'code' => 'ALU-NEW-001',
            'name' => 'Nuevo insumo',
            'description' => 'Material de prueba',
            'unit' => 'unidad',
            'current_stock' => 10,
            'minimum_stock' => 2,
            'active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inventory_items', [
        'code' => 'ALU-NEW-001',
        'qr_value' => 'ALU-NEW-001',
        'name' => 'Nuevo insumo',
    ]);
});

test('crew users cannot access inventory management', function () {
    $crewUser = User::factory()->crewMember()->create();

    $this->actingAs($crewUser)
        ->get(route('admin.inventory.index'))
        ->assertForbidden();
});
