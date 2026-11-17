import { useForm } from '@inertiajs/react';
import { ArrowRight, LockKeyhole, Save, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { intakeStatusClass } from '@/lib/intake-labels';
import { cn } from '@/lib/utils';
import { update } from '@/routes/admin/intake/status';

const steps = [
    'Seleccionar estado',
    'Completar información',
    'Revisar y confirmar',
] as const;

const statusHelp: Record<
    string,
    {
        description: string;
        example?: string;
        messageRequired?: string;
        review?: string;
    }
> = {
    received: { description: 'Registra el ingreso de la solicitud.' },
    under_review: {
        description: 'Indica que el municipio está revisando la solicitud.',
    },
    routed: {
        description:
            'Indica que la solicitud está en gestión. La asignación de áreas se realiza desde «Tipificar y derivar».',
    },
    needs_documentation: {
        description: 'Pide al vecino los documentos necesarios para continuar.',
        messageRequired: 'Indicá qué documentación debe presentar el vecino.',
        example:
            'Adjuntá una copia de la última factura en el seguimiento del trámite.',
        review: 'El seguimiento mostrará el pedido y habilitará la carga de documentación.',
    },
    answered: {
        description:
            'Registra una respuesta del municipio. La gestión puede continuar.',
        messageRequired: 'Escribí la respuesta que verá el vecino.',
        example:
            'Verificamos tu solicitud. Te informaremos por este mismo seguimiento cuando el pago se acredite.',
    },
    finished: {
        description: 'Da por concluida la gestión del municipio.',
        review: 'Al confirmar, el trámite figurará como finalizado en el seguimiento.',
    },
    rejected: {
        description:
            'Indica que el municipio determinó que la solicitud no puede continuar o no corresponde.',
        example:
            'Esta solicitud corresponde a otro organismo. Podés presentarla en…',
    },
};

type Props = {
    request: {
        id: number;
        public_code: string;
        status: string;
        status_label: string;
        area?: string | null;
        applicant_email?: string | null;
    };
    statuses: { value: string; label: string }[];
    emailNotificationsEnabled: boolean;
    onClose: () => void;
    onSaved: () => void;
};

type FieldName = 'status' | 'area' | 'public_comment' | 'internal_comment';

function makeSubmissionId() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('');
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join('-');
}

export default function StatusUpdateDialog({
    request,
    statuses,
    emailNotificationsEnabled,
    onClose,
    onSaved,
}: Props) {
    const [step, setStep] = useState(0);
    const [discard, setDiscard] = useState(false);
    const [saveError, setSaveError] = useState('');
    const heading = useRef<HTMLHeadingElement>(null);
    const submissionId = useRef<string | null>(null);
    const submitting = useRef(false);
    const form = useForm({
        status: request.status,
        area: request.area ?? '',
        public_comment: '',
        internal_comment: '',
    });
    const guide = statusHelp[form.data.status];
    const statusLabel =
        statuses.find((item) => item.value === form.data.status)?.label ??
        request.status_label;
    const publicMessage = form.data.public_comment.trim();
    const internalNote = form.data.internal_comment.trim();
    const area = form.data.area.trim() || request.area || 'Sin área registrada';

    useEffect(() => {
        heading.current?.focus();
    }, [step, discard]);

    function edit(field: FieldName, value: string) {
        form.setData(field, value);
        form.clearErrors(field);
        if (field === 'status') {
            form.clearErrors('public_comment');
        }
        submissionId.current = null;
        setSaveError('');
    }

    function requestClose() {
        if (submitting.current) {
            return;
        }
        if (discard) {
            setDiscard(false);
        } else if (form.isDirty) {
            setDiscard(true);
        } else {
            onClose();
        }
    }

    function save() {
        submitting.current = true;
        setSaveError('');
        const id = submissionId.current ?? makeSubmissionId();
        submissionId.current = id;
        form.transform((values) => ({ ...values, submission_id: id }));
        form.patch(update.url(request.id), {
            preserveScroll: true,
            onSuccess: onSaved,
            onError: (errors) => {
                if (errors.status || errors.area) {
                    setStep(0);
                } else if (errors.public_comment || errors.internal_comment) {
                    setStep(1);
                } else {
                    setSaveError(
                        'No se pudieron validar los cambios. Revisá los datos e intentá otra vez.',
                    );
                }
            },
            onHttpException: (response) => {
                setSaveError(
                    response.status === 419
                        ? 'La sesión venció. Los datos siguen cargados. Volvé a iniciar sesión en otra pestaña antes de reintentar.'
                        : 'El servidor no confirmó el guardado. Podés reintentar con los mismos datos.',
                );
                return false;
            },
            onNetworkError: () => {
                setSaveError(
                    'Se interrumpió la conexión. Podés reintentar con los mismos datos.',
                );
                return false;
            },
            onFinish: () => {
                submitting.current = false;
            },
        });
    }

    function advance(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting.current || discard) {
            return;
        }
        if (step === 1 && guide?.messageRequired && !publicMessage) {
            form.setError('public_comment', guide.messageRequired);
            document.getElementById('status-public-comment')?.focus();
            return;
        }
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            save();
        }
    }

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) requestClose();
            }}
        >
            <DialogContent
                closeLabel="Cerrar actualización de estado"
                className="flex max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    heading.current?.focus();
                }}
                onCloseAutoFocus={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="shrink-0 gap-1 border-t-4 border-b border-t-municipal-lime bg-municipal-tint p-4 pe-12 text-left sm:px-6">
                    <DialogTitle className="text-xl">
                        Cambiar estado
                    </DialogTitle>
                    <DialogDescription>
                        Trámite{' '}
                        <span className="font-mono font-semibold text-foreground">
                            {request.public_code}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                {discard ? (
                    <>
                        <div className="overflow-y-auto p-4 sm:px-6">
                            <h3
                                ref={heading}
                                tabIndex={-1}
                                className="text-lg font-semibold"
                            >
                                Tenés cambios sin guardar
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Si cerrás ahora, se perderán los datos que
                                cargaste en este formulario.
                            </p>
                        </div>
                        <DialogFooter className="shrink-0 gap-2 border-t p-4 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11"
                                onClick={onClose}
                            >
                                Descartar cambios
                            </Button>
                            <Button
                                type="button"
                                className="min-h-11"
                                onClick={() => setDiscard(false)}
                            >
                                Seguir editando
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <form
                        onSubmit={advance}
                        className="flex min-h-0 flex-col"
                        aria-busy={form.processing}
                    >
                        <div className="min-h-0 overflow-y-auto p-4 sm:px-6">
                            <ol
                                aria-label="Progreso de la actualización"
                                className="mb-5 grid grid-cols-3 gap-2"
                            >
                                {steps.map((label, index) => (
                                    <li
                                        key={label}
                                        aria-current={
                                            step === index ? 'step' : undefined
                                        }
                                        className={cn(
                                            'min-w-0 border-t-2 pt-2 text-xs leading-snug',
                                            index < step &&
                                                'border-municipal-lime',
                                            index === step &&
                                                'border-municipal-link',
                                            index > step && 'border-border',
                                            index === step
                                                ? 'font-semibold text-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {index + 1}. {label}
                                    </li>
                                ))}
                            </ol>

                            <h3
                                ref={heading}
                                tabIndex={-1}
                                className="mb-3 text-lg font-semibold"
                            >
                                {steps[step]}
                            </h3>

                            {step === 0 && (
                                <div className="grid gap-4">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-medium">
                                            Estado actual
                                        </span>
                                        <StatusBadge status={request.status}>
                                            {request.status_label}
                                        </StatusBadge>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="status-new"
                                            className="text-sm font-medium"
                                        >
                                            Nuevo estado
                                        </label>
                                        <select
                                            id="status-new"
                                            className="input min-h-11 w-full"
                                            value={form.data.status}
                                            onChange={(event) =>
                                                edit(
                                                    'status',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={!!form.errors.status}
                                            aria-describedby={
                                                'status-description' +
                                                (form.errors.status
                                                    ? ' status-error'
                                                    : '')
                                            }
                                        >
                                            {statuses.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p
                                            id="status-description"
                                            className="text-sm text-muted-foreground"
                                        >
                                            {guide?.description}
                                        </p>
                                        <FieldError
                                            id="status-error"
                                            message={form.errors.status}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="status-area"
                                            className="text-sm font-medium"
                                        >
                                            Área / sector{' '}
                                            <span className="text-muted-foreground">
                                                (opcional)
                                            </span>
                                        </label>
                                        <input
                                            id="status-area"
                                            className="input min-h-11 w-full"
                                            value={form.data.area}
                                            maxLength={160}
                                            onChange={(event) =>
                                                edit('area', event.target.value)
                                            }
                                            aria-invalid={!!form.errors.area}
                                            aria-describedby={
                                                form.errors.area
                                                    ? 'status-area-error'
                                                    : undefined
                                            }
                                        />
                                        <FieldError
                                            id="status-area-error"
                                            message={form.errors.area}
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="grid gap-4">
                                    <div className="grid gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                                        <label
                                            htmlFor="status-public-comment"
                                            className="text-sm font-semibold"
                                        >
                                            Mensaje visible para el vecino{' '}
                                            {guide?.messageRequired && (
                                                <span className="font-normal">
                                                    (obligatorio)
                                                </span>
                                            )}
                                        </label>
                                        <p
                                            id="status-public-help"
                                            className="text-sm text-muted-foreground"
                                        >
                                            Aparecerá en el seguimiento público.
                                            {guide?.example && (
                                                <> Ejemplo: «{guide.example}»</>
                                            )}
                                        </p>
                                        <textarea
                                            id="status-public-comment"
                                            className="input min-h-28 w-full"
                                            value={form.data.public_comment}
                                            maxLength={5000}
                                            onChange={(event) =>
                                                edit(
                                                    'public_comment',
                                                    event.target.value,
                                                )
                                            }
                                            aria-required={
                                                !!guide?.messageRequired
                                            }
                                            aria-invalid={
                                                !!form.errors.public_comment
                                            }
                                            aria-describedby={
                                                'status-public-help' +
                                                (form.errors.public_comment
                                                    ? ' status-public-error'
                                                    : '')
                                            }
                                        />
                                        <FieldError
                                            id="status-public-error"
                                            message={form.errors.public_comment}
                                        />
                                    </div>
                                    <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                                        <label
                                            htmlFor="status-internal-comment"
                                            className="flex items-center gap-1.5 text-sm font-semibold"
                                        >
                                            <LockKeyhole
                                                aria-hidden="true"
                                                className="size-4"
                                            />{' '}
                                            Nota interna
                                        </label>
                                        <p
                                            id="status-internal-help"
                                            className="text-sm text-muted-foreground"
                                        >
                                            Solo visible para personal
                                            autorizado.
                                        </p>
                                        <textarea
                                            id="status-internal-comment"
                                            className="input min-h-20 w-full"
                                            value={form.data.internal_comment}
                                            maxLength={5000}
                                            onChange={(event) =>
                                                edit(
                                                    'internal_comment',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={
                                                !!form.errors.internal_comment
                                            }
                                            aria-describedby={
                                                'status-internal-help' +
                                                (form.errors.internal_comment
                                                    ? ' status-internal-error'
                                                    : '')
                                            }
                                        />
                                        <FieldError
                                            id="status-internal-error"
                                            message={
                                                form.errors.internal_comment
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid gap-3">
                                    <dl className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
                                        <div>
                                            <dt className="text-muted-foreground">
                                                Número de trámite
                                            </dt>
                                            <dd className="font-mono font-semibold">
                                                {request.public_code}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">
                                                Área / sector
                                            </dt>
                                            <dd className="font-medium [overflow-wrap:anywhere]">
                                                {area}
                                            </dd>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                                            <div>
                                                <dt className="mb-1 text-muted-foreground">
                                                    Estado anterior
                                                </dt>
                                                <dd>
                                                    <StatusBadge
                                                        status={request.status}
                                                    >
                                                        {request.status_label}
                                                    </StatusBadge>
                                                </dd>
                                            </div>
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="mt-5 size-4 shrink-0 text-muted-foreground"
                                            />
                                            <div>
                                                <dt className="mb-1 text-muted-foreground">
                                                    Estado nuevo
                                                </dt>
                                                <dd>
                                                    <StatusBadge
                                                        status={
                                                            form.data.status
                                                        }
                                                    >
                                                        {statusLabel}
                                                    </StatusBadge>
                                                </dd>
                                            </div>
                                        </div>
                                    </dl>
                                    <ReviewNote
                                        label="Mensaje visible para el vecino"
                                        tone="public"
                                    >
                                        {publicMessage ||
                                            'Sin mensaje público en esta actualización.'}
                                    </ReviewNote>
                                    {internalNote && (
                                        <ReviewNote
                                            label="Nota interna"
                                            tone="internal"
                                        >
                                            {internalNote}
                                        </ReviewNote>
                                    )}
                                    {guide?.review && (
                                        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                                            <TriangleAlert
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0"
                                            />{' '}
                                            {guide.review}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        El cambio se refleja en el seguimiento
                                        público.
                                        {emailNotificationsEnabled &&
                                        request.applicant_email &&
                                        form.data.status !== request.status
                                            ? ' Se programará un aviso por correo al vecino.'
                                            : emailNotificationsEnabled &&
                                                !request.applicant_email
                                              ? ' El trámite no tiene un correo registrado para enviar el aviso.'
                                              : ''}
                                    </p>
                                </div>
                            )}
                            {saveError && (
                                <p
                                    role="alert"
                                    className="mt-3 rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
                                >
                                    {saveError}
                                </p>
                            )}
                        </div>
                        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t bg-background p-3 sm:justify-between sm:px-6">
                            {step === 0 ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="min-h-11"
                                    onClick={requestClose}
                                >
                                    Cancelar
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="min-h-11"
                                    disabled={form.processing}
                                    onClick={() => setStep(step - 1)}
                                >
                                    {step === 2 ? 'Volver a editar' : 'Atrás'}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="min-h-11 bg-municipal-action whitespace-normal text-municipal-on-action hover:bg-municipal-action/90"
                            >
                                {step === 2 && <Save aria-hidden="true" />}
                                {form.processing
                                    ? 'Guardando…'
                                    : step === 2
                                      ? 'Confirmar actualización'
                                      : 'Continuar'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function StatusBadge({
    status,
    children,
}: {
    status: string;
    children: ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-block rounded-md border px-2 py-1 text-sm font-medium',
                intakeStatusClass(status),
            )}
        >
            {children}
        </span>
    );
}

function FieldError({ id, message }: { id: string; message?: string }) {
    return message ? (
        <p id={id} role="alert" className="text-sm text-destructive">
            {message}
        </p>
    ) : null;
}

function ReviewNote({
    label,
    tone,
    children,
}: {
    label: string;
    tone: 'public' | 'internal';
    children: string;
}) {
    return (
        <div
            className={cn(
                'grid gap-1 rounded-lg border p-3 text-sm',
                tone === 'public'
                    ? 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30'
                    : 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30',
            )}
        >
            <h4 className="flex items-center gap-1.5 font-semibold">
                {tone === 'internal' && (
                    <LockKeyhole aria-hidden="true" className="size-4" />
                )}{' '}
                {label}
            </h4>
            <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                {children}
            </p>
        </div>
    );
}
