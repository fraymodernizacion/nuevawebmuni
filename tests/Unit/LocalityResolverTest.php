<?php

use App\Models\Locality;
use App\Services\Complaints\LocalityResolver;
use Database\Seeders\ComplaintModuleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it resolves locality from gps coordinates using seeded kml boundaries', function () {
    $this->seed(ComplaintModuleSeeder::class);

    $locality = app(LocalityResolver::class)->resolve(-28.3875664, -65.7009248);

    expect($locality)->toBeInstanceOf(Locality::class)
        ->and($locality->name)->toBe('San José')
        ->and($locality->operationalZone->code)->toBe('B');
});
