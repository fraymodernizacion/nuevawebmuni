import { Head, Link } from '@inertiajs/react';
import {
    priorityLabel,
    statusBadgeClass,
    statusLabel,
} from '@/lib/complaint-labels';
import { dashboard, index, planning } from '@/routes/admin/complaints';

type Zone = {
    id: number;
    code: string;
    name: string;
    color: string;
    open_count: number;
    resolved_count: number;
    second_visit_count: number;
    localities: { name: string }[];
};

type AnalyticsItem = {
    id?: number;
    label?: string;
    name?: string;
    code?: string;
    priority?: string;
    current_status?: string;
    total?: number;
    total_count?: number;
    open_count?: number;
    urgent_count?: number;
    in_progress_count?: number;
    second_visit_count?: number;
    operational_zone?: {
        code: string;
        color: string;
    };
};

type ComplaintModule = {
    id: number;
    slug: string;
    name: string;
    status: string;
    type_count: number;
    total_count: number;
    open_count: number;
    resolved_count: number;
    enabled: boolean;
};

type StandbyModule = {
    name: string;
    description: string;
};

export default function ComplaintsDashboard({
    kpis,
    byZone,
    byStatus,
    modules,
    canManageComplaints,
    routePlanningEnabled,
    analytics,
}: {
    kpis: Record<string, number>;
    byZone: Zone[];
    byStatus: { current_status: string; total: number }[];
    modules: {
        active: ComplaintModule[];
        standby: StandbyModule[];
    };
    canManageComplaints: boolean;
    routePlanningEnabled: boolean;
    analytics: {
        byLocality: AnalyticsItem[];
        byType: AnalyticsItem[];
        byPriority: AnalyticsItem[];
        aging: AnalyticsItem[];
        trend: AnalyticsItem[];
    };
}) {
    const localityRows = analytics.byLocality.map((item) => ({
        label: item.name ?? '',
        value: item.open_count ?? 0,
        note: `Total: ${item.total_count ?? 0} · Urgentes: ${item.urgent_count ?? 0}`,
        href: canManageComplaints
            ? index({ query: { locality: item.id } })
            : undefined,
        color: item.operational_zone?.color,
    }));
    const typeRows = analytics.byType.map((item) => ({
        label: item.name ?? '',
        value: item.open_count ?? 0,
        note: `Total historico: ${item.total_count ?? 0}`,
        href: canManageComplaints
            ? index({ query: { type: item.id } })
            : undefined,
    }));
    const priorityRows = analytics.byPriority.map((item) => ({
        label: priorityLabel(item.priority),
        value: item.total ?? 0,
        href: canManageComplaints
            ? index({ query: { priority: item.priority } })
            : undefined,
    }));
    const statusRows = byStatus.map((item) => ({
        label: statusLabel(item.current_status),
        value: item.total,
        href: canManageComplaints
            ? index({ query: { status: item.current_status } })
            : undefined,
        badgeClass: statusBadgeClass(item.current_status),
    }));
    const agingRows = analytics.aging.map((item) => ({
        label: item.label ?? '',
        value: item.total ?? 0,
    }));
    const trendRows = analytics.trend.map((item) => ({
        label: item.label ?? '',
        value: item.total ?? 0,
    }));

    return (
        <>
            <Head title="Tablero" />
            <div className="flex flex-col gap-5 p-4">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Tablero
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Vista general de reclamos municipales. Por ahora
                            operamos Alumbrado Publico.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {canManageComplaints && (
                            <Link
                                href={index()}
                                className="rounded-md border px-3 py-2 text-sm font-medium"
                            >
                                Listado
                            </Link>
                        )}
                        {routePlanningEnabled && (
                            <Link
                                href={planning()}
                                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Planificacion Alumbrado
                            </Link>
                        )}
                    </div>
                </header>

                <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Modulos de reclamos
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Estructura preparada para sumar nuevos
                                    rubros sin cambiar la navegacion principal.
                                </p>
                            </div>
                            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                Inicio: Alumbrado
                            </span>
                        </div>
                        <div className="mt-4 grid gap-3">
                            {modules.active.map((module) => (
                                <ModuleCard
                                    key={module.id}
                                    module={module}
                                    canManageComplaints={canManageComplaints}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <h2 className="text-lg font-semibold">
                            Proximos modulos
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Quedan visibles para planificar, pero sin operativa
                            habilitada.
                        </p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {modules.standby.map((module) => (
                                <div
                                    key={module.name}
                                    className="rounded-md border border-dashed bg-background p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-sm font-semibold">
                                            {module.name}
                                        </h3>
                                        <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                                            Standby
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {module.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Alumbrado Publico
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Indicadores operativos del modulo activo.
                            </p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            Los filtros y reportes se generalizan cuando se
                            active otro rubro.
                        </span>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <Kpi label="Hoy" value={kpis.today} />
                    <Kpi label="Abiertos" value={kpis.open} />
                    <Kpi label="En relevamiento" value={kpis.in_progress} />
                    <Kpi label="Segunda visita" value={kpis.second_visit} />
                    <Kpi label="Urgentes" value={kpis.urgent} />
                    <Kpi label="+7 dias" value={kpis.older_than_seven_days} />
                    <Kpi label="Resueltos" value={kpis.resolved} />
                    <Kpi
                        label="Resolucion"
                        value={`${kpis.resolution_rate}%`}
                    />
                </section>
                <section className="grid gap-4 lg:grid-cols-4">
                    {byZone.map((zone) => (
                        <Link
                            key={zone.id}
                            href={
                                routePlanningEnabled
                                    ? planning({ query: { zone: zone.id } })
                                    : index({ query: { zone: zone.id } })
                            }
                            className="rounded-lg border bg-card p-4 hover:bg-muted/50"
                        >
                            <div className="flex items-center justify-between">
                                <h2
                                    className="text-lg font-semibold"
                                    style={{ color: zone.color }}
                                >
                                    Zona {zone.code}
                                </h2>
                                <span className="rounded-md bg-muted px-2 py-1 text-sm">
                                    {zone.open_count} pendientes
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {zone.localities
                                    .map((locality) => locality.name)
                                    .join(' / ')}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                <span>
                                    Resueltos:{' '}
                                    <strong>{zone.resolved_count}</strong>
                                </span>
                                <span>
                                    Segunda visita:{' '}
                                    <strong>{zone.second_visit_count}</strong>
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>
                <section className="rounded-lg border bg-card p-4">
                    <h2 className="text-lg font-semibold">
                        Reclamos por estado
                    </h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {statusRows.map((item) => (
                            <MetricPill key={item.label} item={item} />
                        ))}
                    </div>
                </section>
                <section className="grid gap-4 xl:grid-cols-2">
                    <AnalysisPanel
                        title="Reclamos por localidad"
                        rows={localityRows}
                    />
                    <AnalysisPanel title="Tipos de problema" rows={typeRows} />
                    <AnalysisPanel
                        title="Prioridad de pendientes"
                        rows={priorityRows}
                    />
                    <AnalysisPanel title="Antiguedad" rows={agingRows} />
                    <AnalysisPanel
                        title="Ingresos ultimos 7 dias"
                        rows={trendRows}
                    />
                </section>
            </div>
        </>
    );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-normal">
                {value}
            </p>
        </div>
    );
}

type MetricRow = {
    label: string;
    value: number;
    note?: string;
    href?: ReturnType<typeof index>;
    color?: string;
    badgeClass?: string;
};

function AnalysisPanel({ title, rows }: { title: string; rows: MetricRow[] }) {
    const maxValue = Math.max(...rows.map((row) => row.value), 1);

    return (
        <section className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="mt-3 grid gap-3">
                {rows.map((row) => (
                    <MetricBar
                        key={`${title}-${row.label}`}
                        row={row}
                        percentage={(row.value / maxValue) * 100}
                    />
                ))}
                {rows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Sin datos disponibles.
                    </p>
                )}
            </div>
        </section>
    );
}

function MetricBar({
    row,
    percentage,
}: {
    row: MetricRow;
    percentage: number;
}) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.label}</p>
                    {row.note && (
                        <p className="text-xs text-muted-foreground">
                            {row.note}
                        </p>
                    )}
                </div>
                <span className="text-sm font-semibold">{row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{
                        width: `${Math.max(percentage, row.value > 0 ? 6 : 0)}%`,
                        backgroundColor: row.color,
                    }}
                />
            </div>
        </>
    );

    if (row.href) {
        return (
            <Link
                href={row.href}
                className="grid gap-2 rounded-md border p-3 hover:bg-muted/50"
            >
                {content}
            </Link>
        );
    }

    return <div className="grid gap-2 rounded-md border p-3">{content}</div>;
}

function MetricPill({ item }: { item: MetricRow }) {
    const content = (
        <>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-normal">
                {item.value}
            </p>
        </>
    );

    if (!item.href) {
        return (
            <div
                className={`rounded-lg border p-4 ${item.badgeClass ?? 'bg-card'}`}
            >
                {content}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className={`rounded-lg border p-4 ${item.badgeClass ?? 'bg-card'}`}
        >
            {content}
        </Link>
    );
}

ComplaintsDashboard.layout = {
    breadcrumbs: [{ title: 'Tablero', href: dashboard() }],
};

function ModuleCard({
    module,
    canManageComplaints,
}: {
    module: ComplaintModule;
    canManageComplaints: boolean;
}) {
    const content = (
        <>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Modulo activo
                    </p>
                    <h3 className="text-xl font-semibold tracking-normal">
                        {module.name}
                    </h3>
                </div>
                <span className="w-fit rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                    {module.status}
                </span>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-4">
                <SmallMetric label="Tipos" value={module.type_count} />
                <SmallMetric label="Total" value={module.total_count} />
                <SmallMetric label="Abiertos" value={module.open_count} />
                <SmallMetric label="Resueltos" value={module.resolved_count} />
            </div>
        </>
    );

    if (canManageComplaints && module.enabled) {
        return (
            <Link
                href={index()}
                className="grid gap-4 rounded-md border bg-background p-4 hover:bg-muted/60"
            >
                {content}
            </Link>
        );
    }

    return (
        <div className="grid gap-4 rounded-md border bg-background p-4">
            {content}
        </div>
    );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md bg-muted p-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    );
}
