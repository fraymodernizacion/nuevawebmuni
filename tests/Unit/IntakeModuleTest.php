<?php

use App\Enums\IntakeRequestStatus;
use App\Http\Requests\StoreIntakeAssistanceTypeRequest;
use App\Http\Requests\StoreIntakeDepartmentRequest;
use App\Http\Requests\StorePublicIntakeRequestRequest;
use App\Http\Requests\TrackIntakeRequestRequest;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeDerivation;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestType;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

test('mesa de entrada exposes configurable request types and statuses', function () {
    expect((new IntakeRequestType)->isFillable('schema'))->toBeTrue()
        ->and((new IntakeRequestType)->isFillable('requirements'))->toBeTrue()
        ->and((new IntakeRequest)->isFillable('payload'))->toBeTrue()
        ->and(IntakeRequestStatus::Received->label())->toBe('Recibido')
        ->and(IntakeRequestStatus::Finished->label())->toBe('Finalizado')
        ->and((new StorePublicIntakeRequestRequest)->authorize())->toBeTrue()
        ->and((new TrackIntakeRequestRequest)->authorize())->toBeTrue();
});

test('mesa de entrada supports internal assistance typing and area derivations', function () {
    expect((new IntakeDepartment)->isFillable('slug'))->toBeTrue()
        ->and((new IntakeAssistanceType)->isFillable('default_intake_department_id'))->toBeTrue()
        ->and((new IntakeDerivation)->isFillable('department_response'))->toBeTrue()
        ->and((new IntakeRequest)->assistanceTypes())->not->toBeNull()
        ->and((new IntakeRequest)->derivations())->not->toBeNull();
});

test('area managers use their own derivation panel without managing the main request status', function () {
    $operator = new User(['role' => 'operator']);
    $manager = new User(['role' => 'intake_department', 'intake_department_id' => 1]);

    expect($operator->canUseComplaintManagement())->toBeTrue()
        ->and($operator->canUseIntakeDepartmentPanel())->toBeFalse()
        ->and($manager->canUseComplaintManagement())->toBeFalse()
        ->and($manager->canUseIntakeDepartmentPanel())->toBeTrue()
        ->and(route('intake.department.index'))->toEndWith('/area/mesa-de-entrada')
        ->and(route('admin.intake.derivations.store', ['intakeRequest' => 1]))
        ->toEndWith('/admin/mesa-de-entrada/1/derivaciones');
});

test('only admin can configure intake derivation catalogs', function () {
    $admin = User::factory()->make(['role' => 'admin']);
    $operator = User::factory()->make(['role' => 'operator']);

    $departmentRequest = StoreIntakeDepartmentRequest::create('/admin/mesa-de-entrada/configuracion/areas', 'POST');
    $departmentRequest->setUserResolver(fn () => $admin);

    $assistanceRequest = StoreIntakeAssistanceTypeRequest::create('/admin/mesa-de-entrada/configuracion/tipos-asistencia', 'POST');
    $assistanceRequest->setUserResolver(fn () => $operator);

    expect($departmentRequest->authorize())->toBeTrue()
        ->and($assistanceRequest->authorize())->toBeFalse()
        ->and(route('admin.intake.configuration'))->toEndWith('/admin/mesa-de-entrada/configuracion')
        ->and(route('admin.intake.configuration.departments.store'))->toEndWith('/admin/mesa-de-entrada/configuracion/areas')
        ->and(route('admin.intake.configuration.assistance-types.store'))->toEndWith('/admin/mesa-de-entrada/configuracion/tipos-asistencia');
});
