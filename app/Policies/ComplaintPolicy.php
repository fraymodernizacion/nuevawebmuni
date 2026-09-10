<?php

namespace App\Policies;

use App\Models\Complaint;
use App\Models\User;

class ComplaintPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->canManageComplaints() || $user->isCrewMember();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Complaint $complaint): bool
    {
        if ($user->canManageComplaints()) {
            return true;
        }

        if ($user->canCoordinateCrews()) {
            return true;
        }

        return $user->canUseCrewWork()
            && $user->primary_crew_id !== null
            && $complaint->assigned_crew_id === $user->primary_crew_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canManageComplaints();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Complaint $complaint): bool
    {
        return $user->canManageComplaints();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Complaint $complaint): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Complaint $complaint): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Complaint $complaint): bool
    {
        return false;
    }

    public function assign(User $user, Complaint $complaint): bool
    {
        return $user->canCoordinateCrews();
    }

    public function intervene(User $user, Complaint $complaint): bool
    {
        if ($user->canManageComplaints()) {
            return true;
        }

        return $user->canUseCrewWork()
            && $user->primary_crew_id !== null
            && $complaint->assigned_crew_id === $user->primary_crew_id;
    }
}
