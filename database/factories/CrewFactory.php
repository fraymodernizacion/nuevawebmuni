<?php

namespace Database\Factories;

use App\Models\Crew;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Crew>
 */
class CrewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('ALU-##'),
            'name' => fake()->randomElement([
                'Cuadrilla Turno Manana',
                'Cuadrilla Turno Noche',
                'Cuadrilla Fines de Semana y Feriados',
            ]),
            'area' => 'alumbrado_publico',
            'active' => true,
        ];
    }
}
