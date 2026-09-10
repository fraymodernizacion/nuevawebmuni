<?php

namespace Database\Factories;

use App\Enums\WorkRouteStatus;
use App\Models\Crew;
use App\Models\OperationalZone;
use App\Models\WorkRoute;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkRoute>
 */
class WorkRouteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date' => today(),
            'operational_zone_id' => OperationalZone::factory(),
            'crew_id' => Crew::factory(),
            'status' => WorkRouteStatus::Planned,
        ];
    }
}
