import { Head, Link, useForm } from '@inertiajs/react';
import { Download, GitBranch, Save, Tags } from 'lucide-react';
import { FormEvent } from 'react';
import { storeDerivations } from '@/actions/App/Http/Controllers/Admin/IntakeRequestController';
import {
    formatIntakeDate,
    intakeDerivationStatusClass,
    intakeStatusClass,
} from '@/lib/intake-labels';
import { index } from '@/routes/admin/intake';
import { update } from '@/routes/admin/intake/status';

type IntakeRequest = {
    id: number;
    public_code: string;
    status: string;
    status_label: string;
    priority: string;
    area?: string | null;
    applicant_name: string;
    applicant_dni?: string | null;
    applicant_phone: string;
    applicant_email?: string | null;
    applicant_address?: string | null;
    subject: string;
    summary: string;
    payload?: Record<string, string>;
    created_at: string;
    type: {
        name: string;
        category: string;
        color: string;
        schema?: { name: string; label: string }[];
    };
    assistance_types?: AssistanceType[];
    attachments: {
        id: number;
        original_name: string;
        url: string;
        type: string;
        created_at?: string | null;
    }[];
    derivations: Derivation[];
    histories: {
        id: number;
        action: string;
        from_status?: string | null;
        to_status?: string | null;
        public_comment?: string | null;
        internal_comment?: string | null;
        changed_at?: string | null;
        user?: { name: string } | null;
    }[];
};

type AssistanceType = {
    id: number;
    name: string;
    color: string;
    default_department?: Department | null;
};

type Department = {
    id: number;
    name: string;
    color: string;
};

type Derivation = {
    id: number;
    status: string;
    status_label: string;
    operator_note?: string | null;
    department_response?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    department: Department;
    assistance_type?: AssistanceType | null;
    last_updater?: { name: string } | null;
};

export default function AdminIntakeShow({
    request,
    statuses,
    assistanceTypes,
    departments,
}: {
    request: IntakeRequest;
    statuses: { value: string; label: string }[];
    assistanceTypes: AssistanceType[];
    departments: Department[];
}) {
    const status = useForm({
        status: request.status,
        area: request.area ?? '',
        public_comment: '',
        internal_comment: '',
    });
    const derivation = useForm({
        assistance_type_ids:
            request.assistance_types?.map((type) => type.id) ??
            ([] as number[]),
        department_ids: [] as number[],
        operator_note: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        status.patch(update.url(request.id));
    }

    function submitDerivation(event: FormEvent) {
        event.preventDefault();
        derivation.post(storeDerivations.url(request.id), {
            preserveScroll: true,
            onSuccess: () => derivation.setData('operator_note', ''),
        });
    }

    function toggleAssistanceType(id: number) {
        const selected = derivation.data.assistance_type_ids.includes(id)
            ? derivation.data.assistance_type_ids.filter((item) => item !== id)
            : [...derivation.data.assistance_type_ids, id];

        derivation.setData('assistance_type_ids', selected);
    }

    function toggleDepartment(id: number) {
        const selected = derivation.data.department_ids.includes(id)
            ? derivation.data.department_ids.filter((item) => item !== id)
            : [...derivation.data.department_ids, id];

        derivation.setData('department_ids', selected);
    }

    return (
        <>
            <Head title={request.public_code} />
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_380px]">
                <main className="flex flex-col gap-4">
                    <section className="rounded-lg border bg-card p-4">
                        <Link
                            href={index()}
                            className="text-sm font-medium text-blue-700 dark:text-blue-300"
                        >
                            Volver a Mesa de Entrada
                        </Link>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {request.public_code} ·{' '}
                                    {formatIntakeDate(request.created_at)}
                                </p>
                                <h1 className="text-2xl font-semibold tracking-normal">
                                    {request.subject}
                                </h1>
                            </div>
                            <span
                                className={`rounded-md border px-3 py-1 text-sm font-semibold ${intakeStatusClass(request.status)}`}
                            >
                                {request.status_label}
                            </span>
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Panel title="Vecino">
                            <Info
                                label="Nombre y apellido"
                                value={request.applicant_name}
                            />
                            <Info
                                label="Telefono"
                                value={request.applicant_phone}
                            />
                            {request.applicant_dni && (
                                <Info
                                    label="DNI / CUIT"
                                    value={request.applicant_dni}
                                />
                            )}
                            {request.applicant_email && (
                                <Info
                                    label="Email"
                                    value={request.applicant_email}
                                />
                            )}
                            {request.applicant_address && (
                                <Info
                                    label="Domicilio"
                                    value={request.applicant_address}
                                />
                            )}
                        </Panel>
                        <Panel title="Solicitud">
                            <Info
                                label="Categoria"
                                value={request.type.category}
                            />
                            <Info label="Tipo" value={request.type.name} />
                            <Info
                                label="Area"
                                value={request.area ?? 'Sin derivar'}
                            />
                            <p className="rounded-md bg-background p-3 text-sm">
                                {request.summary}
                            </p>
                        </Panel>
                    </section>

                    <Panel title="Datos cargados">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(request.payload ?? {}).map(
                                ([key, value]) => (
                                    <Info
                                        key={key}
                                        label={fieldLabel(request, key)}
                                        value={value}
                                    />
                                ),
                            )}
                            {Object.keys(request.payload ?? {}).length ===
                                0 && (
                                <p className="text-sm text-muted-foreground">
                                    No se cargaron datos adicionales.
                                </p>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Tipificacion y derivaciones">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-md border bg-background p-3">
                                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <Tags className="size-4" />
                                    Tipificaciones
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(request.assistance_types ?? []).map(
                                        (type) => (
                                            <span
                                                key={type.id}
                                                className="rounded-md border px-2 py-1 text-xs font-semibold"
                                                style={{ color: type.color }}
                                            >
                                                {type.name}
                                            </span>
                                        ),
                                    )}
                                    {(request.assistance_types ?? []).length ===
                                        0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Todavia no fue tipificada.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-md border bg-background p-3">
                                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <GitBranch className="size-4" />
                                    Derivaciones
                                </div>
                                <div className="grid gap-2">
                                    {request.derivations.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-md border p-2 text-sm"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <strong>
                                                        {item.department.name}
                                                    </strong>
                                                    <p className="text-muted-foreground">
                                                        {
                                                            item.assistance_type
                                                                ?.name
                                                        }
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${intakeDerivationStatusClass(item.status)}`}
                                                >
                                                    {item.status_label}
                                                </span>
                                            </div>
                                            {item.department_response && (
                                                <p className="mt-2 text-muted-foreground">
                                                    {item.department_response}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    {request.derivations.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Todavia no hay areas involucradas.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <Panel title="Adjuntos">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {request.attachments.map((attachment) => (
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
                            ))}
                            {request.attachments.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No hay adjuntos.
                                </p>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Historial">
                        <ol className="flex flex-col gap-3 border-l pl-4">
                            {request.histories.map((item) => (
                                <li key={item.id} className="text-sm">
                                    <strong>
                                        {formatIntakeDate(item.changed_at)}
                                    </strong>
                                    <p className="text-muted-foreground">
                                        {historyActionLabel(item.action)} ·{' '}
                                        {statusLabel(statuses, item.to_status)}
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
                        </ol>
                    </Panel>
                </main>

                <aside className="flex flex-col gap-4">
                    <form
                        onSubmit={submitDerivation}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <h2 className="text-lg font-semibold">
                            Tipificar y derivar
                        </h2>
                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-medium">
                                Tipo de asistencia
                            </legend>
                            {assistanceTypes.map((type) => (
                                <label
                                    key={type.id}
                                    className="flex items-start gap-2 rounded-md border bg-background p-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={derivation.data.assistance_type_ids.includes(
                                            type.id,
                                        )}
                                        onChange={() =>
                                            toggleAssistanceType(type.id)
                                        }
                                    />
                                    <span>
                                        <span
                                            className="font-semibold"
                                            style={{ color: type.color }}
                                        >
                                            {type.name}
                                        </span>
                                        {type.default_department && (
                                            <span className="block text-xs text-muted-foreground">
                                                Deriva a:{' '}
                                                {type.default_department.name}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                            {derivation.errors.assistance_type_ids && (
                                <span className="text-xs text-red-600">
                                    {derivation.errors.assistance_type_ids}
                                </span>
                            )}
                        </fieldset>
                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-medium">
                                Areas adicionales
                            </legend>
                            {departments.map((department) => (
                                <label
                                    key={department.id}
                                    className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={derivation.data.department_ids.includes(
                                            department.id,
                                        )}
                                        onChange={() =>
                                            toggleDepartment(department.id)
                                        }
                                    />
                                    <span style={{ color: department.color }}>
                                        {department.name}
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Nota para las areas
                            <textarea
                                className="input min-h-24"
                                value={derivation.data.operator_note}
                                onChange={(event) =>
                                    derivation.setData(
                                        'operator_note',
                                        event.target.value,
                                    )
                                }
                                placeholder="Indicaciones internas para los encargados."
                            />
                        </label>
                        <button
                            disabled={derivation.processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-violet-700 px-4 font-semibold text-white disabled:opacity-60"
                        >
                            <GitBranch className="size-4" /> Guardar
                            derivaciones
                        </button>
                    </form>

                    <form
                        onSubmit={submit}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                    >
                        <h2 className="text-lg font-semibold">
                            Gestion interna
                        </h2>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Estado
                            <select
                                className="input"
                                value={status.data.status}
                                onChange={(event) =>
                                    status.setData('status', event.target.value)
                                }
                            >
                                {statuses.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            {status.errors.status && (
                                <span className="text-xs text-red-600">
                                    {status.errors.status}
                                </span>
                            )}
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Area / sector
                            <input
                                className="input"
                                value={status.data.area}
                                onChange={(event) =>
                                    status.setData('area', event.target.value)
                                }
                                placeholder="Ej: Obras Publicas"
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Mensaje visible para el vecino
                            <textarea
                                className="input min-h-28"
                                value={status.data.public_comment}
                                onChange={(event) =>
                                    status.setData(
                                        'public_comment',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Nota interna
                            <textarea
                                className="input min-h-28"
                                value={status.data.internal_comment}
                                onChange={(event) =>
                                    status.setData(
                                        'internal_comment',
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                        <button
                            disabled={status.processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
                        >
                            <Save className="size-4" /> Guardar estado
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

function Info({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                {label}
            </p>
            <p className="text-sm">{value || 'Sin dato'}</p>
        </div>
    );
}

function fieldLabel(request: IntakeRequest, key: string) {
    return (
        request.type.schema?.find((field) => field.name === key)?.label ?? key
    );
}

function statusLabel(
    statuses: { value: string; label: string }[],
    value?: string | null,
) {
    return statuses.find((item) => item.value === value)?.label ?? 'Sin estado';
}

function historyActionLabel(action: string) {
    if (action === 'created') {
        return 'Creacion';
    }

    if (action === 'status_changed') {
        return 'Cambio de estado';
    }

    return action;
}

AdminIntakeShow.layout = {
    breadcrumbs: [{ title: 'Mesa de Entrada', href: index() }],
};
