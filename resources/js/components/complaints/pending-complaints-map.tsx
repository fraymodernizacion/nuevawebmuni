import { Navigation } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { show as showAdminComplaint } from '@/actions/App/Http/Controllers/Admin/ComplaintController';
import { show as showCrewComplaint } from '@/actions/App/Http/Controllers/CrewWorkController';

type PendingComplaint = {
    id: number;
    public_code: string;
    current_status: string;
    created_at?: string | null;
    priority?: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    location_reference?: string | null;
    street?: string | null;
    type: {
        name: string;
    };
    locality: {
        name: string;
    };
    operational_zone?: {
        code: string;
        color?: string | null;
    } | null;
    assigned_crew_id?: number | null;
    can_open?: boolean;
};

type LeafletNamespace = {
    map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap;
    tileLayer: (
        url: string,
        options: Record<string, unknown>,
    ) => { addTo: (map: LeafletMap) => unknown };
    marker: (
        position: [number, number],
        options?: Record<string, unknown>,
    ) => LeafletMarker;
    divIcon: (options: Record<string, unknown>) => unknown;
    featureGroup: (markers: LeafletMarker[]) => {
        getBounds: () => unknown;
    };
};

type LeafletMap = {
    on: (event: string, callback: (event: LeafletClickEvent) => void) => void;
    setView: (position: [number, number], zoom?: number) => void;
    fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
    invalidateSize?: () => void;
    remove: () => void;
};

type LeafletMarker = {
    addTo: (map: LeafletMap) => LeafletMarker;
    bindPopup: (content: string) => LeafletMarker;
    on: (event: string, callback: () => void) => void;
    setLatLng: (position: [number, number]) => void;
    getLatLng: () => { lat: number; lng: number };
};

type LeafletClickEvent = {
    latlng: { lat: number; lng: number };
};

declare global {
    interface Window {
        L?: LeafletNamespace;
        complaintLeafletLoading?: Promise<void>;
    }
}

const defaultPosition: [number, number] = [-28.383, -65.7];

export function PendingComplaintsMap({
    complaints,
    detailRoute = 'crew',
    title = 'Mapa de reclamos pendientes',
}: {
    complaints: PendingComplaint[];
    detailRoute?: 'admin' | 'crew';
    title?: string;
}) {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const operatorMarkerRef = useRef<LeafletMarker | null>(null);
    const [locationMessage, setLocationMessage] = useState('');

    useEffect(() => {
        let mounted = true;
        let frameId = 0;

        loadLeaflet().then(() => {
            if (
                !mounted ||
                !elementRef.current ||
                !window.L ||
                mapRef.current
            ) {
                return;
            }

            const map = window.L.map(elementRef.current, {
                center: defaultPosition,
                zoom: 12,
                zoomControl: true,
            });

            window.L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution: 'OpenStreetMap',
                    maxZoom: 19,
                },
            ).addTo(map);

            mapRef.current = map;

            const markers = complaints
                .map((complaint) => {
                    const latitude = Number(complaint.latitude);
                    const longitude = Number(complaint.longitude);

                    if (
                        !Number.isFinite(latitude) ||
                        !Number.isFinite(longitude)
                    ) {
                        return null;
                    }

                    return window
                        .L!.marker([latitude, longitude], {
                            icon: window.L!.divIcon({
                                className: '',
                                html: `<span style="background:${escapeHtml(complaint.operational_zone?.color || '#2563eb')}" class="block h-4 w-4 rounded-full border-2 border-white shadow"></span>`,
                                iconSize: [16, 16],
                                iconAnchor: [8, 8],
                            }),
                        })
                        .addTo(map)
                        .bindPopup(popupContent(complaint, detailRoute));
                })
                .filter((marker): marker is LeafletMarker => marker !== null);

            frameId = window.requestAnimationFrame(() => {
                if (!mounted || mapRef.current !== map) {
                    return;
                }

                map.invalidateSize?.();

                if (markers.length > 0 && window.L) {
                    try {
                        map.fitBounds(
                            window.L.featureGroup(markers).getBounds(),
                            {
                                padding: [24, 24],
                                maxZoom: 15,
                            },
                        );
                    } catch {
                        map.setView(defaultPosition, 12);
                    }
                }
            });
        });

        return () => {
            mounted = false;
            window.cancelAnimationFrame(frameId);
            mapRef.current?.remove();
            mapRef.current = null;
            operatorMarkerRef.current = null;
        };
    }, [complaints]);

    const visibleComplaints = complaints.filter(
        (complaint) =>
            Number.isFinite(Number(complaint.latitude)) &&
            Number.isFinite(Number(complaint.longitude)),
    );

    return (
        <section className="grid gap-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {visibleComplaints.length} reclamos con ubicacion
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={showOperatorLocation}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                    >
                        <Navigation className="size-4" />
                        Mostrar mi ubicacion
                    </button>
                    <div className="flex flex-wrap gap-2">
                        {complaints.slice(0, 4).map((complaint) => (
                            <span
                                key={complaint.id}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                            >
                                <span
                                    className="size-2 rounded-full"
                                    style={{
                                        backgroundColor:
                                            complaint.operational_zone?.color ||
                                            '#2563eb',
                                    }}
                                />
                                Zona {complaint.operational_zone?.code || '-'}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            {locationMessage && (
                <p className="text-sm text-muted-foreground">
                    {locationMessage}
                </p>
            )}
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div ref={elementRef} className="h-96 w-full touch-pan-y" />
            </div>
            {visibleComplaints.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No hay reclamos pendientes con geolocalizacion cargada.
                </p>
            )}
        </section>
    );

    function showOperatorLocation() {
        if (!navigator.geolocation) {
            setLocationMessage(
                'Este navegador no permite tomar la ubicacion actual.',
            );

            return;
        }

        if (!window.isSecureContext) {
            setLocationMessage(
                'El navegador bloqueo la ubicacion porque la pagina no esta en un contexto seguro.',
            );

            return;
        }

        setLocationMessage('Buscando ubicacion actual...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                markOperatorLocation(latitude, longitude);
                setLocationMessage('Ubicacion actual marcada en el mapa.');
            },
            (error) => setLocationMessage(geolocationErrorMessage(error)),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
    }

    function markOperatorLocation(latitude: number, longitude: number) {
        if (!window.L || !mapRef.current) {
            return;
        }

        const position: [number, number] = [latitude, longitude];

        if (operatorMarkerRef.current) {
            operatorMarkerRef.current.setLatLng(position);
        } else {
            operatorMarkerRef.current = window.L.marker(position, {
                icon: window.L.divIcon({
                    className: '',
                    html: '<span class="relative flex size-6"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60"></span><span class="relative inline-flex size-6 rounded-full border-2 border-white bg-sky-600 shadow"></span></span>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                }),
            })
                .addTo(mapRef.current)
                .bindPopup('Tu ubicacion actual');
        }

        mapRef.current.setView(position, 16);
    }
}

function detailHref(id: number, detailRoute: 'admin' | 'crew') {
    return detailRoute === 'admin'
        ? showAdminComplaint.url(id)
        : showCrewComplaint.url(id);
}

function popupContent(
    complaint: PendingComplaint,
    detailRoute: 'admin' | 'crew',
): string {
    const location = complaint.location_reference || complaint.street || '';
    const mapsUrl = googleMapsDirectionsUrl(
        complaint.latitude,
        complaint.longitude,
    );
    const openUrl = detailHref(complaint.id, detailRoute);

    return `
        <div style="min-width: 210px">
            <strong>${escapeHtml(complaint.type.name)}</strong>
            <p style="margin: 4px 0">${escapeHtml(complaint.locality.name)}</p>
            <p style="margin: 4px 0">${escapeHtml(location || 'Sin referencia cargada')}</p>
            ${complaint.created_at ? `<p style="margin: 4px 0; color: #71717a">${escapeHtml(relativeTime(complaint.created_at))}</p>` : ''}
            <div style="display: flex; gap: 10px; margin-top: 8px">
                <a href="${openUrl}">Abrir</a>
                <a href="${mapsUrl}" target="_blank" rel="noreferrer">Como llegar</a>
            </div>
        </div>
    `;
}

function relativeTime(value: string): string {
    const createdAt = new Date(value).getTime();
    const diffMs = Date.now() - createdAt;
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffDays > 0) {
        return diffDays === 1 ? 'Hace 1 dia' : `Hace ${diffDays} dias`;
    }

    return 'Ingresado hoy';
}

function googleMapsDirectionsUrl(
    latitude: string | number | null,
    longitude: string | number | null,
): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(String(latitude))},${encodeURIComponent(String(longitude))}`;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function geolocationErrorMessage(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
        return 'El navegador no tiene permiso para usar tu ubicacion.';
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
        return 'No pudimos detectar la ubicacion actual.';
    }

    if (error.code === error.TIMEOUT) {
        return 'La ubicacion tardo demasiado en responder. Intenta de nuevo.';
    }

    return 'No pudimos tomar la ubicacion actual.';
}

function loadLeaflet(): Promise<void> {
    if (window.L) {
        return Promise.resolve();
    }

    if (window.complaintLeafletLoading) {
        return window.complaintLeafletLoading;
    }

    window.complaintLeafletLoading = new Promise((resolve, reject) => {
        if (!document.querySelector('link[data-complaint-leaflet]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.dataset.complaintLeaflet = 'true';
            document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error('Leaflet could not be loaded.'));
        document.body.appendChild(script);
    });

    return window.complaintLeafletLoading;
}
