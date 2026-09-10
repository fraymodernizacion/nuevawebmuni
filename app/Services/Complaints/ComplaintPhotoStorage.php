<?php

namespace App\Services\Complaints;

use App\Enums\ComplaintPhotoType;
use App\Models\Complaint;
use App\Models\ComplaintPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ComplaintPhotoStorage
{
    public function store(Complaint $complaint, UploadedFile $file, ComplaintPhotoType $type, ?int $userId = null): ComplaintPhoto
    {
        $extension = $file->guessExtension() ?: $file->extension();
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $file->storeAs('complaints/'.$complaint->public_code, $filename, 'public');

        return $complaint->photos()->create([
            'user_id' => $userId,
            'type' => $type,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'size' => $file->getSize() ?: Storage::disk('public')->size($path),
            'taken_at' => now(),
        ]);
    }
}
