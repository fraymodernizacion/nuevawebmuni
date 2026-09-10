<?php

namespace Database\Factories;

use App\Enums\IntakeRequestStatus;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IntakeRequest>
 */
class IntakeRequestFactory extends Factory
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
            'public_code' => 'FME-'.now()->format('Y').'-'.fake()->unique()->numerify('######'),
            'status' => IntakeRequestStatus::Received,
            'priority' => 'normal',
            'source' => 'web',
            'applicant_name' => fake()->name(),
            'applicant_phone' => '3834'.fake()->numerify('######'),
            'applicant_email' => fake()->safeEmail(),
            'subject' => fake()->sentence(4),
            'summary' => fake()->paragraph(),
            'payload' => [],
        ];
    }
}
