<?php

use App\Models\User;
use App\Support\UserModules;

test('superadmin can open user management', function () {
    $superadmin = User::factory()->superAdmin()->create();

    $this->actingAs($superadmin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users')
            ->where('options.modules.0.key', 'complaints_management')
            ->where('options.modules.2.key', 'crew_work')
            ->where('options.modules.2.label', 'Mis trabajos'),
        );
});

test('admin without user management permission cannot open user management', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('user module permissions normalize stored truthy values', function () {
    $permissions = UserModules::normalize([
        'crew_work' => '1',
        'inventory_management' => 1,
        'user_management' => 'true',
        'route_planning' => false,
    ]);

    expect($permissions['crew_work'])->toBeTrue()
        ->and($permissions['inventory_management'])->toBeTrue()
        ->and($permissions['user_management'])->toBeTrue()
        ->and($permissions['route_planning'])->toBeFalse();
});

test('superadmin can create user with module permissions', function () {
    $superadmin = User::factory()->superAdmin()->create();

    $this->actingAs($superadmin)
        ->post(route('admin.users.store'), [
            'name' => 'Jefa de Reclamos',
            'username' => 'jefa.reclamos',
            'dni' => '30.123.456',
            'email' => 'jefa.reclamos@municipio.test',
            'password' => 'password',
            'role' => 'operator',
            'active' => true,
            'module_permissions' => [
                'complaints_management' => true,
                'complaint_operations' => true,
            ],
        ])
        ->assertRedirect();

    $user = User::where('username', 'jefa.reclamos')->firstOrFail();

    expect($user->canUseComplaintManagement())->toBeTrue()
        ->and($user->canUseComplaintOperations())->toBeTrue()
        ->and($user->canManageUsers())->toBeFalse()
        ->and($user->dni)->toBe('30123456');
});

test('superadmin can update user permissions and password remains optional', function () {
    $superadmin = User::factory()->superAdmin()->create();
    $user = User::factory()->warehouseManager()->create([
        'module_permissions' => ['inventory_management' => true],
    ]);
    $password = $user->password;

    $this->actingAs($superadmin)
        ->patch(route('admin.users.update', $user), [
            'name' => 'Operador Mesa',
            'username' => $user->username,
            'dni' => '28 111 222',
            'email' => $user->email,
            'password' => '',
            'role' => 'warehouse_manager',
            'active' => true,
            'module_permissions' => [
                'user_management' => true,
            ],
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->password)->toBe($password)
        ->and($user->canManageUsers())->toBeTrue()
        ->and($user->canManageInventory())->toBeFalse()
        ->and($user->dni)->toBe('28111222');
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
