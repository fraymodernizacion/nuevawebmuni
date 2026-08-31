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
#[Fillable(['name', 'email', 'password', 'role', 'primary_crew_id', 'intake_department_id'])]
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
        return in_array($this->role, ['operator', 'admin'], true);
    }

    public function canUseComplaintManagement(): bool
    {
        return $this->canManageComplaints();
    }

    public function canCoordinateCrews(): bool
    {
        return in_array($this->role, ['admin', 'crew'], true);
    }

    public function isCrewMember(): bool
    {
        return $this->role === 'crew';
    }

    public function canUseIntakeDepartmentPanel(): bool
    {
        return $this->role === 'intake_department' || $this->role === 'admin';
    }

    public function canManageInventory(): bool
    {
        return $this->role === 'admin';
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
        ];
    }
}
