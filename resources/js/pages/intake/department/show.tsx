import { Head, Link, useForm } from '@inertiajs/react';
import { Download, Save } from 'lucide-react';
import { FormEvent } from 'react';
import {
    formatIntakeDate,
    intakeDerivationStatusClass,
    intakeStatusClass,
} from '@/lib/intake-labels';
import { index, update } from '@/routes/intake/department';

type Derivation = {
    id: number;
    status: string;
    status_label: string;
    operator_note?: string | null;
    department_response?: string | null;
    department: { name: string; color: string };
    assistance_type?: { name: string; color: string } | null;
    histories: DerivationHistory[];
    request: {
        public_code: string;
        status: string;
        status_label: string;
        subject: string;
        summary: string;
        applicant_name: string;
        applicant_dni?: string | null;
        applicant_phone: string;
        applicant_email?: string | null;
        applicant_address?: string | null;
        payload?: Record<string, unknown>;
        created_at: string;
        type: {
            name: string;
            category: string;
            schema?: { name: string; label: string }[];
        };
        attachments: {
            id: number;
            original_name: string;
            url: string;
        }[];
        histories: {
            id: number;
            action: string;
            from_status?: string | null;
            to_status?: string | null;
            status_label?: string | null;
            public_comment?: string | null;
            internal_comment?: string | null;
            changed_at?: string | null;
            user?: { name: string } | null;
        }[];
    };
};

type DerivationHistory = {
    id: number;
    action: string;
    from_status?: string | null;
    to_status?: string | null;
    from_status_label?: string | null;
    to_status_label?: string | null;
    previous_response?: string | null;
    new_response?: string | null;
    changed_at?: string | null;
    user?: { name: string } | null;
};

export default function IntakeDepartmentShow({
    derivation,
    statuses,
}: {
    derivation: Derivation;
    statuses: { value: string; label: string }[];
}) {
    const form = useForm({
        status: derivation.status,
        department_response: derivation.department_response ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.patch(update.url(derivation.id));
    }

    return (
        <>
            <Head title={derivation.request.public_code} />
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
                <main className="flex flex-col gap-4">
                    <section className="rounded-lg border bg-card p-4">
                        <Link
                            href={index()}
                            className="text-sm font-medium text-blue-700 dark:text-blue-300"
                        >
                            Volver a mis derivaciones
                        </Link>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {derivation.request.public_code} ·{' '}
                                    {formatIntakeDate(
                                        derivation.request.created_at,
                                    )}
                                </p>
                                <h1 className="text-2xl font-semibold tracking-normal">
                                    {derivation.request.subject}
                                </h1>
                            </div>
                            <span
                                className={`w-fit rounded-md border px-3 py-1 text-sm font-semibold ${intakeDerivationStatusClass(derivation.status)}`}
                            >
                                {derivation.status_label}
                            </span>
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Panel title="Solicitud">
                            <Info
                                label="Estado general"
                                value={derivation.request.status_label}
                                className={intakeStatusClass(
                                    derivation.request.status,
                                )}
                            />
                            <Info
                                label="Tipo"
                                value={derivation.request.type.name}
                            />
                            <p className="rounded-md bg-background p-3 text-sm">
                                {derivation.request.summary}
                            </p>
                        </Panel>
                        <Panel title="Vecino / institucion">
                            <Info
                                label="Nombre"
                                value={derivation.request.applicant_name}
                            />
                            <Info
                                label="Telefono"
                                value={derivation.request.applicant_phone}
                            />
                            {derivation.request.applicant_email && (
                                <Info
                                    label="Email"
                                    value={derivation.request.applicant_email}
                                />
                            )}
                            {derivation.request.applicant_address && (
                                <Info
                                    label="Domicilio"
                                    value={derivation.request.applicant_address}
                                />
                            )}
                        </Panel>
                    </section>

                    <Panel title="Datos cargados">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(
                                derivation.request.payload ?? {},
                            ).map(([key, value]) => (
                                <Info
                                    key={key}
                                    label={fieldLabel(derivation, key)}
                                    value={value}
                                />
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Documentacion adjunta">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {derivation.request.attachments.map(
                                (attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 rounded-md border bg-background p-3 text-sm hover:bg-muted/60"
                                    >
                                        <Download className="size-4 shrink-0" />
                                        <span className="min-w-0 flex-1 truncate">
                                            {attachment.original_name}
                                        </span>
                                    </a>
                                ),
                            )}
                            {derivation.request.attachments.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No hay adjuntos.
                                </p>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Historial">
                        <ol className="flex flex-col gap-3 border-l pl-4">
                            {derivation.request.histories.map((item) => (
                                <li key={item.id} className="text-sm">
                                    <strong>
                                        {formatIntakeDate(item.changed_at)}
                                    </strong>
                                    <p className="text-muted-foreground">
                                        {historyActionLabel(item.action)}
                                        {item.status_label
                                            ? ` · ${item.status_label}`
                                            : ''}
                                        {item.user?.name
                                            ? ` · ${item.user.name}`
                                            : ''}
                                    </p>
                                    {item.public_comment && (
                                        <p>{item.public_comment}</p>
                                    )}
                                    {item.internal_comment && (
                                        <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                                            {item.internal_comment}
                                        </p>
                                    )}
                                </li>
                            ))}
                            {derivation.request.histories.length === 0 && (
                                <li className="text-sm text-muted-foreground">
                                    No hay movimientos registrados.
                                </li>
                            )}
                        </ol>
                    </Panel>
                </main>

                <aside className="flex flex-col gap-4">
                    <form
                        onSubmit={submit}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <h2 className="text-lg font-semibold">
                            Respuesta del area
                        </h2>
                        <Info label="Area" value={derivation.department.name} />
                        <Info
                            label="Prestacion"
                            value={derivation.assistance_type?.name}
                        />
                        {derivation.operator_note && (
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
                                <p className="text-xs font-semibold uppercase">
                                    Nota de Mesa de Entrada
                                </p>
                                <p className="mt-1">
                                    {derivation.operator_note}
                                </p>
                            </div>
                        )}
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Estado de mi derivacion
                            <select
                                className="input"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData('status', event.target.value)
                                }
                            >
                                {statuses.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Observacion interna del area
                            <textarea
                                className="input min-h-32"
                                value={form.data.department_response}
                                onChange={(event) =>
                                    form.setData(
                                        'department_response',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                        <button
                            disabled={form.processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
                        >
                            <Save className="size-4" /> Guardar respuesta
                        </button>
                    </form>

                    <Panel title="Historial de mi respuesta">
                        <ol className="flex flex-col gap-3 border-l pl-4">
                            {derivation.histories.map((item) => (
                                <li key={item.id} className="text-sm">
                                    <strong>
                                        {formatIntakeDate(item.changed_at)}
                                    </strong>
                                    <p className="text-muted-foreground">
                                        {derivationHistoryActionLabel(
                                            item.action,
                                        )}
                                        {item.to_status_label
                                            ? ` · ${item.to_status_label}`
                                            : ''}
                                        {item.user?.name
                                            ? ` · ${item.user.name}`
                                            : ''}
                                    </p>
                                    {item.new_response && (
                                        <p className="mt-1 rounded-md bg-background p-2">
                                            {item.new_response}
                                        </p>
                                    )}
                                </li>
                            ))}
                            {derivation.histories.length === 0 && (
                                <li className="text-sm text-muted-foreground">
                                    No hay cambios registrados en esta
                                    respuesta.
                                </li>
                            )}
                        </ol>
                    </Panel>
                </aside>
            </div>
        </>
    );
}

function Panel({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold">{title}</h2>
            <div className="flex flex-col gap-3">{children}</div>
        </section>
    );
}

function Info({
    label,
    value,
    className,
}: {
    label: string;
    value?: unknown;
    className?: string;
}) {
    const displayValue = displayPayloadValue(value);

    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                {label}
            </p>
            <p
                className={
                    className
                        ? `w-fit rounded-md border px-2 py-1 text-sm font-semibold ${className}`
                        : 'text-sm'
                }
            >
                {displayValue || 'Sin dato'}
            </p>
        </div>
    );
}

function fieldLabel(derivation: Derivation, key: string) {
    if (key === 'subtype') {
        return 'Tramite especifico';
    }

    return (
        derivation.request.type.schema?.find((field) => field.name === key)
            ?.label ?? key
    );
}

function displayPayloadValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
    }

    if (Array.isArray(value)) {
        return value.map(displayPayloadValue).filter(Boolean).join(', ');
    }

    if (typeof value === 'object') {
        const objectValue = value as { name?: unknown; label?: unknown };

        if (typeof objectValue.name === 'string') {
            return objectValue.name;
        }

        if (typeof objectValue.label === 'string') {
            return objectValue.label;
        }

        return JSON.stringify(value);
    }

    return String(value);
}

function historyActionLabel(action: string) {
    if (action === 'created') {
        return 'Creacion';
    }

    if (action === 'status_changed') {
        return 'Cambio de estado';
    }

    if (action === 'derived') {
        return 'Derivacion';
    }

    return action;
}

function derivationHistoryActionLabel(action: string) {
    if (action === 'area_response_updated') {
        return 'Respuesta actualizada';
    }

    return action;
}

IntakeDepartmentShow.layout = {
    breadcrumbs: [{ title: 'Mis derivaciones', href: index() }],
};
