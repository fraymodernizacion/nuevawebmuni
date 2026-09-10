<?php

namespace Database\Factories;

use App\Models\OperationalZone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OperationalZone>
 */
class OperationalZoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->lexify('?'),
            'name' => 'Zona '.fake()->unique()->lexify('?'),
            'color' => fake()->hexColor(),
            'active' => true,
        ];
    }
}
