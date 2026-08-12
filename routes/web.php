<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/index.html', '/', 301);
Route::inertia('/', 'home')->name('home');
Route::inertia('/rentas', 'rentas')->name('rentas');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
