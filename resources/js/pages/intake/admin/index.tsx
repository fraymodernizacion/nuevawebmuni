import { Head, Link, router } from '@inertiajs/react';
import { Bell, ClipboardList, FileText, LoaderCircle, Search } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { formatIntakeDate, intakeStatusClass } from '@/lib/intake-labels';
import { index, notifications, show } from '@/routes/admin/intake';
import { index as complaintsIndex } from '@/routes/admin/complaints';

type IntakeRequest = {
    id: number;
    public_code: string;
    created_at: string;
    status: string;
    applicant_name: string;
    applicant_phone: string;
    subject: string;
    summary: string;
    area?: string | null;
    type: {
        name: string;
        category: string;
        color: string;
    };
};

type Props = {
    requests: {
        data: IntakeRequest[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Record<string, string>;
    statuses: { value: string; label: string }[];
    complaintSummary: { pending: number; new: number };
    secretariatOptions: string[];
    unreadDerivationNotificationsCount: number;
    derivationNotifications: DerivationNotification[];
};

type DerivationNotification = {
    id: number;
    action: string;
    from_status_label?: string | null;
    to_status_label?: string | null;
    previous_response?: string | null;
    new_response?: string | null;
    changed_at?: string | null;
    operator_seen_at?: string | null;
    is_seen: boolean;
    user?: { name: string } | null;
    department?: { name: string; secretariat?: string | null; color: string } | null;
    assistance_type?: { name: string; color: string } | null;
    request?: {
        id: number;
        public_code: string;
        subject: string;
        applicant_name: string;
    } | null;
};

export default function AdminIntakeIndex({
    requests,
    filters,
    statuses,
    complaintSummary,
    secretariatOptions,
    unreadDerivationNotificationsCount,
    derivationNotifications,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [secretariat, setSecretariat] = useState(filters.secretariat ?? '');
    const [isSearching, setIsSearching] = useState(false);
    const firstRender = useRef(true);
    const latestVisitId = useRef(0);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = window.setTimeout(() => {
            visitWithFilters({ search, status, secretariat });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, status, secretariat]);

    function submit(event: FormEvent) {
        event.preventDefault();
        visitWithFilters({ search, status, secretariat });
    }

    function visitWithFilters(nextFilters: Record<string, string>) {
        const visitId = latestVisitId.current + 1;

        latestVisitId.current = visitId;
        router.cancelAll();
        setIsSearching(true);

        router.get(index.url(), compactFilters(nextFilters), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => {
                if (latestVisitId.current === visitId) {
                    setIsSearching(false);
                }
            },
        });
    }

    return (
        <>
            <Head title="Mesa de Entrada" />
            <div className="flex flex-col gap-4 p-4">
                <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Mesa de Entrada
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Bandeja de solicitudes virtuales y derivacion
                            interna.
                        </p>
                    </div>
                    <Link
                        href={complaintsIndex()}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold"
                    >
                        <ClipboardList className="size-4" />
                        Reclamos pendientes: {complaintSummary.pending}
                    </Link>
                </header>

                <section className="grid gap-3 sm:grid-cols-3">
                    <Metric
                        label="Solicitudes"
                        value={requests.data.length.toString()}
                    />
                    <Metric
                        label="Reclamos nuevos"
                        value={complaintSummary.new.toString()}
                    />
                    <Metric
                        label="Notificaciones"
                        value={unreadDerivationNotificationsCount.toString()}
                    />
                </section>

                <section className="rounded-lg border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Bell className="size-5 text-amber-600" />
                                Notificaciones de areas
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Cambios de respuestas pendientes de revision.
                            </p>
                        </div>
                        <Link
                            href={notifications.url({
                                query: { secretariat },
                            })}
                            className="inline-flex min-h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold"
                        >
                            Ver todas
                        </Link>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                        {derivationNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                            />
                        ))}
                        {derivationNotifications.length === 0 && (
                            <p className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                                No hay cambios pendientes de revision.
                            </p>
                        )}
                    </div>
                </section>

                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[1fr_220px_260px_auto]"
                >
                    <label className="relative">
                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                            className="input pl-9"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Numero, vecino, telefono o resumen"
                        />
                    </label>
                    <select
                        className="input"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        {statuses.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={secretariat}
                        onChange={(event) =>
                            setSecretariat(event.target.value)
                        }
                    >
                        <option value="">Todas las secretarias</option>
                        {secretariatOptions.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <div className="flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold text-muted-foreground">
                        {isSearching ? (
                            <span className="inline-flex items-center gap-2">
                                <LoaderCircle className="size-4 animate-spin" />
                                Filtrando
                            </span>
                        ) : (
                            'Filtro activo'
                        )}
                    </div>
                </form>

                <section className="grid gap-3">
                    {requests.data.map((request) => (
                        <Link
                            key={request.id}
                            href={show.url(request.id)}
                            className="grid gap-3 rounded-lg border bg-card p-4 text-sm hover:bg-muted/60 md:grid-cols-[1fr_180px_160px]"
                        >
                            <div className="flex gap-3">
                                <span
                                    className="mt-1 grid size-10 shrink-0 place-items-center rounded-md text-white"
                                    style={{
                                        backgroundColor: request.type.color,
                                    }}
                                >
                                    <FileText className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                        {request.type.category}
                                    </p>
                                    <h2 className="text-lg font-semibold tracking-normal">
                                        {request.subject}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {request.public_code} ·{' '}
                                        {request.applicant_name} ·{' '}
                                        {request.applicant_phone}
                                    </p>
                                    <p className="mt-2 line-clamp-2">
                                        {request.summary}
                                    </p>
                                </div>
                            </div>
                            <span className="text-muted-foreground">
                                {formatIntakeDate(request.created_at)}
                            </span>
                            <span
                                className={`h-fit rounded-md border px-3 py-1 text-center text-xs font-semibold ${intakeStatusClass(request.status)}`}
                            >
                                {
                                    statuses.find(
                                        (item) => item.value === request.status,
                                    )?.label
                                }
                            </span>
                        </Link>
                    ))}
                    {requests.data.length === 0 && (
                        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                            No hay solicitudes para estos filtros.
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function NotificationItem({
    notification,
}: {
    notification: DerivationNotification;
}) {
    const response = notification.new_response?.trim();

    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                        {notification.department?.secretariat ??
                            'Secretaria sin dato'}
                        {' · '}
                        {notification.department?.name ?? 'Area sin dato'}
                        {notification.assistance_type?.name
                            ? ` · ${notification.assistance_type.name}`
                            : ''}
                    </p>
                    <h3 className="line-clamp-1 font-semibold">
                        {notification.request?.public_code ?? 'Solicitud'} ·{' '}
                        {notification.request?.subject ?? 'Sin asunto'}
                    </h3>
                </div>
                <span className="shrink-0 rounded-md border px-2 py-1 text-xs font-semibold">
                    {notification.to_status_label ?? 'Actualizada'}
                </span>
            </div>
            <p className="text-xs text-muted-foreground">
                {formatIntakeDate(notification.changed_at)} ·{' '}
                {notification.user?.name ?? 'Area'}
                {notification.request?.applicant_name
                    ? ` · ${notification.request.applicant_name}`
                    : ''}
            </p>
            {response && <p className="line-clamp-2 text-sm">{response}</p>}
        </>
    );

    if (!notification.request) {
        return (
            <article className="flex flex-col gap-2 rounded-md border bg-background p-3">
                {content}
            </article>
        );
    }

    return (
        <Link
            href={show.url(notification.request.id)}
            className="flex flex-col gap-2 rounded-md border bg-background p-3 hover:bg-muted/60"
        >
            {content}
        </Link>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-normal">
                {value}
            </p>
        </div>
    );
}

function compactFilters(filters: Record<string, string>) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ''),
    );
}

AdminIntakeIndex.layout = {
    breadcrumbs: [{ title: 'Mesa de Entrada', href: index() }],
};
