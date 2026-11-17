<?php

namespace App\Mail;

use App\Enums\IntakeRequestStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class IntakeStatusMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [60, 300];

    public function __construct(
        public readonly string $publicCode,
        public readonly IntakeRequestStatus $status,
        public readonly bool $received,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.intake.from_address'), 'Mesa de Entrada Virtual'),
            subject: ($this->received ? 'Recibimos tu trámite' : 'Cambió el estado de tu trámite').' '.$this->publicCode,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.intake-status',
            with: [
                'trackingUrl' => route('intake.public.track'),
                'statusLabel' => match ($this->status) {
                    IntakeRequestStatus::UnderReview => 'En revisión',
                    IntakeRequestStatus::Routed => 'En gestión',
                    IntakeRequestStatus::NeedsDocumentation => 'Requiere documentación',
                    default => $this->status->label(),
                },
                'needsDocumentation' => $this->status === IntakeRequestStatus::NeedsDocumentation,
            ],
        );
    }
}
