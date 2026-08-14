<?php

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

uses(TestCase::class);

test('juzgado de faltas route points to the juzgado page', function () {
    $route = Route::getRoutes()->getByName('juzgado-faltas');

    expect(route('juzgado-faltas', absolute: false))->toBe('/juzgado-faltas')
        ->and($route?->uri())->toBe('juzgado-faltas')
        ->and($route?->defaults['component'] ?? null)->toBe('juzgado-faltas');
});
