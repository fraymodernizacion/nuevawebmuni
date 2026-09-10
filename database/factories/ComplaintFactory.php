<?php

namespace Database\Factories;

use App\Enums\ComplaintPriority;
use App\Enums\ComplaintStatus;
use App\Models\Complaint;
use App\Models\ComplaintCategory;
use App\Models\ComplaintType;
use App\Models\Locality;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Complaint>
 */
class ComplaintFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $locality = Locality::factory()->create();
        $category = ComplaintCategory::factory()->create(['code' => fake()->unique()->slug()]);

        return [
            'public_code' => 'ALU-'.now()->format('Y').'-'.fake()->unique()->numerify('######'),
            'complaint_category_id' => $category->id,
            'complaint_type_id' => ComplaintType::factory()->create(['complaint_category_id' => $category->id])->id,
            'locality_id' => $locality->id,
            'operational_zone_id' => $locality->operational_zone_id,
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'dni' => fake()->numerify('########'),
            'phone' => fake()->phoneNumber(),
            'description' => fake()->sentence(),
            'location_reference' => fake()->streetAddress(),
            'latitude' => fake()->latitude(-28.45, -28.28),
            'longitude' => fake()->longitude(-65.85, -65.65),
            'current_status' => ComplaintStatus::New,
            'priority' => ComplaintPriority::Normal,
        ];
    }
}
