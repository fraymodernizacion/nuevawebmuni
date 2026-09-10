import { Head, Link, useForm } from '@inertiajs/react';
import { Clock4, Eye, List, Map, MapPin, Navigation } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PendingComplaintsMap } from '@/components/complaints/pending-complaints-map';
import {
    finish,
    show,
} from '@/actions/App/Http/Controllers/CrewWorkController';
import {
    statusBadgeClass,
    statusLabel,
    workRouteStatusLabel,
} from '@/lib/complaint-labels';
import { index as crewWorkIndex } from '@/routes/crew/work';

export default function CrewWorkIndex({
    zones,
    selectedZoneId,
    complaints,
    pendingMapComplaints,
    todayRoute,
    summary,
    routePlanningEnabled,
    canManageComplaintOperations,
}: any) {
    const finishForm = useForm({});
    const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
    const [sortMode, setSortMode] = useState('oldest');
    const [locationMessage, setLocationMessage] = useState('');
    const [operatorLocation, setOperatorLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const showTodayRoute = routePlanningEnabled && todayRoute;
    const routeIsFinished = showTodayRoute && todayRoute.status === 'finished';
    const sortedComplaints = useMemo(
        () => sortComplaints(complaints, sortMode, operatorLocation),
        [complaints, sortMode, operatorLocation],
    );
    const assignedPendingTotal = zones.reduce(
        (total: number, zone: any) => total + zone.assigned_pending_count,
        0,
    );

    return (
        <>
            <Head title="Mis trabajos" />
            <div className="flex flex-col gap-4 p-3 pb-24 sm:p-4 sm:pb-4">
                <header className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm">
                    <h1 className="text-2xl font-semibold tracking-normal">
                        {canManageComplaintOperations
                            ? 'Operativo de reclamos'
                            : 'Mis trabajos'}
                    </h1>
                    {showTodayRoute && (
                        <p className="text-sm text-muted-foreground">
                            Recorrido de hoy · Zona{' '}
                            {todayRoute.operational_zone.code}
                        </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <SummaryPill
                            label="Pendientes"
                            value={summary.pending}
                        />
                        <SummaryPill
                            label="En relevamiento"
                            value={summary.in_progress}
                        />
                        <SummaryPill
                            label="Resueltos hoy"
                            value={summary.resolved_today}
                        />
                    </div>
                </header>
                <section className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                    <Link
                        href={crewWorkIndex()}
                        className={`inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-medium ${
                            selectedZoneId
                                ? 'bg-card hover:bg-muted/50'
                                : 'bg-primary text-primary-foreground'
                        }`}
                    >
                        Todos ({assignedPendingTotal})
                    </Link>
                    {zones.map((zone: any) => (
                        <Link
                            key={zone.id}
                            href={crewWorkIndex({
                                query: {
                                    zone: zone.id,
                                },
                            })}
                            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
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
                                {zone.assigned_pending_count}
                            </span>
                        </Link>
                    ))}
                </section>
                <section className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[auto_1fr] sm:items-center">
                    <div className="grid grid-cols-2 rounded-md bg-muted p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode('map')}
                            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-3 text-sm font-semibold ${
                                viewMode === 'map'
                                    ? 'bg-background shadow-sm'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <Map className="size-4" /> Mapa
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-3 text-sm font-semibold ${
                                viewMode === 'list'
                                    ? 'bg-background shadow-sm'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <List className="size-4" /> Lista
                        </button>
                    </div>
                    <label className="grid gap-1 text-sm font-medium sm:justify-self-end">
                        Ordenar por
                        <select
                            className="input min-w-52"
                            value={sortMode}
                            onChange={(event) =>
                                changeSortMode(event.target.value)
                            }
                        >
                            <option value="closest">Mas cercanos</option>
                            <option value="oldest">Mas antiguos</option>
                            <option value="recent">Mas recientes</option>
                            <option value="urgent">Urgentes</option>
                        </select>
                    </label>
                    {locationMessage && (
                        <p className="text-sm text-muted-foreground sm:col-span-2">
                            {locationMessage}
                        </p>
                    )}
                </section>
                {showTodayRoute && (
                    <section className="sticky top-2 z-10 grid gap-3 rounded-lg border bg-card p-4 shadow-sm sm:static sm:grid-cols-[1fr_auto] sm:items-center sm:shadow-none">
                        <div>
                            <h2 className="font-semibold">Recorrido de hoy</h2>
                            <p className="text-sm text-muted-foreground">
                                {todayRoute.complaints.length} trabajos ·{' '}
                                {workRouteStatusLabel(todayRoute.status)}
                            </p>
                        </div>
                        {!routeIsFinished && (
                            <button
                                type="button"
                                disabled={finishForm.processing}
                                onClick={() =>
                                    finishForm.patch(
                                        finish.url(todayRoute.id),
                                        {
                                            preserveScroll: true,
                                        },
                                    )
                                }
                                className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {finishForm.processing
                                    ? 'Finalizando...'
                                    : 'Finalizar recorrido'}
                            </button>
                        )}
                    </section>
                )}
                {viewMode === 'map' && (
                    <PendingComplaintsMap
                        complaints={pendingMapComplaints}
                        title="Trabajos pendientes en mapa"
                    />
                )}
                {viewMode === 'list' && (
                    <section className="grid gap-3">
                        {complaints.length === 0 && (
                            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                                No hay trabajos pendientes para la zona
                                seleccionada.
                            </div>
                        )}
                        {sortedComplaints.map((complaint: any) => (
                            <article
                                key={complaint.id}
                                className="rounded-lg border bg-card p-4 shadow-sm"
                            >
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                                    <div className="min-w-0">
                                        <h2 className="mt-1 text-lg font-semibold tracking-normal">
                                            {complaint.type.name}
                                        </h2>
                                        <div className="mt-2 grid gap-1 text-sm">
                                            <p>
                                                <span className="font-medium">
                                                    Localidad:
                                                </span>{' '}
                                                {complaint.locality.name}
                                            </p>
                                            <p className="text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    Referencia:
                                                </span>{' '}
                                                {complaint.location_reference ||
                                                    complaint.street ||
                                                    'Sin referencia cargada'}
                                            </p>
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <Clock4 className="size-4" />
                                                {formatRelativeTime(
                                                    complaint.created_at,
                                                )}
                                                {distanceLabel(
                                                    complaint,
                                                    operatorLocation,
                                                ) && (
                                                    <span>
                                                        ·{' '}
                                                        {distanceLabel(
                                                            complaint,
                                                            operatorLocation,
                                                        )}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {complaint.public_code} ·
                                                Ingreso:{' '}
                                                {formatDateTime(
                                                    complaint.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`w-fit shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${statusBadgeClass(complaint.current_status)}`}
                                    >
                                        {statusLabel(complaint.current_status)}
                                    </span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <Link
                                        href={show.url(complaint.id)}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                                    >
                                        <Eye className="size-4" />
                                        Abrir
                                    </Link>
                                    {complaint.latitude &&
                                    complaint.longitude ? (
                                        <a
                                            href={mapsUrl(
                                                complaint.latitude,
                                                complaint.longitude,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold"
                                        >
                                            <MapPin className="size-4" />
                                            Como llegar
                                        </a>
                                    ) : (
                                        <span className="inline-flex min-h-12 items-center justify-center rounded-md border px-3 text-sm font-medium text-muted-foreground">
                                            Sin mapa
                                        </span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </>
    );

    function changeSortMode(nextSortMode: string) {
        setSortMode(nextSortMode);

        if (nextSortMode === 'closest' && !operatorLocation) {
            requestOperatorLocation();
        }
    }

    function requestOperatorLocation() {
        if (!navigator.geolocation) {
            setLocationMessage('Este navegador no permite tomar tu ubicacion.');

            return;
        }

        if (!window.isSecureContext) {
            setLocationMessage(
                'El navegador bloqueo la ubicacion porque la pagina no esta en un contexto seguro.',
            );

            return;
        }

        setLocationMessage(
            'Buscando tu ubicacion para ordenar por cercania...',
        );

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setOperatorLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationMessage('Trabajos ordenados por cercania.');
            },
            () => {
                setLocationMessage(
                    'No pudimos tomar tu ubicacion. Mantenemos el orden por antiguedad.',
                );
                setSortMode('oldest');
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
    }
}

function SummaryPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md bg-muted px-2 py-2">
            <p className="text-lg font-semibold tracking-normal">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatRelativeTime(value: string) {
    const createdAt = new Date(value).getTime();
    const diffMs = Date.now() - createdAt;
    const diffDays = Math.floor(diffMs / 86_400_000);
    const diffHours = Math.floor(diffMs / 3_600_000);

    if (diffDays > 0) {
        return diffDays === 1 ? 'Hace 1 dia' : `Hace ${diffDays} dias`;
    }

    if (diffHours > 0) {
        return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
    }

    return 'Ingresado hoy';
}

function mapsUrl(latitude: string | number, longitude: string | number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function sortComplaints(
    complaints: any[],
    sortMode: string,
    operatorLocation: { latitude: number; longitude: number } | null,
) {
    return [...complaints].sort((first, second) => {
        if (sortMode === 'closest' && operatorLocation) {
            return (
                distanceInMeters(first, operatorLocation) -
                distanceInMeters(second, operatorLocation)
            );
        }

        if (sortMode === 'recent') {
            return (
                new Date(second.created_at).getTime() -
                new Date(first.created_at).getTime()
            );
        }

        if (sortMode === 'urgent') {
            return (
                priorityWeight(second.priority) - priorityWeight(first.priority)
            );
        }

        return (
            new Date(first.created_at).getTime() -
            new Date(second.created_at).getTime()
        );
    });
}

function priorityWeight(priority?: string | null) {
    return (
        {
            urgent: 4,
            high: 3,
            normal: 2,
            low: 1,
        }[priority ?? 'normal'] ?? 2
    );
}

function distanceLabel(
    complaint: any,
    operatorLocation: { latitude: number; longitude: number } | null,
) {
    if (!operatorLocation || !complaint.latitude || !complaint.longitude) {
        return null;
    }

    const distance = distanceInMeters(complaint, operatorLocation);

    if (!Number.isFinite(distance)) {
        return null;
    }

    if (distance < 1000) {
        return `A ${Math.round(distance)} m`;
    }

    return `A ${(distance / 1000).toLocaleString('es-AR', {
        maximumFractionDigits: 1,
    })} km`;
}

function distanceInMeters(
    complaint: any,
    operatorLocation: { latitude: number; longitude: number },
) {
    const latitude = Number(complaint.latitude);
    const longitude = Number(complaint.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return Number.POSITIVE_INFINITY;
    }

    const earthRadiusInMeters = 6_371_000;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const deltaLatitude = toRadians(latitude - operatorLocation.latitude);
    const deltaLongitude = toRadians(longitude - operatorLocation.longitude);
    const startLatitude = toRadians(operatorLocation.latitude);
    const endLatitude = toRadians(latitude);
    const haversine =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(startLatitude) *
            Math.cos(endLatitude) *
            Math.sin(deltaLongitude / 2) ** 2;

    return (
        2 *
        earthRadiusInMeters *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    );
}
