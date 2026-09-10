<?php

namespace Database\Factories;

use App\Models\InventoryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryItem>
 */
class InventoryItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('INV-###-??')),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'unit' => fake()->randomElement(['unidad', 'metro', 'metro lineal', 'kit', 'bobina']),
            'current_stock' => fake()->randomFloat(2, 0, 250),
            'minimum_stock' => fake()->randomFloat(2, 0, 25),
            'qr_value' => fake()->unique()->bothify('INV-QR-###-??'),
            'source_sheet' => 'CONTROL DE INVENTARIO',
            'source_row' => fake()->numberBetween(6, 200),
            'active' => true,
        ];
    }
}
