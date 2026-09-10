<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property string|null $dni
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'username', 'dni', 'email', 'password', 'role', 'module_permissions', 'active', 'primary_crew_id', 'intake_department_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function primaryCrew(): BelongsTo
    {
        return $this->belongsTo(Crew::class, 'primary_crew_id');
    }

    public function crews(): BelongsToMany
    {
        return $this->belongsToMany(Crew::class)->withTimestamps();
    }

    public function intakeDepartment(): BelongsTo
    {
        return $this->belongsTo(IntakeDepartment::class);
    }

    public function canManageComplaints(): bool
    {
        return $this->hasAnyModulePermission(['complaints_management']) || in_array($this->role, ['operator', 'admin'], true);
    }

    public function canUseComplaintManagement(): bool
    {
        return $this->canManageComplaints();
    }

    public function canUseComplaintOperations(): bool
    {
        return $this->canUseCrewWork();
    }

    public function canUseCrewWork(): bool
    {
        return $this->hasAnyModulePermission(['crew_work', 'complaint_operations']) || $this->canManageComplaints() || $this->isCrewMember();
    }

    public function canCoordinateCrews(): bool
    {
        return $this->hasAnyModulePermission(['route_planning']) || in_array($this->role, ['admin', 'crew'], true);
    }

    public function isCrewMember(): bool
    {
        return $this->role === 'crew';
    }

    public function canUseIntakeDepartmentPanel(): bool
    {
        return $this->hasAnyModulePermission(['intake_department']) || $this->role === 'intake_department' || $this->role === 'admin';
    }

    public function canUseIntakeManagement(): bool
    {
        return $this->hasAnyModulePermission(['intake_management']) || in_array($this->role, ['operator', 'admin'], true);
    }

    public function canConfigureIntake(): bool
    {
        return $this->hasAnyModulePermission(['intake_configuration']) || $this->role === 'admin';
    }

    public function canManageInventory(): bool
    {
        return $this->hasAnyModulePermission(['inventory_management']) || $this->role === 'admin';
    }

    public function canUseInventoryQuickMovement(): bool
    {
        return $this->hasAnyModulePermission(['inventory_movements']) || in_array($this->role, ['admin', 'operator', 'crew', 'warehouse_manager'], true);
    }

    public function canRecordInventoryExit(): bool
    {
        return $this->canUseInventoryQuickMovement();
    }

    public function canRecordInventoryRecycled(): bool
    {
        return $this->canUseInventoryQuickMovement();
    }

    public function canRecordInventoryEntry(): bool
    {
        return $this->hasAnyModulePermission(['inventory_management']) || in_array($this->role, ['admin', 'warehouse_manager'], true);
    }

    public function canManageUsers(): bool
    {
        return $this->hasAnyModulePermission(['user_management']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * @param  array<int, string>  $permissions
     */
    public function hasAnyModulePermission(array $permissions): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $userPermissions = $this->module_permissions ?? [];

        foreach ($permissions as $permission) {
            if (($userPermissions[$permission] ?? false) === true) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'module_permissions' => 'array',
            'active' => 'boolean',
        ];
    }
}
