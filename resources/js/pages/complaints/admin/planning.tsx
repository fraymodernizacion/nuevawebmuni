import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckSquare, Eye, MapPin, Route, Square } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { store as storeWorkRoute } from '@/actions/App/Http/Controllers/Admin/RoutePlanningController';
import { show as showAdminComplaint } from '@/actions/App/Http/Controllers/Admin/ComplaintController';
import { show as showCrewComplaint } from '@/actions/App/Http/Controllers/CrewWorkController';
import { PendingComplaintsMap } from '@/components/complaints/pending-complaints-map';
import { statusBadgeClass, statusLabel } from '@/lib/complaint-labels';
import { planning } from '@/routes/admin/complaints';

const pendingStatuses = [
    'new',
    'under_review',
    'assigned',
    'in_progress',
    'needs_second_visit',
];

export default function RoutePlanning({
    zones,
    selectedZoneId,
    includeResolved,
    complaints,
    crews,
    canCreateRoutes,
    canManageComplaints,
    userPrimaryCrewId,
    workRoutes,
}: any) {
    const [selected, setSelected] = useState<number[]>([]);
    const selectedZone = zones.find((zone: any) => zone.id === selectedZoneId);
    const pendingComplaints = complaints.filter((complaint: any) =>
        pendingStatuses.includes(complaint.current_status),
    );
    const geolocatedCount = complaints.filter(
        (complaint: any) => complaint.latitude && complaint.longitude,
    ).length;
    const form = useForm({
        date: new Date().toISOString().slice(0, 10),
        operational_zone_id: selectedZoneId ? String(selectedZoneId) : '',
        crew_id: userPrimaryCrewId ? String(userPrimaryCrewId) : '',
        complaint_ids: [] as number[],
        notes: '',
    });

    useEffect(() => {
        const pendingComplaintIds = selectedZoneId
            ? complaints
                  .filter((complaint: any) =>
                      pendingStatuses.includes(complaint.current_status),
                  )
                  .map((complaint: any) => complaint.id)
            : [];

        setSelected(pendingComplaintIds);
        form.setData({
            ...form.data,
            operational_zone_id: selectedZoneId ? String(selectedZoneId) : '',
            crew_id:
                form.data.crew_id ||
                (userPrimaryCrewId ? String(userPrimaryCrewId) : ''),
            complaint_ids: pendingComplaintIds,
        });
    }, [selectedZoneId, complaints]);

    function toggle(id: number) {
        setSelected((current) => {
            const next = current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id];

            form.setData('complaint_ids', next);

            return next;
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            complaint_ids: selected,
            operational_zone_id:
                data.operational_zone_id ||
                (selectedZoneId ? String(selectedZoneId) : ''),
        }));
        form.post(storeWorkRoute.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                form.reset('crew_id', 'complaint_ids', 'notes');
            },
        });
    }

    function selectAllPending() {
        const pendingComplaintIds = pendingComplaints.map(
            (complaint: any) => complaint.id,
        );

        setSelected(pendingComplaintIds);
        form.setData('complaint_ids', pendingComplaintIds);
    }

    function clearSelection() {
        setSelected([]);
        form.setData('complaint_ids', []);
    }

    return (
        <>
            <Head title="Planificacion de recorridos" />
            <div className="grid gap-4 p-3 pb-28 sm:p-4 sm:pb-4 xl:grid-cols-[1fr_360px]">
                <main className="flex flex-col gap-4">
                    <section className="grid gap-3 rounded-lg border bg-card p-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-normal">
                                Planificacion de recorridos
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {selectedZone
                                    ? `Zona ${selectedZone.code} · ${selectedZone.localities.map((locality: any) => locality.name).join(' / ')}`
                                    : 'Elegir zona para armar un recorrido'}
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <SummaryPill
                                label="Pendientes"
                                value={pendingComplaints.length}
                            />
                            <SummaryPill
                                label="En mapa"
                                value={geolocatedCount}
                            />
                            <SummaryPill
                                label="Seleccionados"
                                value={selected.length}
                            />
                        </div>
                    </section>
                    <section className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                        {zones.map((zone: any) => (
                            <Link
                                key={zone.id}
                                href={planning({
                                    query: {
                                        zone: zone.id,
                                        resolved: includeResolved ? 1 : 0,
                                    },
                                })}
                                className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${
                                    selectedZoneId === zone.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card hover:bg-muted/50'
                                }`}
                            >
                                <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: zone.color }}
                                />
                                Zona {zone.code}
                                <span
                                    className={`rounded px-1.5 py-0.5 text-xs ${
                                        selectedZoneId === zone.id
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {zone.pending_count}
                                </span>
                            </Link>
                        ))}
                    </section>
                    <section className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={selectAllPending}
                                disabled={pendingComplaints.length === 0}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckSquare className="size-4" />
                                Seleccionar pendientes
                            </button>
                            <button
                                type="button"
                                onClick={clearSelection}
                                disabled={selected.length === 0}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Square className="size-4" />
                                Limpiar
                            </button>
                        </div>
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={includeResolved}
                                onChange={(event) =>
                                    router.get(planning.url(), {
                                        zone: selectedZoneId,
                                        resolved: event.target.checked ? 1 : 0,
                                    })
                                }
                            />
                            Mostrar resueltos
                        </label>
                    </section>
                    <PendingComplaintsMap
                        complaints={complaints.map((complaint: any) => ({
                            ...complaint,
                            can_open: true,
                        }))}
                        detailRoute={canManageComplaints ? 'admin' : 'crew'}
                        title="Mapa para planificar recorrido"
                    />
                    <section className="grid gap-3">
                        {complaints.map((complaint: any) => (
                            <article
                                key={complaint.id}
                                className={`grid gap-3 rounded-lg border bg-card p-4 shadow-sm ${
                                    selected.includes(complaint.id)
                                        ? 'ring-2 ring-primary/40'
                                        : ''
                                }`}
                            >
                                <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
                                    <button
                                        type="button"
                                        onClick={() => toggle(complaint.id)}
                                        className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold sm:w-32 ${
                                            selected.includes(complaint.id)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background'
                                        }`}
                                    >
                                        {selected.includes(complaint.id) ? (
                                            <CheckSquare className="size-4" />
                                        ) : (
                                            <Square className="size-4" />
                                        )}
                                        {selected.includes(complaint.id)
                                            ? 'Incluido'
                                            : 'Incluir'}
                                    </button>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {complaint.public_code}
                                        </p>
                                        <h3 className="text-lg font-semibold tracking-normal">
                                            {complaint.type.name}
                                        </h3>
                                        <p className="text-sm">
                                            {complaint.locality.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {complaint.location_reference ||
                                                complaint.street ||
                                                'Sin referencia cargada'}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span
                                                className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusBadgeClass(complaint.current_status)}`}
                                            >
                                                {statusLabel(
                                                    complaint.current_status,
                                                )}
                                            </span>
                                            {complaint.latitude &&
                                            complaint.longitude ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                                                    <MapPin className="size-3" />
                                                    Con ubicacion
                                                </span>
                                            ) : (
                                                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                    Sin ubicacion
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        href={complaintDetailHref(
                                            complaint.id,
                                            canManageComplaints,
                                        )}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold"
                                    >
                                        <Eye className="size-4" />
                                        Abrir
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </section>
                </main>
                <aside className="flex flex-col gap-4">
                    {canCreateRoutes ? (
                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-lg font-semibold">
                                Crear recorrido
                            </h2>
                            <form
                                id="route-planning-form"
                                onSubmit={submit}
                                className="mt-3 flex flex-col gap-3"
                            >
                                <input
                                    type="date"
                                    className="input"
                                    value={form.data.date}
                                    onChange={(event) =>
                                        form.setData('date', event.target.value)
                                    }
                                />
                                {form.errors.date && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.date}
                                    </p>
                                )}
                                <select
                                    className="input"
                                    value={form.data.operational_zone_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'operational_zone_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Zona</option>
                                    {zones.map((zone: any) => (
                                        <option key={zone.id} value={zone.id}>
                                            Zona {zone.code}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.operational_zone_id && (
                                    <p className="text-sm text-destructive">
                                        Debe seleccionar una zona.
                                    </p>
                                )}
                                <select
                                    className="input"
                                    value={form.data.crew_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'crew_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Cuadrilla</option>
                                    {crews.map((crew: any) => (
                                        <option key={crew.id} value={crew.id}>
                                            {crew.code} · {crew.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.crew_id && (
                                    <p className="text-sm text-destructive">
                                        Debe seleccionar una cuadrilla.
                                    </p>
                                )}
                                <textarea
                                    className="input min-h-24"
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Observaciones"
                                />
                                <p className="text-sm text-muted-foreground">
                                    {selected.length} reclamos seleccionados
                                </p>
                                {selectedZoneId && selected.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Al elegir la zona se incluyen
                                        automaticamente todos los reclamos
                                        pendientes visibles.
                                    </p>
                                )}
                                {form.errors.complaint_ids && (
                                    <p className="text-sm text-destructive">
                                        Seleccione al menos un reclamo para el
                                        recorrido.
                                    </p>
                                )}
                                <button
                                    disabled={
                                        form.processing || selected.length === 0
                                    }
                                    className="min-h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing
                                        ? 'Creando...'
                                        : 'Crear recorrido'}
                                </button>
                            </form>
                        </section>
                    ) : (
                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-lg font-semibold">
                                Crear recorrido
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                La creacion de recorridos queda reservada para
                                el jefe de cuadrilla.
                            </p>
                        </section>
                    )}
                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="text-lg font-semibold">
                            Ultimos recorridos
                        </h2>
                        <div className="mt-3 flex flex-col gap-2">
                            {workRoutes.map((route: any) => (
                                <p key={route.id} className="text-sm">
                                    {route.date} · Zona{' '}
                                    {route.operational_zone.code} ·{' '}
                                    {route.crew.code}
                                </p>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
            {canCreateRoutes && (
                <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_auto] items-center gap-3 border-t bg-background/95 p-3 shadow-lg backdrop-blur sm:hidden">
                    <div>
                        <p className="text-sm font-semibold">
                            {selected.length} seleccionados
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {selectedZone
                                ? `Zona ${selectedZone.code}`
                                : 'Seleccione una zona'}
                        </p>
                    </div>
                    <button
                        type="submit"
                        form="route-planning-form"
                        disabled={form.processing || selected.length === 0}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Route className="size-4" />
                        Crear
                    </button>
                </nav>
            )}
        </>
    );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md bg-muted px-2 py-2">
            <p className="text-lg font-semibold tracking-normal">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function complaintDetailHref(id: number, canManageComplaints: boolean) {
    return canManageComplaints ? showAdminComplaint(id) : showCrewComplaint(id);
}
