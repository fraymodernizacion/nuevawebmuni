<?php

namespace App\Http\Controllers;

use App\Enums\IntakeRequestStatus;
use App\Http\Requests\StorePublicIntakeRequestRequest;
use App\Http\Requests\TrackIntakeRequestRequest;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicIntakeRequestController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('intake/public/index', [
            'types' => IntakeRequestType::where('active', true)
                ->orderBy('category')
                ->orderBy('name')
                ->get()
                ->map(fn (IntakeRequestType $type): array => $this->typePayload($type)),
        ]);
    }

    public function create(IntakeRequestType $type): Response
    {
        abort_unless($type->active, 404);

        return Inertia::render('intake/public/create', [
            'type' => $this->typePayload($type),
        ]);
    }

    public function store(IntakeRequestType $type, StorePublicIntakeRequestRequest $request): RedirectResponse
    {
        abort_unless($type->active, 404);

        $intakeRequest = DB::transaction(function () use ($type, $request): IntakeRequest {
            $validated = $request->validated();
            $fields = $validated['fields'] ?? [];
            $intakeRequest = IntakeRequest::create([
                ...Arr::except($validated, ['fields', 'attachments']),
                'intake_request_type_id' => $type->id,
                'public_code' => $this->nextPublicCode(),
                'status' => IntakeRequestStatus::Received,
                'subject' => $type->name,
                'payload' => $fields,
            ]);

            $intakeRequest->histories()->create([
                'to_status' => IntakeRequestStatus::Received,
                'action' => 'created',
                'public_comment' => 'Solicitud recibida por Mesa de Entrada Virtual.',
                'new_values' => ['type' => $type->name],
                'changed_at' => now(),
            ]);

            foreach ($request->file('attachments', []) as $file) {
                $intakeRequest->attachments()->create([
                    'disk' => 'public',
                    'path' => $file->store("intake/{$intakeRequest->public_code}", 'public'),
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'type' => 'initial',
                ]);
            }

            return $intakeRequest;
        });

        return redirect()->route('intake.public.received', $intakeRequest);
    }

    public function received(IntakeRequest $intakeRequest): Response
    {
        return Inertia::render('intake/public/received', [
            'request' => [
                'public_code' => $intakeRequest->public_code,
                'applicant_phone' => $intakeRequest->applicant_phone,
            ],
        ]);
    }

    public function trackCreate(): Response
    {
        return Inertia::render('intake/public/track');
    }

    public function track(TrackIntakeRequestRequest $request): Response|RedirectResponse
    {
        $validated = $request->validated();
        $intakeRequest = IntakeRequest::with(['type:id,name', 'histories'])
            ->where('public_code', $validated['public_code'])
            ->where('applicant_phone', $validated['applicant_phone'])
            ->first();

        if (! $intakeRequest) {
            return back()->withErrors([
                'public_code' => 'No encontramos una solicitud con ese numero y telefono.',
            ]);
        }

        return Inertia::render('intake/public/status', [
            'request' => [
                'public_code' => $intakeRequest->public_code,
                'type' => $intakeRequest->type->name,
                'status' => $intakeRequest->status->label(),
                'summary' => $intakeRequest->summary,
                'created_at' => $intakeRequest->created_at?->format('d/m/Y H:i'),
                'timeline' => $intakeRequest->histories->map(fn ($history): array => [
                    'action' => $history->action,
                    'status_label' => $history->to_status?->label(),
                    'date' => $history->changed_at?->format('d/m/Y H:i'),
                    'comment' => $history->public_comment,
                ])->values(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function typePayload(IntakeRequestType $type): array
    {
        return [
            'id' => $type->id,
            'slug' => $type->slug,
            'name' => $type->name,
            'category' => $type->category,
            'description' => $type->description,
            'icon' => $type->icon,
            'color' => $type->color,
            'estimated_time' => $type->estimated_time,
            'requirements' => $type->requirements ?? [],
            'schema' => $type->schema ?? [],
        ];
    }

    private function nextPublicCode(): string
    {
        $year = now()->format('Y');
        $lastCode = IntakeRequest::where('public_code', 'like', "FME-{$year}-%")
            ->lockForUpdate()
            ->latest('id')
            ->value('public_code');
        $nextNumber = $lastCode ? ((int) str($lastCode)->afterLast('-')->toString()) + 1 : 1;

        return sprintf('FME-%s-%06d', $year, $nextNumber);
    }
}
