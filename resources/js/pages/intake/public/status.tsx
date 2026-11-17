import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CircleCheck,
    Clock3,
    Copy,
    FileQuestion,
    Inbox,
    MessageSquareText,
    Route,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useClipboard } from '@/hooks/use-clipboard';
import { index } from '@/routes/intake/public';
import { store } from '@/routes/intake/public/documentation';

const tones = {
    blue: 'bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100',
    amber: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
    emerald:
        'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100',
    orange: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100',
    red: 'bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100',
    neutral: 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100',
};

const states = {
    received: {
        label: 'Recibido',
        title: 'Recibimos tu solicitud',
        event: 'Solicitud recibida',
        detail: 'Tu solicitud ingresó correctamente.',
        next: 'Podés volver a consultar con tu número de trámite y tu DNI.',
        icon: Inbox,
        tone: 'blue',
    },
    under_review: {
        label: 'En revisión',
        title: 'Estamos revisando tu solicitud',
        event: 'Revisión iniciada',
        detail: 'El municipio está revisando los datos del trámite.',
        next: 'Podés consultar el avance desde esta misma sección.',
        icon: Clock3,
        tone: 'amber',
    },
    routed: {
        label: 'En gestión',
        title: 'Tu solicitud está en gestión',
        event: 'Solicitud enviada al área responsable',
        detail: 'El área municipal correspondiente recibió la solicitud.',
        next: 'Podés consultar el avance desde esta misma sección.',
        icon: Route,
        tone: 'blue',
    },
    needs_documentation: {
        label: 'Requiere documentación',
        title: 'Necesitamos que completes información',
        event: 'Se pidió documentación',
        detail: 'El municipio pidió información o documentación adicional.',
        next: 'Consultá con Mesa de Entrada qué información debés presentar e indicá tu número de trámite.',
        icon: FileQuestion,
        tone: 'orange',
    },
    answered: {
        label: 'Respondido',
        title: 'Tu trámite tiene una respuesta',
        event: 'Respuesta registrada',
        detail: 'El municipio registró una respuesta para tu solicitud.',
        next: 'Revisá la respuesta del municipio para ver si indica algún paso a seguir.',
        icon: MessageSquareText,
        tone: 'emerald',
    },
    finished: {
        label: 'Finalizado',
        title: 'Tu trámite fue finalizado',
        event: 'Trámite finalizado',
        detail: 'El municipio dio por finalizado el trámite.',
        icon: CircleCheck,
        tone: 'emerald',
    },
    rejected: {
        label: 'Rechazado o no corresponde',
        title: 'Tu solicitud no pudo continuar',
        event: 'Solicitud rechazada o fuera de alcance',
        detail: 'El municipio registró que la solicitud no puede continuar.',
        next: 'Si necesitás una aclaración, consultá con Mesa de Entrada e indicá tu número de trámite.',
        icon: XCircle,
        tone: 'red',
    },
} as const;

type StatusCode = keyof typeof states;

type Props = {
    request: {
        public_code: string;
        type: string;
        status: string;
        status_code: StatusCode;
        summary: string;
        created_at: string | null;
        updated_at: string | null;
        response: { id: number; text: string; date: string | null } | null;
        documentation_received: boolean;
        documentation_request_id: number | null;
        timeline: {
            id: number;
            action: string;
            status_code: StatusCode | null;
            date: string | null;
            comment: string | null;
        }[];
    };
};

export default function PublicIntakeStatus({ request }: Props) {
    const { errors } = usePage().props;
    const [copied, copy] = useClipboard();
    const [copyFailed, setCopyFailed] = useState(false);
    const state = states[request.status_code];
    const Icon = state?.icon ?? Clock3;
    const didCopy = copied === request.public_code;
    const needsDocumentation = request.status_code === 'needs_documentation';
    const next = state && 'next' in state ? state.next : null;
    const showNext =
        next &&
        !(needsDocumentation && request.response) &&
        !(request.status_code === 'answered' && !request.response);

    async function copyNumber() {
        setCopyFailed(!(await copy(request.public_code)));
    }

    return (
        <>
            <Head title={`Trámite ${request.public_code}`} />
            <main className="min-h-screen bg-municipal-surface px-4 py-6 text-base text-zinc-950 sm:px-6 dark:text-zinc-50">
                <div className="mx-auto grid max-w-2xl gap-6">
                    <header className="grid justify-items-start gap-3 rounded-xl border border-t-4 border-municipal-outline border-t-municipal-lime bg-card p-4 sm:p-5">
                        <p className="font-semibold text-municipal-link">
                            Seguimiento de trámite
                        </p>
                        <h1 className="text-[26px] leading-tight font-bold">
                            {state?.title ?? 'Estado de tu trámite'}
                        </h1>
                        <p
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 font-semibold ${tones[state?.tone ?? 'neutral']}`}
                        >
                            <Icon
                                aria-hidden="true"
                                className="size-5 shrink-0"
                            />
                            {state?.label ?? request.status}
                        </p>
                        {request.updated_at && (
                            <p className="text-zinc-700 dark:text-zinc-200">
                                Actualizado el{' '}
                                {request.updated_at.replace(' ', ' a las ')}
                            </p>
                        )}
                    </header>

                    {request.response && (
                        <section
                            aria-labelledby="respuesta-municipio"
                            className={`grid gap-2 rounded-lg border border-l-4 border-current/15 p-4 ${tones[needsDocumentation ? 'orange' : 'emerald']}`}
                        >
                            <h2
                                id="respuesta-municipio"
                                className="text-[22px] font-semibold"
                            >
                                {needsDocumentation
                                    ? 'Qué necesitás presentar'
                                    : 'Respuesta del municipio'}
                            </h2>
                            <p className="text-lg [overflow-wrap:anywhere] whitespace-pre-wrap">
                                {request.response.text}
                            </p>
                            {request.response.date && (
                                <p>
                                    {request.response.date.replace(' ', ' · ')}
                                </p>
                            )}
                        </section>
                    )}
                    {request.status_code === 'answered' &&
                        !request.response && (
                            <p>
                                El municipio registró una respuesta. Consultá
                                con Mesa de Entrada e indicá tu número de
                                trámite para conocer el detalle.
                            </p>
                        )}
                    {showNext && (
                        <section
                            aria-labelledby="proximo-paso"
                            className="grid gap-1"
                        >
                            <h2
                                id="proximo-paso"
                                className="text-lg font-semibold"
                            >
                                Próximo paso
                            </h2>
                            <p className="text-zinc-700 dark:text-zinc-200">
                                {next}
                            </p>
                        </section>
                    )}

                    {errors.documentation_request_id && (
                        <p
                            role="alert"
                            className="text-red-800 dark:text-red-200"
                        >
                            {errors.documentation_request_id}
                        </p>
                    )}
                    {needsDocumentation && (
                        <DocumentationForm
                            key={`${request.public_code}:${request.documentation_request_id}`}
                            code={request.public_code}
                            requestId={request.documentation_request_id}
                        />
                    )}
                    {request.documentation_received && (
                        <section
                            role="status"
                            className={`grid gap-2 rounded-lg p-4 ${tones.emerald}`}
                        >
                            <h2 className="flex items-center gap-2 text-xl font-semibold">
                                <CircleCheck
                                    aria-hidden="true"
                                    className="size-5 shrink-0"
                                />
                                Recibimos tus archivos
                            </h2>
                            <p>
                                Mesa de Entrada ya tiene la documentación para
                                revisarla.
                            </p>
                        </section>
                    )}

                    <section
                        aria-label="Datos del trámite"
                        className="grid gap-4 border-y border-zinc-200 py-5 dark:border-zinc-800"
                    >
                        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                            <div className="min-w-0">
                                <p className="font-medium text-zinc-700 dark:text-zinc-200">
                                    Número de trámite
                                </p>
                                <p className="text-[22px] font-bold [overflow-wrap:anywhere]">
                                    {request.public_code}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={copyNumber}
                                aria-label="Copiar número de trámite"
                                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-zinc-400 px-3 font-semibold text-emerald-800 dark:border-zinc-600 dark:text-emerald-300"
                            >
                                {didCopy ? (
                                    <CircleCheck
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                ) : (
                                    <Copy
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                )}
                                {didCopy ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <p
                            role="status"
                            className={
                                copyFailed
                                    ? 'text-zinc-700 dark:text-zinc-200'
                                    : 'sr-only'
                            }
                        >
                            {copyFailed
                                ? 'No pudimos copiarlo. Podés seleccionar el número y copiarlo manualmente.'
                                : didCopy
                                  ? 'Número de trámite copiado.'
                                  : ''}
                        </p>
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <dt className="text-zinc-700 dark:text-zinc-200">
                                    Tipo de trámite
                                </dt>
                                <dd className="font-semibold">
                                    {request.type}
                                </dd>
                            </div>
                            {request.created_at && (
                                <div>
                                    <dt className="text-zinc-700 dark:text-zinc-200">
                                        Fecha de ingreso
                                    </dt>
                                    <dd className="font-semibold">
                                        {request.created_at.replace(' ', ' · ')}
                                    </dd>
                                </div>
                            )}
                        </dl>
                        {request.summary && (
                            <details className="grid">
                                <summary className="min-h-12 cursor-pointer py-3 font-semibold text-municipal-link">
                                    Ver lo que enviaste
                                </summary>
                                <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                                    {request.summary}
                                </p>
                            </details>
                        )}
                    </section>

                    <section
                        aria-labelledby="historial-tramite"
                        className="grid gap-4"
                    >
                        <h2
                            id="historial-tramite"
                            className="text-[22px] font-semibold"
                        >
                            Historial del trámite
                        </h2>
                        {request.timeline.length ? (
                            <ol className="grid gap-4">
                                {request.timeline.map((item) => {
                                    const event = item.status_code
                                        ? states[item.status_code]
                                        : null;
                                    const EventIcon = event?.icon ?? Clock3;
                                    return (
                                        <li
                                            key={item.id}
                                            className="flex min-w-0 items-start gap-3 border-b border-zinc-200 pb-4 last:border-b-0 dark:border-zinc-800"
                                        >
                                            <span
                                                className={`grid size-10 shrink-0 place-items-center rounded-md ${tones[event?.tone ?? 'neutral']}`}
                                            >
                                                <EventIcon
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-semibold">
                                                    {item.action ===
                                                    'documentation_received'
                                                        ? 'Documentación recibida'
                                                        : (event?.event ??
                                                          'Movimiento registrado')}
                                                </h3>
                                                {item.date && (
                                                    <p className="text-zinc-700 dark:text-zinc-200">
                                                        {item.date.replace(
                                                            ' ',
                                                            ' · ',
                                                        )}
                                                    </p>
                                                )}
                                                <p className="mt-1 [overflow-wrap:anywhere] whitespace-pre-wrap">
                                                    {item.id !==
                                                        request.response?.id &&
                                                    item.comment
                                                        ? item.comment
                                                        : item.action !==
                                                              'documentation_received' &&
                                                          event?.detail}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        ) : (
                            <p className="text-zinc-700 dark:text-zinc-200">
                                Todavía no hay movimientos registrados.
                            </p>
                        )}
                    </section>

                    <Link
                        href={index()}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-400 bg-white px-4 py-2 text-center font-semibold dark:border-zinc-600 dark:bg-zinc-900"
                    >
                        <ArrowLeft
                            aria-hidden="true"
                            className="size-5 shrink-0"
                        />{' '}
                        Volver a Mesa de Entrada
                    </Link>
                </div>
            </main>
        </>
    );
}

function DocumentationForm({
    code,
    requestId,
}: {
    code: string;
    requestId: number | null;
}) {
    const form = useForm({
        documentation_request_id: requestId,
        attachments: [] as File[],
    });
    const attachmentErrors = Object.entries(form.errors).filter(
        ([key]) => key === 'attachments' || key.startsWith('attachments.'),
    );

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(store.url(code), {
            forceFormData: true,
            preserveScroll: 'errors',
        });
    }

    return (
        <form
            onSubmit={submit}
            aria-labelledby="adjuntar-documentacion"
            className="grid min-w-0 gap-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
            <h2
                id="adjuntar-documentacion"
                className="text-[22px] font-semibold"
            >
                Adjuntar documentación
            </h2>
            <label htmlFor="documentos" className="font-semibold">
                Elegí los archivos que te pidieron
            </label>
            <p
                id="documentos-ayuda"
                className="text-zinc-700 dark:text-zinc-200"
            >
                Hasta 5 archivos de 10 MB cada uno. PDF, Word o imágenes JPG,
                PNG y WebP.
            </p>
            <input
                id="documentos"
                type="file"
                multiple
                required
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                aria-invalid={attachmentErrors.length > 0}
                aria-describedby={
                    attachmentErrors.length
                        ? 'documentos-ayuda documentos-errores'
                        : 'documentos-ayuda'
                }
                disabled={form.processing}
                onChange={(event) => {
                    form.clearErrors();
                    form.setData(
                        'attachments',
                        Array.from(event.currentTarget.files ?? []),
                    );
                }}
                className="block min-h-12 w-full min-w-0 rounded-lg border border-zinc-400 px-2 py-2 file:mr-2 file:rounded file:bg-zinc-100 file:px-2 file:py-1 file:font-semibold file:text-zinc-950 dark:border-zinc-600"
            />
            {form.data.attachments.length > 0 && (
                <ul
                    aria-label="Archivos seleccionados"
                    className="list-inside list-disc [overflow-wrap:anywhere]"
                >
                    {form.data.attachments.map((file, index) => (
                        <li key={`${file.name}:${index}`}>{file.name}</li>
                    ))}
                </ul>
            )}
            {attachmentErrors.length > 0 && (
                <ul
                    role="alert"
                    id="documentos-errores"
                    className="text-red-800 dark:text-red-200"
                >
                    {attachmentErrors.map(([key, error]) => (
                        <li key={key}>{error}</li>
                    ))}
                </ul>
            )}
            <button
                type="submit"
                disabled={form.processing || form.data.attachments.length === 0}
                className="min-h-12 rounded-lg bg-municipal-action px-4 py-2 font-semibold text-municipal-on-action hover:bg-municipal-action/90 disabled:opacity-60"
            >
                {form.processing
                    ? 'Enviando archivos…'
                    : 'Enviar documentación'}
            </button>
        </form>
    );
}
