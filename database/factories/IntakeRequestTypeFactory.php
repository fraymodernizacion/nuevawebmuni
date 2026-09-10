<?php

namespace Database\Factories;

use App\Models\IntakeRequestType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntakeRequestType>
 */
class IntakeRequestTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slug' => fake()->unique()->slug(2),
            'name' => fake()->words(3, true),
            'category' => fake()->randomElement(['Presentaciones', 'Rentas', 'Comercio']),
            'description' => fake()->sentence(),
            'icon' => 'file-text',
            'color' => '#2563eb',
            'estimated_time' => '8 minutos',
            'requirements' => ['Datos de contacto'],
            'schema' => [
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ],
            'active' => true,
        ];
    }
}
