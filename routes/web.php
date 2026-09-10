<?php

use App\Http\Controllers\Admin\ComplaintAssignmentController;
use App\Http\Controllers\Admin\ComplaintController;
use App\Http\Controllers\Admin\ComplaintDashboardController;
use App\Http\Controllers\Admin\ComplaintInterventionController;
use App\Http\Controllers\Admin\ComplaintStatusController;
use App\Http\Controllers\Admin\IntakeConfigurationController;
use App\Http\Controllers\Admin\IntakeRequestController as AdminIntakeRequestController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\InventoryLabelController;
use App\Http\Controllers\Admin\RoutePlanningController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\CrewWorkController;
use App\Http\Controllers\IntakeDepartmentWorkController;
use App\Http\Controllers\InventoryQrController;
use App\Http\Controllers\PublicComplaintController;
use App\Http\Controllers\PublicIntakeRequestController;
use Illuminate\Support\Facades\Route;

Route::redirect('/index.html', '/', 301);
Route::inertia('/', 'home')->name('home');
Route::inertia('/boletin', 'boletin')->name('boletin');
Route::inertia('/juzgado-faltas', 'juzgado-faltas')->name('juzgado-faltas');
Route::inertia('/rentas', 'rentas')->name('rentas');

Route::get('/reclamos/recibido/{complaint}', [PublicComplaintController::class, 'received'])->name('complaints.public.received');
Route::get('/reclamos/consultar', [PublicComplaintController::class, 'trackCreate'])->name('complaints.public.track');
Route::post('/reclamos/consultar', [PublicComplaintController::class, 'track'])->name('complaints.public.track.submit');
Route::redirect('/reclamos/alumbrado', '/reclamos/alumbrado-publico');
Route::get('/reclamos/{category:slug}', [PublicComplaintController::class, 'create'])->name('complaints.public.create');
Route::post('/reclamos/{category:slug}', [PublicComplaintController::class, 'store'])->name('complaints.public.store');

Route::get('/mesa-de-entrada', [PublicIntakeRequestController::class, 'index'])->name('intake.public.index');
Route::get('/mesa-de-entrada/consultar', [PublicIntakeRequestController::class, 'trackCreate'])->name('intake.public.track');
Route::post('/mesa-de-entrada/consultar', [PublicIntakeRequestController::class, 'track'])->name('intake.public.track.submit');
Route::get('/mesa-de-entrada/recibido/{intakeRequest}', [PublicIntakeRequestController::class, 'received'])->name('intake.public.received');
Route::get('/mesa-de-entrada/solicitudes/{type:slug}', [PublicIntakeRequestController::class, 'create'])->name('intake.public.create');
Route::post('/mesa-de-entrada/solicitudes/{type:slug}', [PublicIntakeRequestController::class, 'store'])->name('intake.public.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('dashboard', '/admin/reclamos/dashboard')->name('dashboard');

    Route::get('i/{code}', [InventoryQrController::class, 'show'])
        ->where('code', '[A-Za-z0-9\-]+')
        ->name('inventory.qr.show');
    Route::post('i/{code}/movimientos', [InventoryQrController::class, 'store'])
        ->where('code', '[A-Za-z0-9\-]+')
        ->name('inventory.qr.movements.store');
    Route::get('inventario/qr/{code}', [InventoryQrController::class, 'show'])
        ->where('code', '[A-Za-z0-9\-]+')
        ->name('inventory.qr.legacy.show');

    Route::prefix('admin/reclamos')->name('admin.complaints.')->group(function () {
        Route::get('dashboard', ComplaintDashboardController::class)->name('dashboard');
        Route::get('planificacion', [RoutePlanningController::class, 'index'])->name('planning');
        Route::post('planificacion/recorridos', [RoutePlanningController::class, 'store'])->name('planning.routes.store');
        Route::post('asignacion-masiva', [ComplaintAssignmentController::class, 'bulk'])->name('bulk_assign');
        Route::get('/', [ComplaintController::class, 'index'])->name('index');
        Route::get('{complaint}', [ComplaintController::class, 'show'])->name('show');
        Route::patch('{complaint}/vecino', [ComplaintController::class, 'updateNeighbor'])->name('neighbor.update');
        Route::post('{complaint}/asignar', [ComplaintAssignmentController::class, 'store'])->name('assign');
        Route::patch('{complaint}/estado', [ComplaintStatusController::class, 'update'])->name('status.update');
        Route::post('{complaint}/intervenciones', [ComplaintInterventionController::class, 'store'])->name('interventions.store');
    });

    Route::prefix('admin/inventario')->name('admin.inventory.')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('index');
        Route::get('etiquetas', [InventoryLabelController::class, 'index'])->name('labels.index');
        Route::get('etiquetas/imprimir', [InventoryLabelController::class, 'printBatch'])->name('labels.print');
        Route::get('crear', [InventoryController::class, 'create'])->name('create');
        Route::post('/', [InventoryController::class, 'store'])->name('store');
        Route::get('{inventoryItem}', [InventoryController::class, 'show'])->name('show');
        Route::get('{inventoryItem}/editar', [InventoryController::class, 'edit'])->name('edit');
        Route::patch('{inventoryItem}', [InventoryController::class, 'update'])->name('update');
    });

    Route::prefix('admin/usuarios')->name('admin.users.')->group(function () {
        Route::get('/', [UserManagementController::class, 'index'])->name('index');
        Route::post('/', [UserManagementController::class, 'store'])->name('store');
        Route::patch('{user}', [UserManagementController::class, 'update'])->name('update');
    });

    Route::prefix('admin/mesa-de-entrada')->name('admin.intake.')->group(function () {
        Route::get('/', [AdminIntakeRequestController::class, 'index'])->name('index');
        Route::get('configuracion', [IntakeConfigurationController::class, 'index'])->name('configuration');
        Route::post('configuracion/areas', [IntakeConfigurationController::class, 'storeDepartment'])->name('configuration.departments.store');
        Route::patch('configuracion/areas/{intakeDepartment}', [IntakeConfigurationController::class, 'updateDepartment'])->name('configuration.departments.update');
        Route::post('configuracion/tipos-asistencia', [IntakeConfigurationController::class, 'storeAssistanceType'])->name('configuration.assistance-types.store');
        Route::patch('configuracion/tipos-asistencia/{intakeAssistanceType}', [IntakeConfigurationController::class, 'updateAssistanceType'])->name('configuration.assistance-types.update');
        Route::get('{intakeRequest}', [AdminIntakeRequestController::class, 'show'])->name('show');
        Route::post('{intakeRequest}/derivaciones', [AdminIntakeRequestController::class, 'storeDerivations'])->name('derivations.store');
        Route::patch('{intakeRequest}/estado', [AdminIntakeRequestController::class, 'updateStatus'])->name('status.update');
    });

    Route::prefix('area/mesa-de-entrada')->name('intake.department.')->group(function () {
        Route::get('/', [IntakeDepartmentWorkController::class, 'index'])->name('index');
        Route::get('derivaciones/{intakeDerivation}', [IntakeDepartmentWorkController::class, 'show'])->name('show');
        Route::patch('derivaciones/{intakeDerivation}', [IntakeDepartmentWorkController::class, 'update'])->name('update');
    });

    Route::get('cuadrilla/mis-trabajos', [CrewWorkController::class, 'index'])->name('crew.work.index');
    Route::patch('cuadrilla/recorridos/{workRoute}/finalizar', [CrewWorkController::class, 'finish'])->name('crew.work.routes.finish');
    Route::get('cuadrilla/reclamos/{complaint}', [CrewWorkController::class, 'show'])->name('crew.work.show');
});

require __DIR__.'/settings.php';
