<?php

namespace App\Observers;

use App\Mail\IntakeStatusMail;
use App\Models\IntakeRequestHistory;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Mail;
use Throwable;

class IntakeRequestHistoryObserver implements ShouldHandleEventsAfterCommit
{
    public function created(IntakeRequestHistory $history): void
    {
        $status = $history->to_status;
        $received = $history->action === 'created';
        $hasResponseDocuments = (int) data_get($history->new_values, 'response_document_count', 0) > 0;

        if (! config('mail.intake.enabled') || ! $status || (! $received && ! $hasResponseDocuments && (! $history->from_status || $history->from_status === $status))) {
            return;
        }

        $intake = $history->request;
        if (! $intake || blank($intake->applicant_email)) {
            return;
        }

        try {
            Mail::mailer('intake')->to($intake->applicant_email)
                ->queue(new IntakeStatusMail($intake->public_code, $status, $received));
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
