<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['intake_request_id', 'uploaded_by', 'disk', 'path', 'original_name', 'mime_type', 'size', 'type'])]
class IntakeRequestAttachment extends Model
{
    public function request(): BelongsTo
    {
        return $this->belongsTo(IntakeRequest::class, 'intake_request_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
