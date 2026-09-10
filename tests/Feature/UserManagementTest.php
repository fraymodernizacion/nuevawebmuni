<?php

use App\Models\User;

test('superadmin can open user management', function () {
    $superadmin = User::factory()->superAdmin()->create();

    $this->actingAs($superadmin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users')
            ->where('options.modules.0.key', 'complaints_management'),
        );
});

test('admin without user management permission cannot open user management', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('superadmin can create user with module permissions', function () {
    $superadmin = User::factory()->superAdmin()->create();

    $this->actingAs($superadmin)
        ->post(route('admin.users.store'), [
            'name' => 'Jefa de Reclamos',
            'username' => 'jefa.reclamos',
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
        ->and($user->canManageUsers())->toBeFalse();
});

test('superadmin can update user permissions and password remains optional', function () {
    $superadmin = User::factory()->superAdmin()->create();
    $user = User::factory()->create([
        'role' => 'operator',
        'module_permissions' => ['complaints_management' => true],
    ]);
    $password = $user->password;

    $this->actingAs($superadmin)
        ->patch(route('admin.users.update', $user), [
            'name' => 'Operador Mesa',
            'username' => $user->username,
            'email' => $user->email,
            'password' => '',
            'role' => 'operator',
            'active' => true,
            'module_permissions' => [
                'intake_management' => true,
            ],
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->password)->toBe($password)
        ->and($user->canUseIntakeManagement())->toBeTrue();
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
