<?php

use App\Models\InventoryItem;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can open qr label batch selector', function () {
    $admin = User::factory()->admin()->create();
    InventoryItem::factory()->create([
        'code' => 'ALU-LUM-101',
        'name' => 'Luminaria LED 150W',
        'qr_value' => 'ALU-LUM-101',
        'active' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.inventory.labels.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/labels/index')
            ->where('items.0.code', 'ALU-LUM-101')
            ->where('items.0.quick_url', route('inventory.qr.show', ['code' => 'ALU-LUM-101']))
            ->where('printUrl', route('admin.inventory.labels.print')),
        );
});

test('label selector searches inventory items by code', function () {
    $admin = User::factory()->admin()->create();
    InventoryItem::factory()->create([
        'code' => 'ALU-FOT-201',
        'name' => 'Fotocelula',
        'qr_value' => 'ALU-FOT-201',
        'active' => true,
    ]);
    InventoryItem::factory()->create([
        'code' => 'ALU-CAB-201',
        'name' => 'Cable',
        'qr_value' => 'ALU-CAB-201',
        'active' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.inventory.labels.index', ['search' => 'FOT']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/labels/index')
            ->has('items', 1)
            ->where('items.0.code', 'ALU-FOT-201'),
        );
});

test('print page expands selected quantities and includes generated qr svgs', function () {
    $admin = User::factory()->admin()->create();
    $firstItem = InventoryItem::factory()->create([
        'code' => 'ALU-LUM-301',
        'name' => 'Luminaria LED 100W',
        'qr_value' => 'ALU-LUM-301',
    ]);
    $secondItem = InventoryItem::factory()->create([
        'code' => 'ALU-CAB-301',
        'name' => 'Cable subterraneo',
        'qr_value' => 'ALU-CAB-301',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.inventory.labels.print', [
            'items' => [
                $firstItem->id => 2,
                $secondItem->id => 1,
            ],
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/labels/print')
            ->where('totalLabels', 3)
            ->has('items', 2)
            ->has('labels', 3)
            ->where('items.0.qr_svg', fn (string $svg): bool => str_contains($svg, '<svg')),
        );
});

test('non admin users cannot manage qr label batches', function () {
    $crewUser = User::factory()->crewMember()->create();

    $this->actingAs($crewUser)
        ->get(route('admin.inventory.labels.index'))
        ->assertForbidden();
});
