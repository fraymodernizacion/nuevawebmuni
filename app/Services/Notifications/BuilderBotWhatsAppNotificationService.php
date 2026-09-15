<?php

namespace App\Services\Notifications;

use App\Contracts\WhatsAppNotificationService;
use App\Enums\ComplaintStatus;
use App\Models\Complaint;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;

class BuilderBotWhatsAppNotificationService implements WhatsAppNotificationService
{
    /**
     * @param  array<string, mixed>  $context
     * @return array{status: string, recipient?: string, external_id?: string|null, error?: string|null, payload?: array<string, mixed>}
     */
    public function sendComplaintMessage(Complaint $complaint, string $type, array $context = []): array
    {
        $botId = config('services.builderbot.bot_id');
        $apiKey = config('services.builderbot.api_key');

        if (blank($botId) || blank($apiKey)) {
            return [
                'status' => 'skipped',
                'external_id' => null,
                'error' => 'BuilderBot is not configured.',
            ];
        }

        $payload = [
            'messages' => [
                'content' => $this->bodyMessage($complaint, $type, $context),
            ],
            'number' => $this->normalizePhone($complaint->phone),
            'checkIfExists' => (bool) config('services.builderbot.check_if_exists', false),
        ];

        $photoUrl = $this->photoUrl($context);

        if ($photoUrl !== null) {
            $payload['messages']['mediaUrl'] = $photoUrl;
        }

        try {
            $response = Http::baseUrl(rtrim((string) config('services.builderbot.base_url'), '/'))
                ->withHeaders([
                    'x-api-builderbot' => $apiKey,
                ])
                ->acceptJson()
                ->asJson()
                ->timeout(8)
                ->connectTimeout(3)
                ->retry([200, 600, 1200], throw: false)
                ->post("/api/v2/{$botId}/messages", $payload);
        } catch (ConnectionException|RequestException $exception) {
            return [
                'status' => 'failed',
                'recipient' => $payload['number'],
                'external_id' => null,
                'error' => $exception->getMessage(),
                'payload' => $payload,
            ];
        }

        if ($response->failed()) {
            return [
                'status' => 'failed',
                'recipient' => $payload['number'],
                'external_id' => null,
                'error' => $this->errorMessage($response->body()),
                'payload' => $payload,
            ];
        }

        return [
            'status' => 'sent',
            'recipient' => $payload['number'],
            'external_id' => $response->json('id') ?? $response->json('messageId') ?? null,
            'payload' => $payload,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function bodyMessage(Complaint $complaint, string $type, array $context): string
    {
        $neighborName = trim($complaint->first_name.' '.$complaint->last_name);
        $neighborName = $neighborName !== '' ? $neighborName : 'vecino';
        $status = ComplaintStatus::tryFrom($type);
        $statusLabel = $status?->label() ?? 'Actualizado';
        $trackingUrl = URL::signedRoute('complaints.public.status', $complaint);
        $observation = filled($context['observation'] ?? null)
            ? "\n\nObservaciones: {$context['observation']}"
            : '';
        $photoUrl = $this->photoUrl($context);
        $photo = $photoUrl !== null
            ? "\n\nFoto de la intervencion: {$photoUrl}"
            : '';

        return match ($type) {
            'received' => "Estimado/a vecino/a {$neighborName}, recibimos su reclamo de Alumbrado Publico con codigo {$complaint->public_code}. Puede consultar el seguimiento en {$trackingUrl}.",
            ComplaintStatus::New->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} fue registrado correctamente y se encuentra en estado \"{$statusLabel}\". Puede consultar el seguimiento en {$trackingUrl}.",
            ComplaintStatus::UnderReview->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} paso a estado \"{$statusLabel}\". El equipo municipal esta verificando la informacion cargada.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            ComplaintStatus::Assigned->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} paso a estado \"{$statusLabel}\". Ya fue derivado a una cuadrilla municipal para su atencion.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            ComplaintStatus::InProgress->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} paso a estado \"{$statusLabel}\". La cuadrilla se encuentra trabajando sobre la solicitud.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            ComplaintStatus::NeedsSecondVisit->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} requiere una segunda visita de la cuadrilla para completar la solucion.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            ComplaintStatus::Resolved->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} fue resuelto por la cuadrilla municipal. Muchas gracias por colaborar con el cuidado del alumbrado publico.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            ComplaintStatus::Closed->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} fue cerrado administrativamente.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            ComplaintStatus::Cancelled->value => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} fue cancelado.{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
            default => "Estimado/a vecino/a {$neighborName}, le informamos que su reclamo {$complaint->public_code} paso a estado \"{$statusLabel}\".{$observation}{$photo}\n\nSeguimiento: {$trackingUrl}",
        };
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function photoUrl(array $context): ?string
    {
        if (filled($context['intervention_photo_url'] ?? null)) {
            return (string) $context['intervention_photo_url'];
        }

        if (filled($context['resolution_photo_url'] ?? null)) {
            return (string) $context['resolution_photo_url'];
        }

        return null;
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        $digits = ltrim($digits, '0');

        if (str_starts_with($digits, '549')) {
            return $digits;
        }

        if (str_starts_with($digits, '54')) {
            return '549'.substr($digits, 2);
        }

        return '549'.$digits;
    }

    private function errorMessage(string $body): string
    {
        $decoded = json_decode($body, true);

        if (is_array($decoded) && filled($decoded['error'] ?? null)) {
            return (string) $decoded['error'];
        }

        return $body;
    }
}
