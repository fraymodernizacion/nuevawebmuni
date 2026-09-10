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
};

type LeafletMap = {
    setView: (position: [number, number], zoom?: number) => void;
    invalidateSize: () => void;
    remove: () => void;
};

type LeafletMarker = {
    addTo: (map: LeafletMap) => LeafletMarker;
    setLatLng: (position: [number, number]) => void;
};

export function StaticLocationMap({
    latitude,
    longitude,
    active = true,
    className = 'h-96',
}: {
    latitude: string | number;
    longitude: string | number;
    active?: boolean;
    className?: string;
}) {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRef = useRef<LeafletMarker | null>(null);
    const position: [number, number] = [Number(latitude), Number(longitude)];

    useEffect(() => {
        let mounted = true;

        loadLeaflet().then(() => {
            const leafletWindow = window as unknown as {
                L?: LeafletNamespace;
            };

            if (
                !mounted ||
                !elementRef.current ||
                !leafletWindow.L ||
                mapRef.current ||
                !Number.isFinite(position[0]) ||
                !Number.isFinite(position[1])
            ) {
                return;
            }

            const map = leafletWindow.L.map(elementRef.current, {
                center: position,
                zoom: 17,
                zoomControl: true,
            });

            leafletWindow.L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution: 'OpenStreetMap',
                    maxZoom: 19,
                },
            ).addTo(map);

            markerRef.current = leafletWindow.L.marker(position).addTo(map);
            mapRef.current = map;
            setTimeout(() => map.invalidateSize(), 80);
        });

        return () => {
            mounted = false;
            mapRef.current?.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!active || !mapRef.current) {
            return;
        }

        window.setTimeout(() => {
            mapRef.current?.invalidateSize();
            mapRef.current?.setView(position, 17);
            markerRef.current?.setLatLng(position);
        }, 120);
    }, [active, latitude, longitude]);

    return (
        <div className="overflow-hidden rounded-md border">
            <div ref={elementRef} className={`${className} w-full`} />
        </div>
    );
}

function loadLeaflet(): Promise<void> {
    const leafletWindow = window as unknown as {
        L?: LeafletNamespace;
        complaintLeafletLoading?: Promise<void>;
    };

    if (leafletWindow.L) {
        return Promise.resolve();
    }

    if (leafletWindow.complaintLeafletLoading) {
        return leafletWindow.complaintLeafletLoading;
    }

    leafletWindow.complaintLeafletLoading = new Promise((resolve, reject) => {
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

    return leafletWindow.complaintLeafletLoading;
}
