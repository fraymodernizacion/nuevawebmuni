<?php

namespace App\Http\Controllers;

use App\Enums\IntakeRequestStatus;
use App\Http\Requests\StorePublicIntakeRequestRequest;
use App\Http\Requests\TrackIntakeRequestRequest;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestHistory;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Support\LocalDateTime;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
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

    public function create(Request $request, IntakeRequestType $type): Response
    {
        abort_unless($type->active, 404);

        $type->load(['subtypes' => fn ($query) => $query
            ->where('active', true)
            ->where('publication_status', 'published')
            ->orderBy('sort_order')
            ->orderBy('name')]);

        return Inertia::render('intake/public/create', [
            'type' => $this->typePayload($type),
            'emailNotificationsEnabled' => (bool) config('mail.intake.enabled'),
            'initialSubtypeId' => $type->subtypes->firstWhere('id', $request->integer('subtipo'))?->id,
        ]);
    }

    public function store(IntakeRequestType $type, StorePublicIntakeRequestRequest $request): RedirectResponse
    {
        abort_unless($type->active, 404);

        $storedPaths = [];

        try {
            $intakeRequest = DB::transaction(function () use ($type, $request, &$storedPaths): IntakeRequest {
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

                $this->storeAttachments($intakeRequest, $request->file('attachments', []), 'initial', $storedPaths);

                return $intakeRequest;
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($storedPaths);

            throw $exception;
        }

        return redirect()->to(URL::temporarySignedRoute('intake.public.received', now()->addMinutes(30), $intakeRequest));
    }

    public function received(IntakeRequest $intakeRequest): Response
    {
        return Inertia::render('intake/public/received', [
            'request' => [
                'public_code' => $intakeRequest->public_code,
            ],
        ]);
    }

    public function trackCreate(): Response
    {
        return Inertia::render('intake/public/track', [
            'currentYear' => LocalDateTime::today()->format('Y'),
        ]);
    }

    public function track(TrackIntakeRequestRequest $request): RedirectResponse
    {
        $intakeRequest = IntakeRequest::where('public_code', $request->publicCode())->first();
        $storedDni = preg_replace('/[.\s]+/u', '', (string) $intakeRequest?->applicant_dni) ?? '';

        if (! $intakeRequest || ! hash_equals($storedDni, $request->validated('applicant_dni'))) {
            return back()->withErrors([
                'number' => 'No encontramos una solicitud con ese año, número y DNI. Revisá los datos e intentá de nuevo.',
            ]);
        }

        $request->session()->put('intake_tracking', [
            'public_code' => $intakeRequest->public_code,
            'expires_at' => now()->addMinutes(30)->timestamp,
        ]);

        return to_route('intake.public.status', $intakeRequest->public_code);
    }

    public function status(Request $request, string $code): Response|RedirectResponse
    {
        if (! $this->canTrack($request, $code)) {
            return to_route('intake.public.track')->withErrors([
                'number' => 'Ingresá tu número de trámite y tu DNI para consultar el estado.',
            ]);
        }

        $intakeRequest = IntakeRequest::with('type:id,name')->where('public_code', $code)->firstOrFail();
        $histories = $intakeRequest->histories()->orderByDesc('id')->get();
        $latest = $histories->first();
        $documentationReceived = $intakeRequest->status === IntakeRequestStatus::UnderReview && $latest?->action === 'documentation_received';
        $message = match ($intakeRequest->status) {
            IntakeRequestStatus::NeedsDocumentation => $latest?->to_status === IntakeRequestStatus::NeedsDocumentation && filled($latest->public_comment) ? $latest : null,
            IntakeRequestStatus::Answered => $histories->first(fn (IntakeRequestHistory $history): bool => $history->to_status === IntakeRequestStatus::Answered && filled($history->public_comment)),
            default => $histories->first(fn (IntakeRequestHistory $history): bool => $history->action !== 'created' && filled($history->public_comment)),
        };

        return Inertia::render('intake/public/status', [
            'request' => [
                'public_code' => $intakeRequest->public_code,
                'type' => $intakeRequest->type->name,
                'status' => $intakeRequest->status->label(),
                'status_code' => $intakeRequest->status->value,
                'updated_at' => LocalDateTime::format($latest?->changed_at ?? $intakeRequest->updated_at),
                'response' => $message && ! $documentationReceived ? [
                    'id' => $message->id,
                    'text' => $message->public_comment,
                    'date' => LocalDateTime::format($message->changed_at),
                ] : null,
                'documentation_received' => $documentationReceived,
                'documentation_request_id' => $intakeRequest->status === IntakeRequestStatus::NeedsDocumentation ? $latest?->id : null,
                'summary' => $intakeRequest->summary,
                'created_at' => LocalDateTime::format($intakeRequest->created_at),
                'timeline' => $histories->map(fn (IntakeRequestHistory $history): array => [
                    'id' => $history->id,
                    'action' => $history->action,
                    'status_code' => $history->to_status?->value,
                    'status_label' => $history->to_status?->label(),
                    'date' => LocalDateTime::format($history->changed_at),
                    'comment' => $history->public_comment,
                ])->values(),
            ],
        ]);
    }

    public function storeDocumentation(Request $request, string $code): RedirectResponse
    {
        if (! $this->canTrack($request, $code)) {
            return to_route('intake.public.track')->withErrors([
                'number' => 'Volvé a ingresar tu número de trámite y tu DNI para adjuntar documentación.',
            ]);
        }

        $validated = $request->validate([
            'documentation_request_id' => ['nullable', 'integer', 'min:1'],
            'attachments' => ['required', 'array', 'min:1', 'max:5'],
            'attachments.*' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx', 'max:10240'],
        ], [
            'attachments.required' => 'Elegí al menos un archivo.',
            'attachments.max' => 'Podés adjuntar hasta 5 archivos por pedido.',
            'attachments.*.uploaded' => 'No pudimos recibir este archivo. Seleccionalo de nuevo y verificá que pese hasta 10 MB.',
            'attachments.*.max' => 'Cada archivo debe pesar hasta 10 MB.',
            'attachments.*.mimes' => 'Elegí archivos PDF, Word o imágenes JPG, PNG o WebP.',
        ]);

        $expectedHistoryId = isset($validated['documentation_request_id']) ? (int) $validated['documentation_request_id'] : null;
        $storedPaths = [];

        try {
            $accepted = DB::transaction(function () use ($code, $validated, $expectedHistoryId, &$storedPaths): bool {
                $lockedRequest = IntakeRequest::where('public_code', $code)->lockForUpdate()->firstOrFail();
                $latestHistoryId = $lockedRequest->histories()->orderByDesc('id')->value('id');

                if ($lockedRequest->status !== IntakeRequestStatus::NeedsDocumentation || $latestHistoryId !== $expectedHistoryId) {
                    return false;
                }

                $this->storeAttachments($lockedRequest, $validated['attachments'], 'supplemental', $storedPaths);
                $lockedRequest->update(['status' => IntakeRequestStatus::UnderReview]);
                $lockedRequest->histories()->create([
                    'from_status' => IntakeRequestStatus::NeedsDocumentation,
                    'to_status' => IntakeRequestStatus::UnderReview,
                    'action' => 'documentation_received',
                    'new_values' => ['attachment_count' => count($storedPaths)],
                    'changed_at' => now(),
                ]);

                return true;
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($storedPaths);

            throw $exception;
        }

        $redirect = to_route('intake.public.status', $code);

        return $accepted ? $redirect : $redirect->withErrors([
            'documentation_request_id' => 'El pedido de documentación cambió. Revisá el estado actual antes de volver a enviar archivos.',
        ]);
    }

    private function canTrack(Request $request, string $code): bool
    {
        $tracking = $request->session()->get('intake_tracking', []);

        return ($tracking['public_code'] ?? null) === $code
            && ($tracking['expires_at'] ?? 0) > now()->timestamp;
    }

    /**
     * @param  array<UploadedFile>  $files
     * @param  list<string>  $storedPaths
     */
    private function storeAttachments(IntakeRequest $intakeRequest, array $files, string $type, array &$storedPaths): void
    {
        foreach ($files as $file) {
            $path = $file->store("intake/{$intakeRequest->public_code}", 'local');
            if ($path === false) {
                throw new \RuntimeException('No se pudo guardar un adjunto de Mesa de Entrada.');
            }
            $storedPaths[] = $path;

            $intakeRequest->attachments()->create([
                'disk' => 'local',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'type' => $type,
            ]);
        }
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
