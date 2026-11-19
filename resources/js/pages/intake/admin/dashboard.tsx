import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    Check,
    CircleX,
    Clock3,
    FileText,
    Inbox,
    LoaderCircle,
    Pause,
    Printer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { intakeStatusClass } from '@/lib/intake-labels';
import { dashboard, index } from '@/routes/admin/intake';

const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];
const colors = [
    'var(--municipal-link)',
    '#3982b8',
    '#84bd1a',
    '#d93397',
    '#c27312',
    '#8793a1',
];
const number = (value: number) => value.toLocaleString('es-AR');
const percentage = (value: number, total: number) =>
    `${(total ? (value / total) * 100 : 0).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`;

type Count = { label: string; total: number };
type Filters = { year: number; month: number | null; secretariat: string };
type Props = {
    filters: Filters;
    yearOptions: number[];
    secretariatOptions: string[];
    period: { from: string; to: string };
    summary: {
        total: number;
        finished: number;
        in_progress: number;
        rejected: number;
        suspended: number;
    };
    statuses: { value: string; label: string; total: number }[];
    types: Count[];
    secretariats: (Count & { value: string })[];
    monthly: { month: number; total: number }[];
    updatedAt: string;
};

export default function IntakeDashboard({
    filters,
    yearOptions,
    secretariatOptions,
    period,
    summary,
    statuses,
    types,
    secretariats,
    monthly,
    updatedAt,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const title = filters.month
        ? `${months[filters.month - 1]} de ${filters.year}`
        : `Informe anual ${filters.year}`;
    const maxMonthly = Math.max(1, ...monthly.map((item) => item.total));
    const maxSecretariat = Math.max(
        1,
        ...secretariats.map((item) => item.total),
    );

    function filter(changes: Partial<Filters>) {
        setError('');
        router.get(
            dashboard.url(),
            { ...filters, ...changes },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onNetworkError: () => {
                    setError(
                        'No pudimos actualizar el informe. Revisá la conexión y volvé a seleccionar el filtro.',
                    );

                    return false;
                },
            },
        );
    }

    return (
        <>
            <Head title="Informe de Mesa de Entrada" />
            <style>{`@media print { [data-slot="sidebar"], [data-slot="sidebar-inset"] > header { display:none!important; } [data-slot="sidebar-inset"] { margin:0!important; box-shadow:none!important; } }`}</style>
            <main
                className="grid min-w-0 gap-5 bg-municipal-surface p-4 text-base sm:p-6 print:bg-white print:p-0 print:text-black print:[print-color-adjust:exact]"
                aria-busy={loading}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link
                        href={index()}
                        className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-municipal-outline bg-card px-4 font-semibold text-municipal-link"
                    >
                        <Inbox className="size-5" aria-hidden="true" /> Ir a la
                        bandeja
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-municipal-outline bg-card px-4 font-semibold text-municipal-link"
                    >
                        <Printer className="size-5" aria-hidden="true" />{' '}
                        Imprimir informe
                    </button>
                </div>

                <header className="grid gap-5 rounded-2xl border-b-4 border-municipal-lime bg-municipal-navy p-5 text-white sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
                    <div className="w-fit rounded-lg bg-white p-3">
                        <img
                            src="/assets/optimized/fme-04.png"
                            alt="Fray Municipalidad"
                            width="132"
                            height="93"
                            className="h-auto w-32"
                        />
                    </div>
                    <div className="grid gap-1 sm:border-l sm:border-white/30 sm:pl-6">
                        <p className="text-sm text-white/85">
                            Municipalidad de Fray Mamerto Esquiú
                        </p>
                        <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
                            Mesa de Entrada Virtual
                        </h1>
                        <p className="text-xl font-semibold">{title}</p>
                        <p className="text-sm text-white/85">
                            Ingresos del {period.from} al {period.to}
                        </p>
                        {filters.secretariat && (
                            <p className="mt-1 font-semibold [overflow-wrap:anywhere]">
                                {filters.secretariat === '__unassigned'
                                    ? 'Sin secretaría asignada'
                                    : filters.secretariat}
                            </p>
                        )}
                    </div>
                </header>

                <section
                    aria-label="Filtros del informe"
                    className="grid min-w-0 gap-4 rounded-xl border border-municipal-outline bg-card p-4 sm:grid-cols-2 xl:grid-cols-[9rem_12rem_1fr_auto] xl:items-end print:hidden"
                >
                    <div className="grid min-w-0 gap-1.5 font-semibold">
                        <label htmlFor="report-year">Año</label>
                        <select
                            id="report-year"
                            value={filters.year}
                            onChange={(e) =>
                                filter({ year: Number(e.target.value) })
                            }
                            disabled={loading}
                            className="input min-h-12 w-full"
                        >
                            {[...yearOptions].reverse().map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid min-w-0 gap-1.5 font-semibold">
                        <label htmlFor="report-month">Período</label>
                        <select
                            id="report-month"
                            value={filters.month ?? ''}
                            onChange={(e) =>
                                filter({
                                    month: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                            disabled={loading}
                            className="input min-h-12 w-full"
                        >
                            <option value="">Todo el año</option>
                            {months.map((month, i) => (
                                <option key={month} value={i + 1}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid min-w-0 gap-1.5 font-semibold">
                        <label htmlFor="report-secretariat">Secretaría</label>
                        <select
                            id="report-secretariat"
                            value={filters.secretariat}
                            onChange={(e) =>
                                filter({ secretariat: e.target.value })
                            }
                            disabled={loading}
                            className="input min-h-12 w-full min-w-0"
                        >
                            <option value="">Todas las secretarías</option>
                            {secretariatOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                            <option value="__unassigned">
                                Sin secretaría asignada
                            </option>
                        </select>
                    </div>
                    <p
                        role="status"
                        className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground"
                    >
                        {loading ? (
                            <>
                                <LoaderCircle
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />{' '}
                                Actualizando…
                            </>
                        ) : (
                            'Los filtros se aplican automáticamente.'
                        )}
                    </p>
                </section>
                {error && (
                    <p
                        role="alert"
                        className="rounded-lg border border-destructive p-4 text-destructive"
                    >
                        {error}
                    </p>
                )}

                <section
                    aria-label="Resumen de solicitudes"
                    className="grid grid-cols-2 gap-3 xl:grid-cols-5"
                >
                    <Metric
                        label="Total de solicitudes"
                        value={summary.total}
                        total={summary.total}
                        icon={FileText}
                        tone="navy"
                        primary
                    />
                    <Metric
                        label="Finalizadas"
                        value={summary.finished}
                        total={summary.total}
                        icon={Check}
                        tone="green"
                    />
                    <Metric
                        label="En gestión"
                        value={summary.in_progress}
                        total={summary.total}
                        icon={Clock3}
                        tone="amber"
                    />
                    <Metric
                        label="Rechazadas / No corresponde"
                        value={summary.rejected}
                        total={summary.total}
                        icon={CircleX}
                        tone="red"
                    />
                    <Metric
                        label="Suspendidas"
                        value={summary.suspended}
                        total={summary.total}
                        icon={Pause}
                        tone="violet"
                    />
                </section>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Se cuentan solicitudes ingresadas en el período, según su
                    estado actual. “En gestión” agrupa Recibido, En Revisión,
                    Derivado, Requiere documentación y Pendiente, además de
                    respuestas históricas aún sin finalizar. Finalizado no
                    implica una resolución positiva.
                </p>
                {summary.total === 0 && (
                    <div
                        role="status"
                        className="rounded-xl border border-dashed border-municipal-outline bg-card p-6 text-center"
                    >
                        <h2 className="text-xl font-semibold">
                            No hay solicitudes en este período
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Probá con otro mes, año o secretaría para consultar
                            sus datos.
                        </p>
                    </div>
                )}

                <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                    <Panel
                        title="Tipos de trámite más solicitados"
                        icon={BarChart3}
                    >
                        <div className="grid min-w-0 gap-5 sm:grid-cols-[12rem_1fr] sm:items-center">
                            <Donut rows={types} total={summary.total} />
                            <ul className="grid min-w-0 gap-4">
                                {types.map((item, i) => (
                                    <li
                                        key={`${i}-${item.label}`}
                                        className="grid min-w-0 grid-cols-[0.75rem_1fr_auto] gap-2 text-sm"
                                    >
                                        <span
                                            className="mt-1 size-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    colors[i % colors.length],
                                            }}
                                            aria-hidden="true"
                                        />
                                        <span className="[overflow-wrap:anywhere]">
                                            {item.label}
                                        </span>
                                        <span className="text-right">
                                            <strong className="block text-base">
                                                {number(item.total)}
                                            </strong>
                                            <span className="text-muted-foreground">
                                                {percentage(
                                                    item.total,
                                                    summary.total,
                                                )}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Panel>
                    <Panel title="Estado de las solicitudes" icon={Clock3}>
                        <ul className="grid gap-3">
                            {statuses.map((item) => (
                                <li
                                    key={item.value}
                                    className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5"
                                >
                                    <span
                                        className={`w-fit max-w-full rounded-md px-2 py-1 text-sm font-semibold ${intakeStatusClass(item.value)}`}
                                    >
                                        {item.label}
                                    </span>
                                    <span className="text-right text-sm">
                                        <strong>{number(item.total)}</strong>
                                        <span className="ml-2 text-muted-foreground">
                                            {percentage(
                                                item.total,
                                                summary.total,
                                            )}
                                        </span>
                                    </span>
                                    <div
                                        className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-full bg-municipal-link"
                                            style={{
                                                width: `${summary.total ? (item.total / summary.total) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>

                <Panel title="Demanda por secretaría" icon={Building2}>
                    <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                        Cada solicitud se cuenta una vez por secretaría, aunque
                        tenga varias derivaciones dentro de ella. Si intervienen
                        distintas secretarías, puede figurar en más de una; por
                        eso la suma puede superar el total de solicitudes.
                    </p>
                    {secretariats.length ? (
                        <ol className="grid min-w-0 gap-3 sm:grid-cols-2">
                            {secretariats.map((item, i) => (
                                <li key={item.value} className="min-w-0">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() =>
                                            filter({ secretariat: item.value })
                                        }
                                        aria-label={`Filtrar informe por ${item.label}`}
                                        className="grid min-h-14 w-full grid-cols-[1fr_auto] items-center gap-3 rounded-lg border p-3 text-left hover:bg-municipal-tint focus-visible:outline-2 focus-visible:outline-municipal-link disabled:opacity-60"
                                    >
                                        <span className="text-sm font-semibold [overflow-wrap:anywhere]">
                                            {item.label}
                                        </span>
                                        <strong className="text-2xl tabular-nums">
                                            {number(item.total)}
                                        </strong>
                                        <span
                                            className="col-span-2 h-2 overflow-hidden rounded-full bg-muted"
                                            aria-hidden="true"
                                        >
                                            <span
                                                className="block h-full rounded-full"
                                                style={{
                                                    width: `${(item.total / maxSecretariat) * 100}%`,
                                                    backgroundColor:
                                                        colors[
                                                            i % colors.length
                                                        ],
                                                }}
                                            />
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-muted-foreground">
                            Sin derivaciones en este período.
                        </p>
                    )}
                </Panel>

                <Panel
                    title={`Ingresos por mes · ${filters.year}`}
                    icon={CalendarDays}
                >
                    <p className="mb-5 text-sm text-muted-foreground">
                        Vista del año completo, con el mismo filtro de
                        secretaría. Seleccioná un mes para ver su informe.
                    </p>
                    <ul className="grid min-w-0 grid-cols-3 gap-3 sm:grid-cols-6 xl:grid-cols-12">
                        {monthly.map((item) => (
                            <li key={item.month} className="min-w-0">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() =>
                                        filter({ month: item.month })
                                    }
                                    aria-label={`${months[item.month - 1]}: ${number(item.total)} solicitudes. Ver informe`}
                                    aria-pressed={filters.month === item.month}
                                    className={`grid min-h-36 w-full content-end gap-2 rounded-lg border p-2 text-center hover:bg-municipal-tint focus-visible:outline-2 focus-visible:outline-municipal-link ${filters.month === item.month ? 'border-municipal-link bg-municipal-tint' : 'border-transparent'}`}
                                >
                                    <strong className="text-lg tabular-nums">
                                        {number(item.total)}
                                    </strong>
                                    <span
                                        className="flex h-20 items-end justify-center"
                                        aria-hidden="true"
                                    >
                                        <span
                                            className="block w-full max-w-10 rounded-t bg-municipal-link"
                                            style={{
                                                height: `${(item.total / maxMonthly) * 100}%`,
                                                minHeight: item.total ? 4 : 0,
                                            }}
                                        />
                                    </span>
                                    <span className="text-sm">
                                        {months[item.month - 1].slice(0, 3)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Panel>
                <footer className="flex flex-wrap justify-between gap-2 border-t border-municipal-outline pt-4 text-sm text-muted-foreground">
                    <p>
                        Datos de Mesa de Entrada Virtual · Actualizado el{' '}
                        {updatedAt}
                    </p>
                    <p>
                        Una gestión cercana, al servicio de nuestra comunidad.
                    </p>
                </footer>
            </main>
        </>
    );
}

function Metric({
    label,
    value,
    total,
    icon: Icon,
    tone,
    primary = false,
}: {
    label: string;
    value: number;
    total: number;
    icon: LucideIcon;
    tone: 'navy' | 'green' | 'amber' | 'red' | 'violet';
    primary?: boolean;
}) {
    const tones = {
        navy: 'border-municipal-navy bg-municipal-navy text-white',
        green: 'border-green-200 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
        amber: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
        red: 'border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
        violet: 'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100',
    };

    return (
        <article
            className={`grid min-w-0 content-between gap-3 rounded-xl border p-4 ${tones[tone]} ${primary ? 'col-span-2 xl:col-span-1' : ''}`}
        >
            <Icon aria-hidden="true" className="size-7" />
            <h2 className="text-base leading-snug font-semibold">{label}</h2>
            <p className="text-4xl font-bold tabular-nums">{number(value)}</p>
            <p className="text-sm">{percentage(value, total)} del total</p>
        </article>
    );
}

function Panel({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}) {
    return (
        <section className="min-w-0 overflow-hidden rounded-xl border border-municipal-outline bg-card print:break-inside-avoid">
            <h2 className="flex items-center gap-2 bg-municipal-navy px-4 py-3 text-xl font-semibold text-white">
                <Icon className="size-6 shrink-0" aria-hidden="true" />
                {title}
            </h2>
            <div className="min-w-0 p-4 sm:p-5">{children}</div>
        </section>
    );
}

function Donut({ rows, total }: { rows: Count[]; total: number }) {
    const segments = rows.map((item, i) => {
        const length = total ? (item.total / total) * 100 : 0;
        const offset = total
            ? (rows.slice(0, i).reduce((sum, row) => sum + row.total, 0) /
                  total) *
              100
            : 0;
        const segment = (
            <circle
                key={`${i}-${item.label}`}
                cx="100"
                cy="100"
                r="76"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="30"
                pathLength="100"
                strokeDasharray={`${length} ${100 - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 100 100)"
            />
        );

        return segment;
    });

    return (
        <div className="relative mx-auto size-48 shrink-0">
            <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
                <circle
                    cx="100"
                    cy="100"
                    r="76"
                    fill="none"
                    stroke="#e4e9ef"
                    strokeWidth="30"
                />
                {segments}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-3xl tabular-nums">
                    {number(total)}
                </strong>
                <span className="text-sm text-muted-foreground">
                    solicitudes
                </span>
            </div>
        </div>
    );
}
