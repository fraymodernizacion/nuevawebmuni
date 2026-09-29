import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
    const [fullScreen, setFullScreen] = useState(false);
    const position = useMemo<[number, number]>(
        () => [Number(latitude), Number(longitude)],
        [latitude, longitude],
    );

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
    }, [fullScreen, position]);

    useEffect(() => {
        if (!active || !mapRef.current) {
            return;
        }

        window.setTimeout(() => {
            mapRef.current?.invalidateSize();
            mapRef.current?.setView(position, 17);
            markerRef.current?.setLatLng(position);
        }, 120);
    }, [active, position]);

    useEffect(() => {
        const mapElement = elementRef.current;

        if (!mapElement) {
            return;
        }

        let frame = 0;
        const resizeMap = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() =>
                mapRef.current?.invalidateSize(),
            );
        };
        const observer = window.ResizeObserver
            ? new ResizeObserver(resizeMap)
            : null;
        observer?.observe(mapElement);
        window.addEventListener('resize', resizeMap);

        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', resizeMap);
            window.cancelAnimationFrame(frame);
        };
    }, [fullScreen]);

    useEffect(() => {
        if (!fullScreen) {
            return;
        }

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setFullScreen(false);
            }
        };
        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [fullScreen]);

    const mapContent = (
        <div
            className={`overflow-hidden rounded-md border bg-background ${fullScreen ? 'fixed inset-0 z-[2000] flex h-dvh flex-col p-3' : ''}`}
        >
            <button
                type="button"
                onClick={() => setFullScreen(!fullScreen)}
                className="m-2 inline-flex min-h-10 items-center gap-2 self-end rounded-md border bg-background px-3 text-sm font-semibold"
            >
                {fullScreen ? (
                    <Minimize2 className="size-4" />
                ) : (
                    <Maximize2 className="size-4" />
                )}
                {fullScreen ? 'Cerrar pantalla completa' : 'Pantalla completa'}
            </button>
            <div
                ref={elementRef}
                className={`${fullScreen ? 'min-h-0 flex-1' : className} w-full`}
            />
        </div>
    );

    return fullScreen ? createPortal(mapContent, document.body) : mapContent;
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
