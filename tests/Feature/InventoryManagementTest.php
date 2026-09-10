<?php

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
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
            ->where('items.data.0.category_label', null)
            ->where('summary.total_items', 1),
        );
});

test('admin can create an inventory item with an automatic code from its category', function () {
    $admin = User::factory()->admin()->create();
    InventoryItem::factory()->create([
        'code' => 'ALU-LUM-009',
        'category_code' => 'ALU-LUM',
        'qr_value' => 'ALU-LUM-009',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.inventory.store'), [
            'category_code' => 'ALU-LUM',
            'name' => 'Nuevo insumo',
            'description' => 'Material de prueba',
            'unit' => 'unidad',
            'current_stock' => 10,
            'minimum_stock' => 2,
            'active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inventory_items', [
        'code' => 'ALU-LUM-010',
        'category_code' => 'ALU-LUM',
        'qr_value' => 'ALU-LUM-010',
        'name' => 'Nuevo insumo',
    ]);
});

test('admin sees inventory item categories when creating an item', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.inventory.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/admin/create')
            ->where('categories.0.code', 'ALU-TOM')
            ->where('categories.2.code', 'ALU-LUM')
            ->where('item.code', ''),
        );
});

test('admin stock edits create an inventory movement', function () {
    $admin = User::factory()->admin()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-CAB-001',
        'category_code' => 'ALU-CAB',
        'qr_value' => 'ALU-CAB-001',
        'current_stock' => 10,
        'minimum_stock' => 2,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.inventory.update', $item), [
            'code' => 'ALU-CAB-001',
            'category_code' => 'ALU-CAB',
            'name' => $item->name,
            'description' => $item->description,
            'unit' => $item->unit,
            'current_stock' => 7,
            'minimum_stock' => 2,
            'active' => true,
        ])
        ->assertRedirect(route('admin.inventory.show', $item));

    $movement = InventoryMovement::query()
        ->whereBelongsTo($item)
        ->where('movement_type', 'manual_adjustment')
        ->firstOrFail();

    expect((float) $movement->quantity)->toBe(3.0)
        ->and((float) $movement->stock_before)->toBe(10.0)
        ->and((float) $movement->stock_after)->toBe(7.0)
        ->and($movement->user_id)->toBe($admin->id)
        ->and($movement->metadata['source'])->toBe('inventory_admin_edit');
});

test('admin edits without stock changes do not create inventory movements', function () {
    $admin = User::factory()->admin()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-FOT-001',
        'category_code' => 'ALU-FOT',
        'qr_value' => 'ALU-FOT-001',
        'current_stock' => 4,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.inventory.update', $item), [
            'code' => 'ALU-FOT-001',
            'category_code' => 'ALU-FOT',
            'name' => 'Fotocelula actualizada',
            'description' => $item->description,
            'unit' => $item->unit,
            'current_stock' => 4,
            'minimum_stock' => 1,
            'active' => true,
        ])
        ->assertRedirect(route('admin.inventory.show', $item));

    expect(InventoryMovement::query()->whereBelongsTo($item)->count())->toBe(0);
});

test('admin cannot save decimal stock values', function () {
    $admin = User::factory()->admin()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-TOM-001',
        'category_code' => 'ALU-TOM',
        'qr_value' => 'ALU-TOM-001',
        'current_stock' => 5,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.inventory.update', $item), [
            'code' => 'ALU-TOM-001',
            'category_code' => 'ALU-TOM',
            'name' => $item->name,
            'description' => $item->description,
            'unit' => $item->unit,
            'current_stock' => '5.5',
            'minimum_stock' => 1,
            'active' => true,
        ])
        ->assertSessionHasErrors('current_stock');
});

test('admin can add stock while editing an inventory item', function () {
    $admin = User::factory()->admin()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-HER-001',
        'category_code' => 'ALU-HER',
        'qr_value' => 'ALU-HER-001',
        'current_stock' => 8,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.inventory.update', $item), [
            'code' => 'ALU-HER-001',
            'category_code' => 'ALU-HER',
            'name' => $item->name,
            'description' => $item->description,
            'unit' => $item->unit,
            'current_stock' => 8,
            'minimum_stock' => 1,
            'stock_adjustment_type' => 'add',
            'stock_adjustment_quantity' => 3,
            'active' => true,
        ])
        ->assertRedirect(route('admin.inventory.show', $item));

    $movement = InventoryMovement::query()
        ->whereBelongsTo($item)
        ->where('movement_type', 'manual_entry')
        ->firstOrFail();

    expect((float) $item->refresh()->current_stock)->toBe(11.0)
        ->and((float) $movement->quantity)->toBe(3.0)
        ->and((float) $movement->stock_before)->toBe(8.0)
        ->and((float) $movement->stock_after)->toBe(11.0)
        ->and($movement->metadata['adjustment_type'])->toBe('add');
});

test('admin can subtract stock while editing an inventory item', function () {
    $admin = User::factory()->admin()->create();
    $item = InventoryItem::factory()->create([
        'code' => 'ALU-FUS-001',
        'category_code' => 'ALU-FUS',
        'qr_value' => 'ALU-FUS-001',
        'current_stock' => 8,
        'minimum_stock' => 1,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.inventory.update', $item), [
            'code' => 'ALU-FUS-001',
            'category_code' => 'ALU-FUS',
            'name' => $item->name,
            'description' => $item->description,
            'unit' => $item->unit,
            'current_stock' => 8,
            'minimum_stock' => 1,
            'stock_adjustment_type' => 'subtract',
            'stock_adjustment_quantity' => 2,
            'active' => true,
        ])
        ->assertRedirect(route('admin.inventory.show', $item));

    $movement = InventoryMovement::query()
        ->whereBelongsTo($item)
        ->where('movement_type', 'manual_exit')
        ->firstOrFail();

    expect((float) $item->refresh()->current_stock)->toBe(6.0)
        ->and((float) $movement->quantity)->toBe(2.0)
        ->and((float) $movement->stock_before)->toBe(8.0)
        ->and((float) $movement->stock_after)->toBe(6.0)
        ->and($movement->metadata['adjustment_type'])->toBe('subtract');
});

test('crew users cannot access inventory management', function () {
    $crewUser = User::factory()->crewMember()->create();

    $this->actingAs($crewUser)
        ->get(route('admin.inventory.index'))
        ->assertForbidden();
});
