<?php

namespace App\Providers;

use App\Contracts\WhatsAppNotificationService;
use App\Services\Notifications\BuilderBotWhatsAppNotificationService;
use App\Services\Notifications\NullWhatsAppNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            WhatsAppNotificationService::class,
            fn () => filled(config('services.builderbot.api_key')) && filled(config('services.builderbot.bot_id'))
                ? app(BuilderBotWhatsAppNotificationService::class)
                : app(NullWhatsAppNotificationService::class),
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Inertia::disableSsr(fn (): bool => ! config('inertia.ssr.enabled'));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            config('app.env') === 'production',
        );

        Password::defaults(fn (): ?Password => config('app.env') === 'production'
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
