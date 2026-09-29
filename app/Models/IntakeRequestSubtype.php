<?php

namespace App\Models;

use Database\Factories\IntakeRequestSubtypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'intake_request_type_id',
    'default_intake_assistance_type_id',
    'slug',
    'name',
    'description',
    'cost_information',
    'result_information',
    'requirements',
    'schema',
    'sort_order',
    'publication_status',
    'active',
])]
class IntakeRequestSubtype extends Model
{
    /** @use HasFactory<IntakeRequestSubtypeFactory> */
    use HasFactory;

    protected $attributes = [
        'publication_status' => 'published',
        'active' => true,
        'sort_order' => 0,
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(IntakeRequestType::class, 'intake_request_type_id');
    }

    public function defaultAssistanceType(): BelongsTo
    {
        return $this->belongsTo(IntakeAssistanceType::class, 'default_intake_assistance_type_id');
    }

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
            'schema' => 'array',
            'active' => 'boolean',
        ];
    }
}
