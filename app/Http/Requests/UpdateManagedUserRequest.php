<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\UserModules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateManagedUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canManageUsers() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => Str::lower((string) $this->input('username')),
            'active' => $this->boolean('active'),
            'module_permissions' => UserModules::normalize((array) $this->input('module_permissions', [])),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $managedUser = $this->route('user');
        $managedUserId = $managedUser instanceof User ? $managedUser->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:60', 'regex:/^[a-z0-9._-]+$/', Rule::unique(User::class)->ignore($managedUserId)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($managedUserId)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in(['superadmin', 'admin', 'operator', 'crew', 'intake_department', 'warehouse_manager'])],
            'active' => ['boolean'],
            'module_permissions' => ['array'],
            'module_permissions.*' => ['boolean'],
            'primary_crew_id' => ['nullable', Rule::exists('crews', 'id')],
            'intake_department_id' => ['nullable', Rule::exists('intake_departments', 'id')],
        ];
    }
}
