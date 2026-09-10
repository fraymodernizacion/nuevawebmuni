import { useEffect, useRef } from 'react';

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

export function InteractiveLocationMap({
    latitude,
    longitude,
    onChange,
}: {
    latitude?: string;
    longitude?: string;
    onChange: (latitude: string, longitude: string) => void;
}) {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRef = useRef<LeafletMarker | null>(null);

    useEffect(() => {
        let mounted = true;

        loadLeaflet().then(() => {
            if (
                !mounted ||
                !elementRef.current ||
                !window.L ||
                mapRef.current
            ) {
                return;
            }

            const initialPosition = parsePosition(latitude, longitude);
            const map = window.L.map(elementRef.current, {
                center: initialPosition,
                zoom: latitude && longitude ? 17 : 12,
                zoomControl: true,
            });

            window.L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution: 'OpenStreetMap',
                    maxZoom: 19,
                },
            ).addTo(map);

            const marker = window.L.marker(initialPosition, {
                draggable: true,
            }).addTo(map);

            map.on('click', (event) => {
                updateMarker(event.latlng.lat, event.latlng.lng);
            });

            marker.on('dragend', () => {
                const position = marker.getLatLng();
                onChange(position.lat.toFixed(7), position.lng.toFixed(7));
            });

            mapRef.current = map;
            markerRef.current = marker;
        });

        return () => {
            mounted = false;
            mapRef.current?.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !markerRef.current || !latitude || !longitude) {
            return;
        }

        const position = parsePosition(latitude, longitude);
        markerRef.current.setLatLng(position);
        mapRef.current.setView(position, 17);
    }, [latitude, longitude]);

    function updateMarker(nextLatitude: number, nextLongitude: number) {
        const position: [number, number] = [nextLatitude, nextLongitude];

        markerRef.current?.setLatLng(position);
        mapRef.current?.setView(position, 17);
        onChange(nextLatitude.toFixed(7), nextLongitude.toFixed(7));
    }

    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div ref={elementRef} className="h-80 w-full touch-pan-y" />
        </div>
    );
}

function parsePosition(
    latitude?: string,
    longitude?: string,
): [number, number] {
    if (!latitude?.trim() || !longitude?.trim()) {
        return defaultPosition;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude)) {
        return [parsedLatitude, parsedLongitude];
    }

    return defaultPosition;
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
