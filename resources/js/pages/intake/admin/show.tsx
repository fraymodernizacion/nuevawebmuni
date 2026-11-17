import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    Clipboard,
    Download,
    Eye,
    FileCheck,
    FileIcon,
    FileImage,
    FileQuestion,
    FileText,
    GitBranch,
    History,
    Inbox,
    MessageSquare,
    PencilLine,
    Settings2,
    Tags,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { storeDerivations } from '@/actions/App/Http/Controllers/Admin/IntakeRequestController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useClipboard } from '@/hooks/use-clipboard';
import {
    formatIntakeDate,
    intakeDerivationStatusClass,
    intakeStatusClass,
} from '@/lib/intake-labels';
import { cn } from '@/lib/utils';
import { index, notifications } from '@/routes/admin/intake';
import StatusUpdateDialog from './status-update-dialog';

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
    payload?: Record<string, unknown>;
    subtype?: { schema?: { name: string; label: string }[] } | null;
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
    histories: DerivationHistory[];
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

const tabs = [
    { id: 'solicitud', label: 'Solicitud', icon: FileText },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'gestion', label: 'Gestión', icon: Settings2 },
] as const;

type TabId = (typeof tabs)[number]['id'];
type StatusOption = { value: string; label: string };

export default function AdminIntakeShow({
    request,
    statuses,
    assistanceTypes,
    departments,
    suggestedAssistanceIds,
    emailNotificationsEnabled,
}: {
    request: IntakeRequest;
    statuses: StatusOption[];
    assistanceTypes: AssistanceType[];
    departments: Department[];
    suggestedAssistanceIds: number[];
    emailNotificationsEnabled: boolean;
}) {
    const [tab, setTab] = useState<TabId>('solicitud');
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusSaved, setStatusSaved] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);
    const headerStatusButton = useRef<HTMLButtonElement>(null);
    const statusOpener = useRef<HTMLButtonElement>(null);
    const derivation = useForm({
        assistance_type_ids: request.assistance_types?.length
            ? request.assistance_types.map((type) => type.id)
            : suggestedAssistanceIds,
        department_ids: [] as number[],
        operator_note: '',
    });
    const [copiedText, copyToClipboard] = useClipboard();
    const whatsAppSummary = buildWhatsAppSummary(request);
    const copied = copiedText === whatsAppSummary;
    const busy = derivation.processing;
    const assignedAreas = [
        ...new Set(request.derivations.map((item) => item.department.name)),
    ];
    const suggestedAreas = [
        ...new Set(
            assistanceTypes.flatMap((type) =>
                suggestedAssistanceIds.includes(type.id) &&
                type.default_department
                    ? [type.default_department.name]
                    : [],
            ),
        ),
    ];
    const selectedTypes = [
        ...new Map(
            [...(request.assistance_types ?? []), ...assistanceTypes].map(
                (type) => [type.id, type],
            ),
        ).values(),
    ].filter((type) => derivation.data.assistance_type_ids.includes(type.id));
    const targetAreas = [
        ...new Set([
            ...selectedTypes.flatMap((type) =>
                type.default_department ? [type.default_department.name] : [],
            ),
            ...departments
                .filter((area) =>
                    derivation.data.department_ids.includes(area.id),
                )
                .map((area) => area.name),
        ]),
    ];

    function openManagement() {
        setTab('gestion');
        requestAnimationFrame(() =>
            document.getElementById('tipificar')?.focus(),
        );
    }

    function openStatus(button: HTMLButtonElement) {
        statusOpener.current = button;
        setStatusSaved(false);
        setStatusOpen(true);
    }

    function closeStatus(saved = false) {
        setStatusOpen(false);
        if (saved) {
            setStatusSaved(true);
            setTab('historial');
        }
        requestAnimationFrame(() => {
            const button = saved
                ? headerStatusButton.current
                : statusOpener.current;
            button?.focus();
        });
    }

    function handleTabKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        position: number,
    ) {
        const keys: Record<string, number> = {
            ArrowLeft: (position + tabs.length - 1) % tabs.length,
            ArrowRight: (position + 1) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
        };
        const nextTab = tabs[keys[event.key]];

        if (nextTab) {
            event.preventDefault();
            setTab(nextTab.id);
            document.getElementById('tab-' + nextTab.id)?.focus();
        }
    }

    function submitDerivation(event: FormEvent) {
        event.preventDefault();
        if (!derivation.data.assistance_type_ids.length) {
            derivation.setError(
                'assistance_type_ids',
                'Seleccioná al menos una tipificación.',
            );
            return;
        }

        derivation.post(storeDerivations.url(request.id), {
            preserveScroll: true,
            onSuccess: () => {
                derivation.setData('operator_note', '');
                setStatusSaved(false);
            },
        });
    }

    return (
        <>
            <Head title={request.public_code} />
            <div className="min-w-0 flex-1 bg-municipal-surface">
                <div className="mx-auto grid max-w-7xl min-w-0 gap-4 p-3 sm:gap-5 sm:p-6">
                    <header className="grid gap-4 rounded-xl border border-t-4 border-municipal-outline border-t-municipal-lime bg-card p-4 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Button
                                asChild
                                variant="ghost"
                                className="min-h-11 px-2"
                            >
                                <Link href={index()}>
                                    <ArrowLeft aria-hidden="true" /> Volver a
                                    Mesa de Entrada
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11"
                                onClick={async () =>
                                    setCopyFailed(
                                        !(await copyToClipboard(
                                            whatsAppSummary,
                                        )),
                                    )
                                }
                            >
                                {copied ? (
                                    <Check aria-hidden="true" />
                                ) : (
                                    <Clipboard aria-hidden="true" />
                                )}
                                {copied
                                    ? 'Resumen copiado'
                                    : 'Copiar para WhatsApp'}
                            </Button>
                            <p
                                role="status"
                                className={
                                    copyFailed
                                        ? 'w-full text-sm text-destructive'
                                        : 'sr-only'
                                }
                            >
                                {copyFailed
                                    ? 'No se pudo copiar el resumen. Intentá nuevamente.'
                                    : copied
                                      ? 'Resumen copiado al portapapeles.'
                                      : ''}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <p className="font-mono text-sm font-semibold text-municipal-link">
                                    {request.public_code}
                                </p>
                                <span
                                    className={cn(
                                        'rounded-md border px-2.5 py-1 text-sm font-semibold',
                                        intakeStatusClass(request.status),
                                    )}
                                >
                                    {request.status_label}
                                </span>
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                                {request.subject}
                            </h1>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2">
                                    <CalendarDays
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />{' '}
                                    Ingreso:{' '}
                                    {formatIntakeDate(request.created_at)}
                                </p>
                                <p className="flex items-start gap-2">
                                    <GitBranch
                                        aria-hidden="true"
                                        className="mt-0.5 size-4 shrink-0"
                                    />{' '}
                                    {assignedAreas.length
                                        ? 'Derivado a: ' +
                                          assignedAreas.join(' · ')
                                        : 'Sin derivaciones registradas'}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:flex sm:flex-wrap">
                            <Button
                                type="button"
                                className="min-h-11 bg-municipal-action text-municipal-on-action hover:bg-municipal-action/90"
                                ref={headerStatusButton}
                                disabled={busy}
                                onClick={(event) =>
                                    openStatus(event.currentTarget)
                                }
                            >
                                <PencilLine aria-hidden="true" /> Cambiar estado
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="min-h-11"
                                onClick={openManagement}
                            >
                                <Tags aria-hidden="true" /> Tipificar y derivar
                            </Button>
                        </div>
                    </header>

                    <p
                        role="status"
                        className={
                            statusSaved
                                ? 'rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                                : 'sr-only'
                        }
                    >
                        {statusSaved
                            ? 'Estado actualizado. El movimiento se registró en el historial.'
                            : ''}
                    </p>

                    <div
                        role="tablist"
                        aria-label="Detalle del trámite"
                        className="grid grid-cols-3 gap-1 border-b"
                    >
                        {tabs.map(({ id, label, icon: Icon }, position) => (
                            <Button
                                key={id}
                                type="button"
                                id={'tab-' + id}
                                role="tab"
                                aria-selected={tab === id}
                                aria-controls={'panel-' + id}
                                tabIndex={tab === id ? 0 : -1}
                                variant="ghost"
                                className="min-h-11 min-w-0 rounded-b-none border-b-2 border-transparent px-1 aria-selected:border-municipal-link aria-selected:bg-card aria-selected:text-municipal-link"
                                onKeyDown={(event) =>
                                    handleTabKeyDown(event, position)
                                }
                                onClick={() => setTab(id)}
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="hidden size-4 sm:block"
                                />{' '}
                                {label}
                            </Button>
                        ))}
                    </div>

                    <div
                        id="panel-solicitud"
                        role="tabpanel"
                        aria-labelledby="tab-solicitud"
                        tabIndex={0}
                        hidden={tab !== 'solicitud'}
                    >
                        <div className="grid gap-4">
                            <div className="grid items-start gap-4 lg:grid-cols-2">
                                <Panel title="Datos del vecino">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Info
                                            label="Nombre y apellido"
                                            value={request.applicant_name}
                                        />
                                        <Info
                                            label="Teléfono"
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
                                                label="Correo electrónico"
                                                value={request.applicant_email}
                                            />
                                        )}
                                        {request.applicant_address && (
                                            <Info
                                                label="Domicilio"
                                                value={
                                                    request.applicant_address
                                                }
                                            />
                                        )}
                                    </div>
                                </Panel>
                                <Panel title="Datos de la solicitud">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Info
                                            label="Categoría"
                                            value={request.type.category}
                                        />
                                        <Info
                                            label="Tipo de trámite"
                                            value={request.type.name}
                                        />
                                        {request.area && (
                                            <Info
                                                label="Área / sector"
                                                value={request.area}
                                            />
                                        )}
                                    </div>
                                    <Info
                                        label="Descripción original"
                                        value={request.summary}
                                    />
                                </Panel>
                            </div>
                            <Panel title="Campos del formulario">
                                {Object.keys(request.payload ?? {}).length ? (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {Object.entries(
                                            request.payload ?? {},
                                        ).map(([key, value]) => (
                                            <Info
                                                key={key}
                                                label={fieldLabel(request, key)}
                                                value={value}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No hay datos adicionales.
                                    </p>
                                )}
                            </Panel>
                            <Panel title="Adjuntos">
                                <Attachments items={request.attachments} />
                            </Panel>
                        </div>
                    </div>

                    <div
                        id="panel-historial"
                        role="tabpanel"
                        aria-labelledby="tab-historial"
                        tabIndex={0}
                        hidden={tab !== 'historial'}
                    >
                        <div className="grid gap-4">
                            <Panel title="Historial del trámite">
                                <RequestHistory
                                    items={request.histories}
                                    statuses={statuses}
                                />
                            </Panel>
                            {request.derivations.length > 0 && (
                                <Panel title="Historial por área">
                                    <AreaDerivations
                                        derivations={request.derivations}
                                    />
                                    {request.derivations.some(
                                        (item) => item.histories.length > 0,
                                    ) && (
                                        <Link
                                            href={notifications()}
                                            className="w-fit text-sm font-medium text-municipal-link underline underline-offset-4"
                                        >
                                            Ver notificaciones de las áreas
                                        </Link>
                                    )}
                                </Panel>
                            )}
                        </div>
                    </div>

                    <div
                        id="panel-gestion"
                        role="tabpanel"
                        aria-labelledby="tab-gestion"
                        tabIndex={0}
                        hidden={tab !== 'gestion'}
                    >
                        <div className="grid items-start gap-4 xl:grid-cols-2">
                            <form
                                onSubmit={submitDerivation}
                                className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-5"
                                aria-labelledby="tipificar"
                            >
                                <h2
                                    id="tipificar"
                                    tabIndex={-1}
                                    className="scroll-mt-4 text-lg font-semibold"
                                >
                                    Tipificar y derivar
                                </h2>
                                {suggestedAreas.length > 0 && (
                                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                                        <strong>Área sugerida</strong> ·{' '}
                                        {suggestedAreas.join(' · ')}
                                    </p>
                                )}
                                <div className="grid gap-3">
                                    <OptionPicker
                                        title="Tipificaciones"
                                        searchLabel="Buscar tipificación por nombre o área"
                                        options={assistanceTypes.map(
                                            (type) => ({
                                                id: type.id,
                                                name: type.name,
                                                area: type.default_department
                                                    ?.name,
                                            }),
                                        )}
                                        selectedOptions={selectedTypes}
                                        onToggle={(id) => {
                                            derivation.clearErrors(
                                                'assistance_type_ids',
                                            );
                                            derivation.setData(
                                                'assistance_type_ids',
                                                toggleId(
                                                    derivation.data
                                                        .assistance_type_ids,
                                                    id,
                                                ),
                                            );
                                        }}
                                    />
                                    <OptionPicker
                                        title="Áreas adicionales"
                                        searchLabel="Buscar área adicional"
                                        options={departments}
                                        selectedOptions={departments.filter(
                                            (area) =>
                                                derivation.data.department_ids.includes(
                                                    area.id,
                                                ),
                                        )}
                                        onToggle={(id) =>
                                            derivation.setData(
                                                'department_ids',
                                                toggleId(
                                                    derivation.data
                                                        .department_ids,
                                                    id,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div
                                    className="grid gap-1 border-y py-3 text-sm"
                                    aria-live="polite"
                                >
                                    <strong>
                                        Áreas seleccionadas para derivar
                                    </strong>
                                    <p className="text-muted-foreground">
                                        {targetAreas.join(' · ') ||
                                            'Todavía no hay áreas seleccionadas.'}
                                    </p>
                                    <strong className="mt-1">
                                        Derivaciones registradas
                                    </strong>
                                    <p className="text-muted-foreground">
                                        {assignedAreas.join(' · ') ||
                                            'Todavía no hay derivaciones.'}
                                    </p>
                                    {(request.assistance_types?.length ?? 0) >
                                        0 && (
                                        <p className="text-muted-foreground">
                                            Tipificaciones guardadas:{' '}
                                            {request.assistance_types
                                                ?.map((type) => type.name)
                                                .join(' · ')}
                                        </p>
                                    )}
                                </div>
                                <label className="grid gap-1.5 text-sm font-medium">
                                    Nota para las áreas
                                    <textarea
                                        className="input min-h-20 w-full"
                                        value={derivation.data.operator_note}
                                        onChange={(event) =>
                                            derivation.setData(
                                                'operator_note',
                                                event.target.value,
                                            )
                                        }
                                        maxLength={5000}
                                    />
                                </label>
                                <FormFeedback
                                    errors={derivation.errors}
                                    success={
                                        derivation.recentlySuccessful
                                            ? 'Derivaciones guardadas.'
                                            : ''
                                    }
                                />
                                <Button
                                    disabled={busy}
                                    type="submit"
                                    className="min-h-11 bg-municipal-action text-municipal-on-action hover:bg-municipal-action/90"
                                >
                                    <GitBranch aria-hidden="true" />{' '}
                                    {derivation.processing
                                        ? 'Guardando…'
                                        : 'Guardar derivaciones'}
                                </Button>
                            </form>

                            <Panel title="Estado del trámite">
                                <p className="text-sm text-muted-foreground">
                                    Actualizá el estado o registrá una
                                    comunicación para el vecino.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11 w-fit"
                                    disabled={busy}
                                    onClick={(event) =>
                                        openStatus(event.currentTarget)
                                    }
                                >
                                    <PencilLine aria-hidden="true" /> Cambiar
                                    estado
                                </Button>
                            </Panel>
                        </div>
                    </div>
                </div>
            </div>

            {statusOpen && (
                <StatusUpdateDialog
                    key={request.id}
                    request={request}
                    statuses={statuses}
                    emailNotificationsEnabled={emailNotificationsEnabled}
                    onClose={() => closeStatus()}
                    onSaved={() => closeStatus(true)}
                />
            )}
        </>
    );
}

function toggleId(ids: number[], id: number) {
    return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function normalizeSearch(text: string) {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

function OptionPicker({
    title,
    searchLabel,
    options,
    selectedOptions,
    onToggle,
}: {
    title: string;
    searchLabel: string;
    options: { id: number; name: string; area?: string }[];
    selectedOptions: { id: number; name: string }[];
    onToggle: (id: number) => void;
}) {
    const [query, setQuery] = useState('');
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
    const matching = options.filter((option) => {
        const searchable = normalizeSearch(
            option.name + ' ' + (option.area ?? ''),
        );
        return words.every((word) => searchable.includes(word));
    });

    return (
        <fieldset className="grid min-w-0 gap-2 rounded-lg border p-3">
            <legend className="px-1 text-sm font-semibold">{title}</legend>
            {selectedOptions.length > 0 && (
                <ul
                    aria-label={title + ' seleccionadas'}
                    className="flex flex-wrap gap-1.5"
                >
                    {selectedOptions.map((option) => (
                        <li key={option.id} className="max-w-full">
                            <Button
                                type="button"
                                variant="secondary"
                                className="min-h-10 max-w-full whitespace-normal"
                                aria-label={'Quitar ' + option.name}
                                onClick={() => onToggle(option.id)}
                            >
                                {option.name} <X aria-hidden="true" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            <label className="grid gap-1 text-sm">
                {searchLabel}
                <input
                    className="input min-h-11 w-full"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </label>
            <p role="status" className="text-xs text-muted-foreground">
                {matching.length}{' '}
                {matching.length === 1 ? 'opción' : 'opciones'}
            </p>
            {matching.length > 0 && (
                <div className="max-h-36 overflow-auto rounded-md border bg-background">
                    {matching.map((option) => (
                        <label
                            key={option.id}
                            className="flex min-h-10 items-start gap-2 border-b px-2.5 py-2 text-sm last:border-0 hover:bg-muted/50"
                        >
                            <input
                                type="checkbox"
                                className="mt-1 size-4 shrink-0 accent-municipal-action"
                                checked={selectedOptions.some(
                                    (item) => item.id === option.id,
                                )}
                                onChange={() => onToggle(option.id)}
                            />
                            <span className="min-w-0 break-words">
                                {option.name}
                                {option.area && (
                                    <span className="block text-xs text-muted-foreground">
                                        {option.area}
                                    </span>
                                )}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </fieldset>
    );
}

function FormFeedback({
    errors,
    success,
}: {
    errors: Record<string, string>;
    success: string;
}) {
    const messages = [
        ...new Set(
            Object.values(errors).map((message) =>
                message.startsWith('validation.')
                    ? 'Revisá los datos del formulario e intentá de nuevo.'
                    : message,
            ),
        ),
    ];

    if (messages.length) {
        return (
            <ul role="alert" className="grid gap-1 text-sm text-destructive">
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        );
    }

    return (
        <p
            role="status"
            className={
                success
                    ? 'text-sm font-medium text-emerald-800 dark:text-emerald-300'
                    : 'sr-only'
            }
        >
            {success}
        </p>
    );
}

function latestFirst<T extends { id: number; changed_at?: string | null }>(
    items: T[],
) {
    return [...items].sort((a, b) => {
        const dateDifference =
            (b.changed_at ? Date.parse(b.changed_at) : 0) -
            (a.changed_at ? Date.parse(a.changed_at) : 0);
        return dateDifference || b.id - a.id;
    });
}

function RequestHistory({
    items,
    statuses,
}: {
    items: IntakeRequest['histories'];
    statuses: StatusOption[];
}) {
    if (!items.length) {
        return (
            <p className="text-sm text-muted-foreground">
                Todavía no hay movimientos.
            </p>
        );
    }

    return (
        <ol className="grid gap-4">
            {latestFirst(items).map((item) => {
                const Icon = historyIcon(item);
                return (
                    <li
                        key={item.id}
                        className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b pb-4 last:border-0 last:pb-0"
                    >
                        <span
                            className={cn(
                                'grid size-9 place-items-center rounded-lg border',
                                intakeStatusClass(item.to_status ?? ''),
                            )}
                        >
                            <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <div className="grid gap-2 text-sm">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <h3 className="text-base font-semibold">
                                    {historyActionLabel(
                                        item.action,
                                        item.to_status,
                                        Boolean(item.public_comment),
                                    )}
                                </h3>
                                <p className="text-muted-foreground">
                                    {formatIntakeDate(item.changed_at)}
                                    {item.user && ' · ' + item.user.name}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {item.from_status &&
                                    item.from_status !== item.to_status && (
                                        <>
                                            <span className="text-muted-foreground">
                                                {statusLabel(
                                                    statuses,
                                                    item.from_status,
                                                )}
                                            </span>
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="size-3.5 text-muted-foreground"
                                            />
                                        </>
                                    )}
                                {item.to_status && (
                                    <span
                                        className={cn(
                                            'rounded border px-1.5 py-0.5 font-medium',
                                            intakeStatusClass(item.to_status),
                                        )}
                                    >
                                        {statusLabel(statuses, item.to_status)}
                                    </span>
                                )}
                            </div>
                            {item.public_comment && (
                                <div className="grid gap-1 rounded-lg border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-950 dark:bg-blue-950/30">
                                    <strong className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                                        Visible para el vecino
                                    </strong>
                                    <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                                        {item.public_comment}
                                    </p>
                                </div>
                            )}
                            {item.internal_comment && (
                                <div className="grid gap-1 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-950 dark:bg-amber-950/30">
                                    <strong className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                        Nota interna
                                    </strong>
                                    <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                                        {item.internal_comment}
                                    </p>
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function historyIcon(item: IntakeRequest['histories'][number]) {
    if (item.action === 'created') return Inbox;
    if (item.action === 'derived') return GitBranch;
    if (item.action === 'documentation_received') return FileCheck;
    if (item.to_status === 'needs_documentation') return FileQuestion;
    if (item.public_comment) return MessageSquare;
    return History;
}

function AreaDerivations({ derivations }: { derivations: Derivation[] }) {
    return (
        <div className="grid gap-3">
            {derivations.map((item) => (
                <section
                    key={item.id}
                    className="grid min-w-0 gap-2 rounded-lg border p-3 text-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">
                            {item.department.name}
                        </h3>
                        <span
                            className={cn(
                                'rounded-md border px-2 py-1 text-xs font-semibold',
                                intakeDerivationStatusClass(item.status),
                            )}
                        >
                            {item.status_label}
                        </span>
                    </div>
                    {item.assistance_type && (
                        <Info
                            label="Tipificación"
                            value={item.assistance_type.name}
                        />
                    )}
                    {item.operator_note && (
                        <Info
                            label="Nota para el área"
                            value={item.operator_note}
                        />
                    )}
                    {item.department_response && (
                        <Info
                            label="Última respuesta del área"
                            value={item.department_response}
                        />
                    )}
                    {item.histories.length > 0 && (
                        <details>
                            <summary className="w-fit cursor-pointer py-2 font-medium">
                                Movimientos del área ({item.histories.length})
                            </summary>
                            <ol className="grid gap-3 border-s ps-3">
                                {latestFirst(item.histories).map((history) => (
                                    <li key={history.id} className="grid gap-1">
                                        <p className="font-medium">
                                            {derivationHistoryActionLabel(
                                                history.action,
                                            )}
                                            {history.to_status_label &&
                                                ' · ' + history.to_status_label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatIntakeDate(
                                                history.changed_at,
                                            )}
                                            {history.user &&
                                                ' · ' + history.user.name}
                                        </p>
                                        {history.new_response && (
                                            <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                                                {history.new_response}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </details>
                    )}
                </section>
            ))}
        </div>
    );
}

type Attachment = IntakeRequest['attachments'][number];

function Attachments({ items }: { items: Attachment[] }) {
    const [preview, setPreview] = useState<Attachment | null>(null);
    const previewButton = useRef<HTMLButtonElement>(null);

    if (!items.length) {
        return (
            <p className="text-sm text-muted-foreground">No hay adjuntos.</p>
        );
    }

    return (
        <>
            <ul className="grid gap-3 lg:grid-cols-2">
                {items.map((item) => {
                    const pdf = /\.pdf$/i.test(item.original_name);
                    const image = /\.(?:jpe?g|png|webp)$/i.test(
                        item.original_name,
                    );
                    const Icon = pdf ? FileText : image ? FileImage : FileIcon;
                    const sources: Record<string, string> = {
                        initial: 'Documento original',
                        supplemental: 'Enviado después por el vecino',
                    };

                    return (
                        <li
                            key={item.id}
                            className="grid min-w-0 gap-2 rounded-lg border p-3"
                        >
                            <div className="flex min-w-0 items-start gap-2.5">
                                <Icon
                                    aria-hidden="true"
                                    className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium [overflow-wrap:anywhere]">
                                        {item.original_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {sources[item.type] ??
                                            'Documento adjunto'}
                                        {item.created_at &&
                                            ' · ' + item.created_at}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(pdf || image) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-10"
                                        aria-label={'Ver ' + item.original_name}
                                        onClick={(event) => {
                                            previewButton.current =
                                                event.currentTarget;
                                            setPreview(item);
                                        }}
                                    >
                                        <Eye aria-hidden="true" /> Ver
                                    </Button>
                                )}
                                <Button
                                    asChild
                                    variant="outline"
                                    className="min-h-10"
                                >
                                    <a
                                        href={item.url}
                                        aria-label={
                                            'Descargar ' + item.original_name
                                        }
                                    >
                                        <Download aria-hidden="true" />{' '}
                                        Descargar
                                    </a>
                                </Button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <Dialog
                open={preview !== null}
                onOpenChange={(open) => {
                    if (!open) setPreview(null);
                }}
            >
                {preview && (
                    <DialogContent
                        className="max-h-[90dvh] overflow-auto sm:max-w-4xl"
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            previewButton.current?.focus();
                        }}
                    >
                        <DialogHeader className="min-w-0 pe-6">
                            <DialogTitle className="[overflow-wrap:anywhere]">
                                {preview.original_name}
                            </DialogTitle>
                            <DialogDescription>
                                Vista previa del adjunto
                            </DialogDescription>
                        </DialogHeader>
                        <AttachmentPreview key={preview.id} item={preview} />
                        <DialogFooter>
                            <Button
                                asChild
                                variant="outline"
                                className="min-h-10"
                            >
                                <a href={preview.url}>
                                    <Download aria-hidden="true" /> Descargar
                                    archivo
                                </a>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

const previewTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
];

function AttachmentPreview({ item }: { item: Attachment }) {
    const [file, setFile] = useState<{ url: string; mime: string } | null>(
        null,
    );
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        let objectUrl: string | null = null;

        async function loadPreview() {
            try {
                const response = await fetch(item.url, {
                    signal: controller.signal,
                });
                const mime =
                    response.headers.get('content-type')?.split(';')[0] ?? '';
                if (!response.ok || !previewTypes.includes(mime)) {
                    throw new Error('Invalid attachment preview');
                }

                const blob = await response.blob();
                if (!controller.signal.aborted) {
                    objectUrl = URL.createObjectURL(blob);
                    setFile({ url: objectUrl, mime });
                }
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        }

        void loadPreview();
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [item.url]);

    if (failed) {
        return (
            <p role="alert" className="text-sm text-destructive">
                No se pudo mostrar la vista previa. Podés intentar descargar el
                archivo.
            </p>
        );
    }
    if (!file) {
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Cargando archivo…
            </p>
        );
    }
    if (file.mime === 'application/pdf') {
        return (
            <iframe
                className="h-[60dvh] w-full rounded-md border"
                title={item.original_name}
                src={file.url}
            />
        );
    }
    return (
        <img
            src={file.url}
            alt={item.original_name}
            className="mx-auto max-h-[60dvh] w-full object-contain"
        />
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
        <section className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold">{title}</h2>
            <div className="flex flex-col gap-3">{children}</div>
        </section>
    );
}

function Info({ label, value }: { label: string; value?: unknown }) {
    const displayValue = displayPayloadValue(value);

    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
                {displayValue || 'Sin dato'}
            </p>
        </div>
    );
}

function fieldLabel(request: IntakeRequest, key: string) {
    if (key === 'subtype') {
        return 'Tramite especifico';
    }

    return (
        (request.subtype?.schema ?? request.type.schema)?.find(
            (field) => field.name === key,
        )?.label ?? key
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

function buildWhatsAppSummary(request: IntakeRequest): string {
    const lines = [
        '*Mesa de Entrada - aviso de solicitud*',
        `Codigo: ${request.public_code}`,
        `Fecha: ${formatIntakeDate(request.created_at)}`,
        `Estado: ${request.status_label}`,
        '',
        '*Solicitud*',
        `Categoria: ${request.type.category}`,
        `Tipo: ${request.type.name}`,
        `Asunto: ${request.subject}`,
        ...([
            'Eventos',
            'Ambiente y animales',
            'Obras y Servicios Publicos',
        ].includes(request.type.category)
            ? [
                  'lugar',
                  'fecha',
                  'desde',
                  'hasta',
                  'personas',
                  'cobertura',
              ].flatMap((key) => {
                  const value = displayPayloadValue(request.payload?.[key]);

                  return value ? [`${fieldLabel(request, key)}: ${value}`] : [];
              })
            : []),
        ...assistanceSummaryLines(request),
        ...derivationSummaryLines(request),
        '',
        'Datos y adjuntos disponibles en el panel de Mesa de Entrada.',
    ];

    return lines.filter((line) => line !== null).join('\n');
}

function assistanceSummaryLines(request: IntakeRequest): string[] {
    if (!request.assistance_types?.length) {
        return [];
    }

    return [
        '',
        `Tipificacion: ${request.assistance_types.map((type) => type.name).join(', ')}`,
    ];
}

function derivationSummaryLines(request: IntakeRequest): string[] {
    if (request.derivations.length === 0) {
        return [];
    }

    return [
        '',
        '*Derivaciones actuales*',
        ...request.derivations.map((derivation) => {
            const assistance = derivation.assistance_type?.name
                ? ` / ${derivation.assistance_type.name}`
                : '';
            return `${derivation.department.name}${assistance}: ${derivation.status_label}`;
        }),
    ];
}

function statusLabel(
    statuses: { value: string; label: string }[],
    value?: string | null,
) {
    return statuses.find((item) => item.value === value)?.label ?? 'Sin estado';
}

function historyActionLabel(
    action: string,
    status?: string | null,
    hasPublicMessage = false,
) {
    if (action === 'created') return 'Solicitud recibida';
    if (action === 'derived') return 'Solicitud derivada';
    if (action === 'documentation_received') return 'Documentación recibida';
    if (action !== 'status_changed') return action;
    if (status === 'needs_documentation') return 'Se solicitó documentación';
    if (status === 'answered') return 'Respuesta registrada';
    if (hasPublicMessage) return 'Actualización con mensaje público';
    return 'Cambio de estado';
}

function derivationHistoryActionLabel(action: string) {
    if (action === 'area_response_updated') {
        return 'Respuesta actualizada';
    }

    return action;
}

AdminIntakeShow.layout = {
    breadcrumbs: [{ title: 'Mesa de Entrada', href: index() }],
};
