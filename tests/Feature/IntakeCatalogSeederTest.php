<?php

use App\Models\IntakeRequest;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Models\User;
use Database\Seeders\IntakeCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('the catalog can be installed over legacy data without seeding demo accounts or requests', function () {
    $legacy = IntakeRequestType::factory()->create(['slug' => 'nota-municipio', 'active' => true]);
    $existingRequest = IntakeRequest::factory()->for($legacy, 'type')->create();
    $existingUser = User::factory()->operator()->create();
    $originalRequest = $existingRequest->fresh()->getAttributes();
    $originalUser = $existingUser->fresh()->getAttributes();

    $this->seed(IntakeCatalogSeeder::class);
    $subtypes = IntakeRequestSubtype::count();
    $this->seed(IntakeCatalogSeeder::class);

    expect(IntakeRequestSubtype::count())->toBe($subtypes)
        ->and($legacy->fresh()->active)->toBeFalse()
        ->and(IntakeRequest::count())->toBe(1)
        ->and(User::count())->toBe(1)
        ->and($existingRequest->fresh()->getAttributes())->toBe($originalRequest)
        ->and($existingUser->fresh()->getAttributes())->toBe($originalUser);

    $this->get(route('intake.public.index'))->assertInertia(
        fn (Assert $page) => $page->where('types', function ($types): bool {
            $groups = collect($types)->keyBy('slug');

            return ! $groups->has('nota-municipio')
                && ! $groups->has('haberes-institucional')
                && collect($groups['eventos']['subtypes'])->contains('slug', 'cobertura-eventos')
                && collect($groups['ambiente']['subtypes'])->contains('slug', 'castracion-domiciliaria');
        }),
    );
});
