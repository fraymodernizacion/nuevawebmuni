<?php

namespace App\Models;

use App\Enums\ComplaintPhotoType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['complaint_id', 'user_id', 'type', 'disk', 'path', 'original_name', 'mime_type', 'size', 'taken_at'])]
class ComplaintPhoto extends Model
{
    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    protected function casts(): array
    {
        return [
            'type' => ComplaintPhotoType::class,
            'taken_at' => 'datetime',
        ];
    }
}
