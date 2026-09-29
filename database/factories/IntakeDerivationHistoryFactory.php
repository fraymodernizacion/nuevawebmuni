<?php

namespace Database\Factories;

use App\Enums\IntakeDerivationStatus;
use App\Models\IntakeDerivation;
use App\Models\IntakeDerivationHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntakeDerivationHistory>
 */
class IntakeDerivationHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'intake_derivation_id' => IntakeDerivation::factory(),
            'from_status' => IntakeDerivationStatus::Pending,
            'to_status' => IntakeDerivationStatus::InProgress,
            'action' => 'area_response_updated',
            'previous_response' => null,
            'new_response' => fake()->paragraph(),
            'changed_at' => now(),
        ];
    }
}
