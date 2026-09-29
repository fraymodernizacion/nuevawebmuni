<?php

namespace App\Http\Controllers;

use App\Enums\IntakeRequestStatus;
use App\Http\Requests\StorePublicIntakeRequestRequest;
use App\Http\Requests\TrackIntakeRequestRequest;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Support\LocalDateTime;
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
            'types' => IntakeRequestType::query()
                ->with(['subtypes' => fn ($query) => $query
                    ->where('active', true)
                    ->where('publication_status', 'published')
                    ->orderBy('sort_order')
                    ->orderBy('name')])
                ->where('active', true)
                ->orderBy('category')
                ->orderBy('name')
                ->get()
                ->map(fn (IntakeRequestType $type): array => $this->typePayload($type)),
        ]);
    }

    public function create(IntakeRequestType $type): Response
    {
        abort_unless($type->active, 404);

        $type->load(['subtypes' => fn ($query) => $query
            ->where('active', true)
            ->where('publication_status', 'published')
            ->orderBy('sort_order')
            ->orderBy('name')]);

        return Inertia::render('intake/public/create', [
            'type' => $this->typePayload($type),
        ]);
    }

    public function store(IntakeRequestType $type, StorePublicIntakeRequestRequest $request): RedirectResponse
    {
        abort_unless($type->active, 404);

        $intakeRequest = DB::transaction(function () use ($type, $request): IntakeRequest {
            $validated = $request->validated();
            $subtype = $request->selectedSubtype();
            $fields = $validated['fields'] ?? [];
            $payload = [
                ...$fields,
                ...($subtype ? [
                    'subtype' => [
                        'id' => $subtype->id,
                        'slug' => $subtype->slug,
                        'name' => $subtype->name,
                    ],
                ] : []),
            ];
            $intakeRequest = IntakeRequest::create([
                ...Arr::except($validated, ['fields', 'attachments', 'intake_request_subtype_id', 'summary']),
                'intake_request_type_id' => $type->id,
                'intake_request_subtype_id' => $subtype?->id,
                'public_code' => $this->nextPublicCode(),
                'status' => IntakeRequestStatus::Received,
                'subject' => $subtype?->name ?? $type->name,
                'summary' => $this->summaryFrom($validated['summary'] ?? null, $fields, $subtype, $type),
                'payload' => $payload,
            ]);

            $intakeRequest->histories()->create([
                'to_status' => IntakeRequestStatus::Received,
                'action' => 'created',
                'public_comment' => 'Solicitud recibida por Mesa de Entrada Virtual.',
                'new_values' => [
                    'type' => $type->name,
                    'subtype' => $subtype?->name,
                ],
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
                'created_at' => LocalDateTime::format($intakeRequest->created_at),
                'timeline' => $intakeRequest->histories->map(fn ($history): array => [
                    'action' => $history->action,
                    'status_label' => $history->to_status?->label(),
                    'date' => LocalDateTime::format($history->changed_at),
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
            'cost_information' => $type->cost_information,
            'requirements' => $type->requirements ?? [],
            'schema' => $type->schema ?? [],
            'subtypes' => $type->relationLoaded('subtypes')
                ? $type->subtypes->map(fn (IntakeRequestSubtype $subtype): array => $this->subtypePayload($subtype))->values()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function subtypePayload(IntakeRequestSubtype $subtype): array
    {
        return [
            'id' => $subtype->id,
            'slug' => $subtype->slug,
            'name' => $subtype->name,
            'description' => $subtype->description,
            'cost_information' => $subtype->cost_information,
            'result_information' => $subtype->result_information,
            'requirements' => $subtype->requirements ?? [],
            'schema' => $subtype->schema ?? [],
        ];
    }

    private function nextPublicCode(): string
    {
        $year = LocalDateTime::today()->format('Y');
        $nextNumber = $this->nextPublicNumberFromCodes(
            IntakeRequest::where('public_code', 'like', "FME-{$year}-%")
                ->lockForUpdate()
                ->pluck('public_code'),
        );

        return sprintf('FME-%s-%06d', $year, $nextNumber);
    }

    /**
     * @param  iterable<int, string>  $codes
     */
    private function nextPublicNumberFromCodes(iterable $codes): int
    {
        $lastNumber = collect($codes)
            ->map(fn (string $code): string => str($code)->afterLast('-')->toString())
            ->filter(fn (string $suffix): bool => ctype_digit($suffix))
            ->map(fn (string $suffix): int => (int) $suffix)
            ->max();

        return ((int) $lastNumber) + 1;
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function summaryFrom(?string $summary, array $fields, ?IntakeRequestSubtype $subtype, IntakeRequestType $type): string
    {
        $summary = trim((string) $summary);

        if ($summary !== '') {
            return (string) str($summary)->limit(5000, '');
        }

        foreach (['detalle', 'consulta', 'motivo', 'necesidad', 'ubicacion'] as $field) {
            $value = trim((string) ($fields[$field] ?? ''));

            if ($value !== '') {
                return (string) str($value)->limit(5000, '');
            }
        }

        foreach ($fields as $value) {
            $value = trim((string) $value);

            if ($value !== '') {
                return (string) str($value)->limit(5000, '');
            }
        }

        return $subtype?->name ?? $type->name;
    }
}
