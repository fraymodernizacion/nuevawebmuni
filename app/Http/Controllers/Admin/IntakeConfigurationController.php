<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIntakeAssistanceTypeRequest;
use App\Http\Requests\StoreIntakeDepartmentRequest;
use App\Http\Requests\UpdateIntakeAssistanceTypeRequest;
use App\Http\Requests\UpdateIntakeDepartmentRequest;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IntakeConfigurationController extends Controller
{
    public function index(): Response
    {
        abort_unless(request()->user()?->canConfigureIntake(), 403);

        return Inertia::render('intake/admin/configuration', [
            'departments' => IntakeDepartment::query()
                ->withCount(['users', 'derivations'])
                ->orderBy('name')
                ->get(),
            'assistanceTypes' => IntakeAssistanceType::query()
                ->with('defaultDepartment:id,name,color')
                ->withCount('derivations')
                ->orderBy('name')
                ->get(),
            'departmentOptions' => IntakeDepartment::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'color']),
        ]);
    }

    public function storeDepartment(StoreIntakeDepartmentRequest $request): RedirectResponse
    {
        IntakeDepartment::create($request->validated());

        return back()->with('success', 'Area creada.');
    }

    public function updateDepartment(UpdateIntakeDepartmentRequest $request, IntakeDepartment $intakeDepartment): RedirectResponse
    {
        $intakeDepartment->update($request->validated());

        return back()->with('success', 'Area actualizada.');
    }

    public function storeAssistanceType(StoreIntakeAssistanceTypeRequest $request): RedirectResponse
    {
        IntakeAssistanceType::create($request->validated());

        return back()->with('success', 'Tipo de asistencia creado.');
    }

    public function updateAssistanceType(UpdateIntakeAssistanceTypeRequest $request, IntakeAssistanceType $intakeAssistanceType): RedirectResponse
    {
        $intakeAssistanceType->update($request->validated());

        return back()->with('success', 'Tipo de asistencia actualizado.');
    }
}
