<?php

use App\Http\Requests\StoreComplaintInterventionRequest;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintIntervention;
use App\Models\User;
use App\Policies\ComplaintPolicy;
use Tests\TestCase;

uses(TestCase::class);

test('only admin and operator can use complaint management', function (string $role, bool $expected) {
    $user = new User(['role' => $role]);

    expect($user->canUseComplaintManagement())->toBe($expected);
})->with([
    'admin' => ['admin', true],
    'operator' => ['operator', true],
    'crew' => ['crew', false],
    'citizen' => ['citizen', false],
]);

test('crew leader can view complaints but only intervene assigned complaints', function () {
    $policy = new ComplaintPolicy;
    $operator = new User([
        'role' => 'operator',
    ]);
    $crewLeader = new User([
        'role' => 'crew',
        'primary_crew_id' => 10,
    ]);
    $unassignedComplaint = new Complaint([
        'assigned_crew_id' => null,
    ]);
    $assignedComplaint = new Complaint([
        'assigned_crew_id' => 10,
    ]);

    expect($policy->intervene($operator, $unassignedComplaint))->toBeTrue()
        ->and($policy->view($crewLeader, $unassignedComplaint))->toBeTrue()
        ->and($policy->intervene($crewLeader, $unassignedComplaint))->toBeFalse()
        ->and($policy->intervene($crewLeader, $assignedComplaint))->toBeTrue();
});

test('intervention internal supplies notes can be validated and stored', function () {
    $request = new StoreComplaintInterventionRequest;
    $intervention = new ComplaintIntervention;

    expect($request->rules())->toHaveKey('internal_supplies_notes')
        ->and($request->rules())->toHaveKey('response_code')
        ->and($request->rules())->toHaveKey('citizen_message')
        ->and($intervention->isFillable('internal_supplies_notes'))->toBeTrue()
        ->and($intervention->isFillable('response_code'))->toBeTrue()
        ->and($intervention->isFillable('citizen_message'))->toBeTrue();
});

test('public complaint categories use slugs for scalable public routes', function () {
    $category = new ComplaintCategory;

    expect($category->isFillable('slug'))->toBeTrue()
        ->and(route('complaints.public.create', ['category' => 'alumbrado-publico']))
        ->toEndWith('/reclamos/alumbrado-publico')
        ->and(route('complaints.public.store', ['category' => 'alumbrado-publico']))
        ->toEndWith('/reclamos/alumbrado-publico');
});

test('complaint dashboard keeps one general route for all complaint modules', function () {
    expect(route('admin.complaints.dashboard'))
        ->toEndWith('/admin/reclamos/dashboard')
        ->and(route('dashboard'))
        ->toEndWith('/dashboard');
});
