<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreManagedUserRequest;
use App\Http\Requests\UpdateManagedUserRequest;
use App\Models\Crew;
use App\Models\IntakeDepartment;
use App\Models\User;
use App\Support\UserModules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        return Inertia::render('admin/users/index', [
            'users' => User::query()
                ->with(['primaryCrew:id,name,code', 'intakeDepartment:id,name'])
                ->orderBy('name')
                ->get()
                ->map(fn (User $user): array => $this->serializeUser($user))
                ->values(),
            'options' => [
                'roles' => $this->roleOptions(),
                'modules' => collect(UserModules::labels())
                    ->map(fn (string $label, string $key): array => ['key' => $key, 'label' => $label])
                    ->values(),
                'crews' => Crew::where('active', true)->orderBy('name')->get(['id', 'code', 'name']),
                'intakeDepartments' => IntakeDepartment::where('active', true)->orderBy('name')->get(['id', 'name']),
            ],
        ]);
    }

    public function store(StoreManagedUserRequest $request): RedirectResponse
    {
        User::create($this->userData($request->validated()));

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(UpdateManagedUserRequest $request, User $user): RedirectResponse
    {
        abort_if($user->is($request->user()) && ! $request->boolean('active'), 422, 'No podés desactivar tu propio usuario.');

        $user->update($this->userData($request->validated(), updating: true));

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function roleOptions(): array
    {
        return [
            ['value' => 'superadmin', 'label' => 'Superadmin'],
            ['value' => 'admin', 'label' => 'Administrador'],
            ['value' => 'operator', 'label' => 'Operador'],
            ['value' => 'crew', 'label' => 'Cuadrilla'],
            ['value' => 'intake_department', 'label' => 'Área de mesa de entrada'],
            ['value' => 'warehouse_manager', 'label' => 'Depósito'],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function userData(array $validated, bool $updating = false): array
    {
        $data = Arr::only($validated, [
            'name',
            'username',
            'dni',
            'email',
            'role',
            'active',
            'module_permissions',
            'primary_crew_id',
            'intake_department_id',
        ]);

        if (! $updating || filled($validated['password'] ?? null)) {
            $data['password'] = $validated['password'];
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'dni' => $user->dni,
            'email' => $user->email,
            'role' => $user->role,
            'active' => $user->active,
            'module_permissions' => UserModules::normalize($user->module_permissions),
            'primary_crew_id' => $user->primary_crew_id,
            'intake_department_id' => $user->intake_department_id,
            'primary_crew' => $user->primaryCrew,
            'intake_department' => $user->intakeDepartment,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
