<?php

use App\Enums\IntakeRequestStatus;
use App\Http\Controllers\PublicIntakeRequestController;
use App\Http\Requests\StoreIntakeAssistanceTypeRequest;
use App\Http\Requests\StoreIntakeDepartmentRequest;
use App\Http\Requests\StorePublicIntakeRequestRequest;
use App\Http\Requests\TrackIntakeRequestRequest;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeDerivation;
use App\Models\IntakeDerivationHistory;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class);

test('mesa de entrada exposes configurable request types and statuses', function () {
    expect((new IntakeRequestType)->isFillable('schema'))->toBeTrue()
        ->and((new IntakeRequestType)->isFillable('requirements'))->toBeTrue()
        ->and((new IntakeRequestType)->isFillable('cost_information'))->toBeTrue()
        ->and((new IntakeRequest)->isFillable('payload'))->toBeTrue()
        ->and(IntakeRequestStatus::Received->label())->toBe('Recibido')
        ->and(IntakeRequestStatus::Finished->label())->toBe('Finalizado')
        ->and((new StorePublicIntakeRequestRequest)->authorize())->toBeTrue()
        ->and((new StorePublicIntakeRequestRequest)->rules()['summary'])->toContain('nullable')
        ->and((new TrackIntakeRequestRequest)->authorize())->toBeTrue();
});

test('mesa de entrada supports internal assistance typing and area derivations', function () {
    expect((new IntakeDepartment)->isFillable('slug'))->toBeTrue()
        ->and((new IntakeDepartment)->isFillable('secretariat'))->toBeTrue()
        ->and((new IntakeAssistanceType)->isFillable('default_intake_department_id'))->toBeTrue()
        ->and((new IntakeDerivation)->isFillable('department_response'))->toBeTrue()
        ->and((new IntakeDerivation)->histories())->not->toBeNull()
        ->and((new IntakeDerivationHistory)->isFillable('new_response'))->toBeTrue()
        ->and((new IntakeDerivationHistory)->isFillable('operator_seen_at'))->toBeTrue()
        ->and((new IntakeDerivationHistory)->derivation())->not->toBeNull()
        ->and((new IntakeRequestSubtype)->isFillable('cost_information'))->toBeTrue()
        ->and((new IntakeRequestSubtype)->isFillable('publication_status'))->toBeTrue()
        ->and((new IntakeRequest)->isFillable('intake_request_subtype_id'))->toBeTrue()
        ->and((new IntakeRequest)->assistanceTypes())->not->toBeNull()
        ->and((new IntakeRequest)->derivations())->not->toBeNull()
        ->and((new IntakeRequest)->subtype())->not->toBeNull()
        ->and((new IntakeRequestType)->subtypes())->not->toBeNull();
});

test('mesa de entrada grouped catalog keeps rrhh internal and costs visible through subtypes', function () {
    $publicType = IntakeRequestType::factory()->make([
        'slug' => 'rentas-tasas',
        'name' => 'Rentas y tasas municipales',
        'estimated_time' => null,
        'cost_information' => 'Puede tener costo segun la tasa.',
        'active' => true,
    ]);
    $subtype = new IntakeRequestSubtype([
        'slug' => 'libre-deuda-inmobiliario',
        'cost_information' => 'Puede tener costo segun la tasa.',
        'publication_status' => 'published',
        'active' => true,
    ]);
    $internalType = IntakeRequestType::factory()->make([
        'slug' => 'rrhh-empleados-municipales',
        'active' => false,
    ]);

    expect($publicType->cost_information)->toBe('Puede tener costo segun la tasa.')
        ->and($publicType->estimated_time)->toBeNull()
        ->and($subtype->cost_information)->toBe('Puede tener costo segun la tasa.')
        ->and($subtype->publication_status)->toBe('published')
        ->and($internalType->active)->toBeFalse();
});

test('mesa de entrada public code sequence ignores non numeric demo codes', function () {
    $controller = new PublicIntakeRequestController;
    $method = new ReflectionMethod($controller, 'nextPublicNumberFromCodes');

    expect($method->invoke($controller, [
        'FME-2026-000001',
        'FME-2026-SONIDO',
        'FME-2026-000009',
    ]))->toBe(10);
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
        ->and($departmentRequest->rules())->toHaveKey('secretariat')
        ->and($assistanceRequest->authorize())->toBeFalse()
        ->and(route('admin.intake.configuration'))->toEndWith('/admin/mesa-de-entrada/configuracion')
        ->and(route('admin.intake.configuration.departments.store'))->toEndWith('/admin/mesa-de-entrada/configuracion/areas')
        ->and(route('admin.intake.configuration.assistance-types.store'))->toEndWith('/admin/mesa-de-entrada/configuracion/tipos-asistencia');
});
