<?php

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

uses(TestCase::class);

test('boletin route points to the boletin page', function () {
    $route = Route::getRoutes()->getByName('boletin');

    expect(route('boletin', absolute: false))->toBe('/boletin')
        ->and($route?->uri())->toBe('boletin')
        ->and($route?->defaults['component'] ?? null)->toBe('boletin');
});
