<?php

use App\Enums\IntakeDerivationStatus;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeDerivation;
use App\Models\IntakeDerivationHistory;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('area response changes create derivation history without touching request history', function () {
    $department = IntakeDepartment::create([
        'slug' => 'obras-publicas',
        'name' => 'Obras Publicas',
        'color' => '#0f766e',
        'active' => true,
    ]);
    $assistanceType = IntakeAssistanceType::create([
        'default_intake_department_id' => $department->id,
        'slug' => 'habilitacion',
        'name' => 'Habilitacion',
        'color' => '#7c3aed',
        'active' => true,
    ]);
    $areaUser = User::factory()->intakeDepartment()->create([
        'intake_department_id' => $department->id,
    ]);
    $intakeRequest = IntakeRequest::factory()->create();
    $derivation = IntakeDerivation::create([
        'intake_request_id' => $intakeRequest->id,
        'intake_department_id' => $department->id,
        'intake_assistance_type_id' => $assistanceType->id,
        'status' => IntakeDerivationStatus::Pending,
        'department_response' => 'Respuesta anterior',
    ]);

    $this->actingAs($areaUser)
        ->patch(route('intake.department.update', $derivation), [
            'status' => IntakeDerivationStatus::InProgress->value,
            'department_response' => 'Respuesta actualizada por el area.',
        ])
        ->assertRedirect();

    expect(IntakeDerivationHistory::count())->toBe(1)
        ->and(IntakeRequestHistory::count())->toBe(0);

    $history = IntakeDerivationHistory::first();

    expect($history->intake_derivation_id)->toBe($derivation->id)
        ->and($history->user_id)->toBe($areaUser->id)
        ->and($history->from_status)->toBe(IntakeDerivationStatus::Pending)
        ->and($history->to_status)->toBe(IntakeDerivationStatus::InProgress)
        ->and($history->previous_response)->toBe('Respuesta anterior')
        ->and($history->new_response)->toBe('Respuesta actualizada por el area.');
});

test('operators can filter and mark intake derivation notifications as read', function () {
    $admin = User::factory()->operator()->create();
    $hacienda = IntakeDepartment::create([
        'slug' => 'rentas',
        'name' => 'Rentas',
        'secretariat' => 'Hacienda',
        'color' => '#2563eb',
        'active' => true,
    ]);
    $gobierno = IntakeDepartment::create([
        'slug' => 'gobierno',
        'name' => 'Gobierno',
        'secretariat' => 'Gobierno',
        'color' => '#7c3aed',
        'active' => true,
    ]);
    $assistanceType = IntakeAssistanceType::create([
        'default_intake_department_id' => $hacienda->id,
        'slug' => 'consulta-rentas',
        'name' => 'Consulta de rentas',
        'color' => '#2563eb',
        'active' => true,
    ]);
    $haciendaDerivation = IntakeDerivation::create([
        'intake_request_id' => IntakeRequest::factory()->create()->id,
        'intake_department_id' => $hacienda->id,
        'intake_assistance_type_id' => $assistanceType->id,
        'status' => IntakeDerivationStatus::InProgress,
    ]);
    $gobiernoDerivation = IntakeDerivation::create([
        'intake_request_id' => IntakeRequest::factory()->create()->id,
        'intake_department_id' => $gobierno->id,
        'intake_assistance_type_id' => $assistanceType->id,
        'status' => IntakeDerivationStatus::InProgress,
    ]);
    $haciendaHistory = IntakeDerivationHistory::factory()->create([
        'intake_derivation_id' => $haciendaDerivation->id,
        'operator_seen_at' => null,
    ]);
    $gobiernoHistory = IntakeDerivationHistory::factory()->create([
        'intake_derivation_id' => $gobiernoDerivation->id,
        'operator_seen_at' => null,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.intake.notifications', ['secretariat' => 'Hacienda']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('intake/admin/notifications')
            ->where('unreadCount', 1)
            ->has('notifications.data', 1)
            ->where('notifications.data.0.id', $haciendaHistory->id)
        );

    $this->actingAs($admin)
        ->patch(route('admin.intake.notifications.mark-read'), [
            'secretariat' => 'Hacienda',
            'read_state' => 'unread',
        ])
        ->assertRedirect();

    expect($haciendaHistory->fresh()->operator_seen_at)->not->toBeNull()
        ->and($gobiernoHistory->fresh()->operator_seen_at)->toBeNull();
});
