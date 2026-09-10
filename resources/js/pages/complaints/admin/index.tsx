import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronRight,
    Filter,
    LoaderCircle,
    MapPin,
    Phone,
    Search,
    X,
} from 'lucide-react';
import {
    FormEvent,
    KeyboardEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import { show } from '@/actions/App/Http/Controllers/Admin/ComplaintController';
import {
    statusBadgeClass,
    statusLabel,
} from '@/lib/complaint-labels';
import { index } from '@/routes/admin/complaints';

type Complaint = {
    id: number;
    public_code: string;
    created_at: string;
    first_name: string;
    last_name: string;
    dni?: string | null;
    phone: string;
    latitude?: string | null;
    longitude?: string | null;
    current_status: string;
    priority: string;
    type: { name: string };
    locality: { name: string };
    operational_zone: { code: string; name: string; color: string };
};

type Filters = Record<string, string>;
type FilterKey = 'search' | 'status' | 'zone' | 'locality' | 'type' | 'order';

type Props = {
    complaints: {
        data: Complaint[];
        from: number | null;
        to: number | null;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Filters;
    operationalSummary: Record<string, number>;
    options: {
        zones: { id: number; code: string; name: string; color: string }[];
        localities: { id: number; name: string }[];
        types: { id: number; name: string }[];
        statuses: { value: string; label: string }[];
    };
};

const summaryItems = [
    {
        status: 'new',
        label: 'Nuevos',
        tone: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100',
    },
    {
        status: 'assigned',
        label: 'Asignados',
        tone: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    },
    {
        status: 'in_progress',
        label: 'En trabajo',
        tone: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-100',
    },
    {
        status: 'needs_second_visit',
        label: '2da visita',
        tone: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100',
    },
];

const ageToneClasses = {
    recent: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
    warning:
        'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
    late: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

export default function AdminComplaintsIndex({
    complaints,
    filters,
    operationalSummary,
    options,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [zone, setZone] = useState(filters.zone ?? '');
    const [locality, setLocality] = useState(filters.locality ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [order, setOrder] = useState(filters.order ?? 'oldest');
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const firstRender = useRef(true);
    const latestVisitId = useRef(0);
    const activeFilters = buildActiveFilters(
        { search, status, zone, locality, type, order },
        options,
    );
    const secondaryFilterCount = [status, type].filter(Boolean).length;

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = window.setTimeout(() => {
            visitWithFilters({ search, status, zone, locality, type, order });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    function submit(event: FormEvent) {
        event.preventDefault();
        visitWithFilters({ search, status, zone, locality, type, order });
    }

    function applyStatusFilter(nextStatus: string) {
        const selectedStatus = status === nextStatus ? '' : nextStatus;

        setStatus(selectedStatus);
        visitWithFilters({
            search,
            status: selectedStatus,
            zone,
            locality,
            type,
            order,
        });
    }

    function visitWithFilters(nextFilters: Filters) {
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

    function clearSearch() {
        setSearch('');
    }

    function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape' && search) {
            event.preventDefault();
            clearSearch();
        }
    }

    function changeZone(nextZone: string) {
        setZone(nextZone);
        visitWithFilters({
            search,
            status,
            zone: nextZone,
            locality,
            type,
            order,
        });
    }

    function changeLocality(nextLocality: string) {
        setLocality(nextLocality);
        visitWithFilters({
            search,
            status,
            zone,
            locality: nextLocality,
            type,
            order,
        });
    }

    function changeOrder(nextOrder: string) {
        setOrder(nextOrder);
        visitWithFilters({
            search,
            status,
            zone,
            locality,
            type,
            order: nextOrder,
        });
    }

    function changeStatus(nextStatus: string) {
        setStatus(nextStatus);
        visitWithFilters({
            search,
            status: nextStatus,
            zone,
            locality,
            type,
            order,
        });
    }

    function changeType(nextType: string) {
        setType(nextType);
        visitWithFilters({
            search,
            status,
            zone,
            locality,
            type: nextType,
            order,
        });
    }

    function removeFilter(key: FilterKey) {
        const nextFilters = { search, status, zone, locality, type, order };

        nextFilters[key] = key === 'order' ? 'oldest' : '';
        setSearch(nextFilters.search);
        setStatus(nextFilters.status);
        setZone(nextFilters.zone);
        setLocality(nextFilters.locality);
        setType(nextFilters.type);
        setOrder(nextFilters.order);
        visitWithFilters(nextFilters);
    }

    return (
        <>
            <Head title="Gestión de Reclamos" />
            <div className="flex flex-col gap-3 p-3 sm:p-4">
                <header>
                    <h1 className="text-xl font-semibold tracking-normal">
                        Gestión de Reclamos
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Alumbrado Público
                    </p>
                </header>

                <section className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
                    {summaryItems.map((item) => (
                        <button
                            key={item.status}
                            type="button"
                            onClick={() => applyStatusFilter(item.status)}
                            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition hover:bg-muted/50 ${
                                status === item.status
                                    ? `${item.tone} ring-2 ring-primary/30`
                                    : 'bg-card'
                            }`}
                        >
                            <span className="font-semibold">
                                {operationalSummary[item.status] ?? 0}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </section>

                <form
                    onSubmit={submit}
                    className="grid gap-2 lg:grid-cols-[minmax(320px,1fr)_150px_190px_170px_auto]"
                >
                    <label className="relative">
                        {isSearching ? (
                            <LoaderCircle className="absolute top-3 left-3 size-4 animate-spin text-muted-foreground" />
                        ) : (
                            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        )}
                        <input
                            className="input min-h-11 pr-9 pl-9 focus-visible:ring-2 focus-visible:ring-primary/40"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Buscar reclamo, DNI, vecino, teléfono, lugar o problema..."
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Limpiar búsqueda"
                                className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </label>
                    <select
                        className="input min-h-11"
                        value={zone}
                        onChange={(event) => changeZone(event.target.value)}
                    >
                        <option value="">Todas las zonas</option>
                        {options.zones.map((item) => (
                            <option key={item.id} value={item.id}>
                                Zona {item.code}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input min-h-11"
                        value={locality}
                        onChange={(event) =>
                            changeLocality(event.target.value)
                        }
                    >
                        <option value="">Todas las localidades</option>
                        {options.localities.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input min-h-11"
                        value={order}
                        onChange={(event) => changeOrder(event.target.value)}
                    >
                        <option value="oldest">Más antiguos primero</option>
                        <option value="recent">Más recientes primero</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => setShowMoreFilters((value) => !value)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted/50"
                    >
                        <Filter className="size-4" />
                        Más filtros
                        {secondaryFilterCount > 0 && (
                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground">
                                {secondaryFilterCount}
                            </span>
                        )}
                    </button>
                </form>

                {showMoreFilters && (
                    <section className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:max-w-xl">
                        <select
                            className="input"
                            value={status}
                            onChange={(event) =>
                                changeStatus(event.target.value)
                            }
                        >
                            <option value="">Todos los estados</option>
                            {options.statuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input"
                            value={type}
                            onChange={(event) => changeType(event.target.value)}
                        >
                            <option value="">Todos los problemas</option>
                            {options.types.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </section>
                )}

                {activeFilters.length > 0 && (
                    <section className="flex flex-wrap items-center gap-2 text-xs">
                        {activeFilters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => removeFilter(filter.key)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-full border bg-card px-2.5 font-medium hover:bg-muted/60"
                            >
                                {filter.label}
                                <X className="size-3.5" />
                            </button>
                        ))}
                        <Link
                            href={index()}
                            className="inline-flex min-h-8 items-center gap-1 px-1 font-medium text-blue-700 hover:underline dark:text-blue-300"
                        >
                            <X className="size-3.5" />
                            Limpiar filtros
                        </Link>
                    </section>
                )}

                <section className="overflow-hidden rounded-lg border bg-card">
                    {complaints.data.length === 0 && (
                        <div className="grid gap-1 px-4 py-8 text-sm">
                            <p className="font-medium">
                                {search
                                    ? `No encontramos reclamos para "${search}".`
                                    : 'No hay reclamos para los filtros seleccionados.'}
                            </p>
                            <p className="text-muted-foreground">
                                Probá buscando por número, DNI, vecino, teléfono,
                                localidad o tipo de problema.
                            </p>
                        </div>
                    )}
                    {complaints.data.map((complaint) => (
                        <ComplaintRow
                            key={complaint.id}
                            complaint={complaint}
                        />
                    ))}
                </section>

                {complaints.total > 0 && (
                    <nav className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground">
                            Mostrando {complaints.from} a {complaints.to} de{' '}
                            {complaints.total}{' '}
                            {search ? 'resultados' : 'reclamos'}
                            {isSearching && ' · Buscando...'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {complaints.links.map((link, indexKey) => (
                                <PaginationLink
                                    key={`${link.label}-${indexKey}`}
                                    link={link}
                                />
                            ))}
                        </div>
                    </nav>
                )}
            </div>
        </>
    );
}

function ComplaintRow({ complaint }: { complaint: Complaint }) {
    const detailUrl = show.url(complaint.id);
    const age = complaintAge(complaint.created_at);

    function openDetail() {
        router.visit(detailUrl);
    }

    function openDetailWithKeyboard(event: KeyboardEvent<HTMLElement>) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetail();
        }
    }

    return (
        <article
            role="link"
            tabIndex={0}
            onClick={openDetail}
            onKeyDown={openDetailWithKeyboard}
            className="group cursor-pointer border-b px-3 py-3 text-sm outline-none transition hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-4"
        >
            <div className="flex items-start justify-between gap-3">
                <strong className="text-sm">{complaint.public_code}</strong>
                <div className="flex items-center gap-2">
                    <StatusBadge status={complaint.current_status} />
                    <ChevronRight className="hidden size-4 text-muted-foreground transition group-hover:translate-x-0.5 sm:block" />
                </div>
            </div>
            <AgeLine age={age} />
            <div className="mt-1.5 font-semibold">
                {complaint.type.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {complaint.locality.name} · Zona{' '}
                    {complaint.operational_zone.code}
                </span>
                {hasCoordinates(complaint) && (
                    <a
                        href={mapsUrl(complaint)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-300"
                    >
                        Ver mapa
                    </a>
                )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>
                    {complaint.first_name} {complaint.last_name}
                </span>
                {complaint.dni && <span>DNI {complaint.dni}</span>}
                <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {complaint.phone}
                </span>
            </div>
        </article>
    );
}

function AgeLine({
    age,
}: {
    age: { label: string; date: string; tone: keyof typeof ageToneClasses };
}) {
    return (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span
                className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${ageToneClasses[age.tone]}`}
            >
                {age.label}
            </span>
            <span className="text-muted-foreground">· {age.date}</span>
        </div>
    );
}

function StatusBadge({
    status,
    className = '',
}: {
    status: string;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex min-h-8 w-fit max-w-full items-center rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-normal ${statusBadgeClass(status)} ${className}`}
        >
            {statusLabel(status)}
        </span>
    );
}

function PaginationLink({
    link,
}: {
    link: { url: string | null; label: string; active: boolean };
}) {
    const label = paginationLabel(link.label);

    if (!link.url) {
        return (
            <span className="rounded-md border px-3 py-2 text-muted-foreground opacity-50">
                {label}
            </span>
        );
    }

    return (
        <Link
            href={link.url}
            className={`rounded-md border px-3 py-2 font-medium ${
                link.active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted/50'
            }`}
        >
            {label}
        </Link>
    );
}

function compactFilters(filters: Filters) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ''),
    );
}

function buildActiveFilters(filters: Filters, options: Props['options']) {
    const activeFilters: { key: FilterKey; label: string }[] = [];
    const status = options.statuses.find(
        (item) => item.value === filters.status,
    );
    const zone = options.zones.find((item) => String(item.id) === filters.zone);
    const locality = options.localities.find(
        (item) => String(item.id) === filters.locality,
    );
    const type = options.types.find((item) => String(item.id) === filters.type);

    if (filters.search) {
        activeFilters.push({
            key: 'search',
            label: `Búsqueda: ${filters.search}`,
        });
    }

    if (status) {
        activeFilters.push({ key: 'status', label: status.label });
    }

    if (zone) {
        activeFilters.push({ key: 'zone', label: `Zona ${zone.code}` });
    }

    if (locality) {
        activeFilters.push({ key: 'locality', label: locality.name });
    }

    if (type) {
        activeFilters.push({ key: 'type', label: type.name });
    }

    if (filters.order === 'recent') {
        activeFilters.push({ key: 'order', label: 'Más recientes primero' });
    }

    return activeFilters;
}

function hasCoordinates(complaint: Complaint) {
    return Boolean(complaint.latitude && complaint.longitude);
}

function mapsUrl(complaint: Complaint) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${complaint.latitude},${complaint.longitude}`)}`;
}

function complaintAge(value: string) {
    const createdAt = new Date(value);
    const today = startOfDay(new Date());
    const createdDay = startOfDay(createdAt);
    const diffDays = Math.max(
        0,
        Math.floor((today.getTime() - createdDay.getTime()) / 86_400_000),
    );

    return {
        label: ageLabel(diffDays),
        date: createdAt.toLocaleDateString('es-AR'),
        tone: ageTone(diffDays),
    };
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ageLabel(days: number) {
    if (days === 0) {
        return 'Hoy';
    }

    if (days === 1) {
        return 'Ayer';
    }

    return `Hace ${days} días`;
}

function ageTone(days: number): keyof typeof ageToneClasses {
    if (days >= 4) {
        return 'late';
    }

    if (days >= 2) {
        return 'warning';
    }

    return 'recent';
}

function paginationLabel(label: string) {
    return label
        .replace('&laquo;', 'Anterior')
        .replace('&raquo;', 'Siguiente');
}

AdminComplaintsIndex.layout = {
    breadcrumbs: [{ title: 'Gestión de Reclamos', href: index() }],
};
