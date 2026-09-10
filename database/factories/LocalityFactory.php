<?php

namespace Database\Factories;

use App\Models\Locality;
use App\Models\OperationalZone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Locality>
 */
class LocalityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'operational_zone_id' => OperationalZone::factory(),
            'name' => fake()->unique()->city(),
            'active' => true,
        ];
    }
}
