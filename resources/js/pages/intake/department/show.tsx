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
        payload?: Record<string, string>;
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
    };
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
    value?: string | null;
    className?: string;
}) {
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
                {value || 'Sin dato'}
            </p>
        </div>
    );
}

function fieldLabel(derivation: Derivation, key: string) {
    return (
        derivation.request.type.schema?.find((field) => field.name === key)
            ?.label ?? key
    );
}

IntakeDepartmentShow.layout = {
    breadcrumbs: [{ title: 'Mis derivaciones', href: index() }],
};
