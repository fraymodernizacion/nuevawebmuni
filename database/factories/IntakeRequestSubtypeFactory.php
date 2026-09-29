<?php

namespace Database\Factories;

use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntakeRequestSubtype>
 */
class IntakeRequestSubtypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'intake_request_type_id' => IntakeRequestType::factory(),
            'default_intake_assistance_type_id' => null,
            'slug' => fake()->unique()->slug(3),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'cost_information' => 'Sin costo informado',
            'result_information' => fake()->sentence(),
            'requirements' => ['Datos de contacto'],
            'schema' => [
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ],
            'sort_order' => 0,
            'publication_status' => 'published',
            'active' => true,
        ];
    }
}
