<?php

namespace Database\Factories;

use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ComplaintType>
 */
class ComplaintTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'complaint_category_id' => ComplaintCategory::factory(),
            'name' => fake()->words(3, true),
            'requires_description' => false,
            'active' => true,
        ];
    }
}
