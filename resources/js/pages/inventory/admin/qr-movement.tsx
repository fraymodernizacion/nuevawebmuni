import { Head, Link, useForm } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import {
    ArrowDownCircle,
    Camera,
    CircleStop,
    ExternalLink,
    PackageCheck,
    RefreshCw,
    ShieldCheck,
    TriangleAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type InventoryItem = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    unit: string;
    current_stock: number;
    minimum_stock: number;
    low_stock: boolean;
    quick_url: string;
    movement_store_url: string;
};

type ScanResult = {
    rawValue: string;
    parsedCode: string;
    scannedAt: string;
    matched: boolean;
};

type Props = {
    inventoryUrl: string;
    items: InventoryItem[];
    permissions: {
        can_exit: boolean;
    };
};

export default function InventoryQrMovement({
    inventoryUrl,
    items,
    permissions,
}: Props) {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [scannerStatus, setScannerStatus] = useState(
        'Inicia la camara para escanear una etiqueta del deposito.',
    );
    const [scannerError, setScannerError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [history, setHistory] = useState<ScanResult[]>([]);
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const scannerControlsRef = useRef<IScannerControls | null>(null);
    const scannerStreamRef = useRef<MediaStream | null>(null);
    const lastRawValueRef = useRef('');
    const lastScannedAtRef = useRef(0);
    const selectedItem = useMemo(
        () =>
            items.find((item) => codesMatch(item.code, selectedItemCode)) ??
            null,
        [items, selectedItemCode],
    );
    const form = useForm({
        movement_type: 'exit',
        quantity: '1',
        reference: '',
        reason: '',
    });

    const stopScanner = useCallback((updateState = true) => {
        scannerControlsRef.current?.stop();
        scannerControlsRef.current = null;
        stopScannerStream(scannerStreamRef.current);
        scannerStreamRef.current = null;

        const videoElement = videoRef.current;

        if (videoElement) {
            videoElement.srcObject = null;
        }

        if (updateState) {
            setIsScanning(false);
        }
    }, []);

    const loadDevices = useCallback(async () => {
        if (!isCameraSupported()) {
            setScannerError(
                'Este navegador no expone acceso a camara. Proba con Chrome, Edge o Safari actualizado.',
            );

            return;
        }

        try {
            const nextDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = nextDevices.filter(
                (device) => device.kind === 'videoinput',
            );

            setDevices(videoDevices);
            setSelectedDeviceId((currentDeviceId) => {
                if (
                    currentDeviceId &&
                    videoDevices.some(
                        (device) => device.deviceId === currentDeviceId,
                    )
                ) {
                    return currentDeviceId;
                }

                return videoDevices.at(0)?.deviceId ?? '';
            });

            if (videoDevices.length === 0) {
                setScannerStatus('No se encontraron camaras disponibles.');
            }
        } catch (error) {
            setScannerError(cameraErrorMessage(error));
        }
    }, []);

    useEffect(() => {
        return () => stopScanner(false);
    }, [stopScanner]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadDevices();
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [loadDevices]);

    async function startScanner() {
        if (!isCameraSupported()) {
            setScannerError(
                'Este navegador no permite usar la camara desde esta pagina.',
            );

            return;
        }

        if (!isLocalOrSecureContext()) {
            setScannerError(
                'La camara requiere HTTPS o localhost. Abri el sitio desde localhost o desde una URL segura.',
            );

            return;
        }

        const videoElement = videoRef.current;

        if (!videoElement) {
            setScannerError('El visor de camara todavia no esta listo.');

            return;
        }

        stopScanner();
        setScannerError('');
        setScannerStatus('Solicitando permiso de camara...');

        try {
            const stream = await openCameraStream(selectedDeviceId);
            const codeReader = new BrowserQRCodeReader(undefined, {
                delayBetweenScanAttempts: 300,
            });

            scannerStreamRef.current = stream;
            videoElement.srcObject = stream;
            await videoElement.play();

            const controls = await codeReader.decodeFromStream(
                stream,
                videoElement,
                (result) => {
                    if (!result) {
                        return;
                    }

                    registerScan(result.getText());
                },
            );

            scannerControlsRef.current = controls;
            setIsScanning(true);
            setScannerStatus(
                'Camara activa. Apunta a una etiqueta QR del deposito.',
            );
            await loadDevices();
        } catch (error) {
            stopScanner();
            setScannerError(cameraErrorMessage(error));
            setScannerStatus('No se pudo iniciar el escaner.');
        }
    }

    function registerScan(rawValue: string) {
        const now = Date.now();

        if (
            rawValue === lastRawValueRef.current &&
            now - lastScannedAtRef.current < 1200
        ) {
            return;
        }

        lastRawValueRef.current = rawValue;
        lastScannedAtRef.current = now;

        const parsedCode = parseQrCode(rawValue);
        const matched = items.some((item) => codesMatch(item.code, parsedCode));
        const scanResult = {
            rawValue,
            parsedCode,
            scannedAt: new Date().toISOString(),
            matched,
        };

        setLastResult(scanResult);
        setHistory((currentHistory) =>
            [scanResult, ...currentHistory].slice(0, 8),
        );
        setSelectedItemCode(parsedCode);
        setScannerStatus(
            matched
                ? 'QR detectado. Revisa cantidad y confirma la salida provisoria.'
                : 'QR leido, pero no coincide con un insumo activo del inventario.',
        );
    }

    function selectManualCode(code: string) {
        setSelectedItemCode(code);
        setLastResult(null);
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (!selectedItem) {
            return;
        }

        form.post(selectedItem.movement_store_url, {
            preserveScroll: true,
        });
    }

    function updateQuantity(nextQuantity: number) {
        form.setData('quantity', Math.max(1, nextQuantity).toString());
    }

    const quantity = Number(form.data.quantity || 0);
    const stockAfterExit = selectedItem
        ? selectedItem.current_stock - quantity
        : 0;
    const willBeNegative =
        selectedItem !== null && quantity > 0 && stockAfterExit < 0;

    return (
        <>
            <Head title="Movimiento QR de deposito" />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Inventario
                        </p>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Movimiento QR de deposito
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Escanea una etiqueta, verifica el insumo y confirma
                            la salida provisoria desde deposito.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={inventoryUrl}>Volver a inventario</Link>
                    </Button>
                </header>

                <Alert>
                    <ShieldCheck className="size-4" />
                    <AlertTitle>Confirmacion requerida</AlertTitle>
                    <AlertDescription>
                        Escanear solo identifica el insumo. El stock cambia
                        recien cuando confirmas la salida provisoria.
                    </AlertDescription>
                </Alert>

                <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Escaner</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="overflow-hidden rounded-lg border bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="aspect-video w-full object-cover"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="camera-device">
                                    Dispositivo
                                </Label>
                                <select
                                    id="camera-device"
                                    className="input min-h-11"
                                    value={selectedDeviceId}
                                    disabled={isScanning}
                                    onChange={(event) =>
                                        setSelectedDeviceId(event.target.value)
                                    }
                                >
                                    {devices.length > 0 ? (
                                        devices.map((device, index) => (
                                            <option
                                                key={device.deviceId}
                                                value={device.deviceId}
                                            >
                                                {device.label ||
                                                    `Camara ${index + 1}`}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">
                                            Sin camaras detectadas
                                        </option>
                                    )}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    type="button"
                                    className="min-h-11"
                                    disabled={isScanning}
                                    onClick={startScanner}
                                >
                                    <Camera className="size-4" />
                                    Escanear QR
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11"
                                    disabled={!isScanning}
                                    onClick={() => stopScanner()}
                                >
                                    <CircleStop className="size-4" />
                                    Detener
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-h-11"
                                    onClick={() => void loadDevices()}
                                >
                                    <RefreshCw className="size-4" />
                                    Actualizar camaras
                                </Button>
                            </div>

                            <StatusBox
                                status={scannerStatus}
                                error={scannerError}
                                isScanning={isScanning}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="manual-code">
                                    Codigo leido o manual
                                </Label>
                                <Input
                                    id="manual-code"
                                    value={selectedItemCode}
                                    onChange={(event) =>
                                        selectManualCode(event.target.value)
                                    }
                                    placeholder="Ej: ALU-LUM-001"
                                />
                            </div>

                            {lastResult && <ScanDebug result={lastResult} />}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Salida provisoria</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedItem ? (
                                <form onSubmit={submit} className="grid gap-4">
                                    <section className="rounded-lg border bg-muted/20 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    {selectedItem.code}
                                                </p>
                                                <h2 className="text-xl font-semibold tracking-normal">
                                                    {selectedItem.name}
                                                </h2>
                                                {selectedItem.description && (
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {
                                                            selectedItem.description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <Badge
                                                variant={
                                                    selectedItem.low_stock
                                                        ? 'outline'
                                                        : 'default'
                                                }
                                            >
                                                {selectedItem.low_stock
                                                    ? 'Bajo stock'
                                                    : 'Stock OK'}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <Metric
                                                label="Stock deposito"
                                                value={formatNumber(
                                                    selectedItem.current_stock,
                                                )}
                                            />
                                            <Metric
                                                label="Unidad"
                                                value={selectedItem.unit}
                                            />
                                        </div>
                                    </section>

                                    <input
                                        type="hidden"
                                        name="movement_type"
                                        value="exit"
                                    />

                                    <div className="grid gap-2">
                                        <Label>Cantidad a retirar</Label>
                                        <div className="grid grid-cols-[56px_1fr_56px] gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-12 text-2xl"
                                                onClick={() =>
                                                    updateQuantity(quantity - 1)
                                                }
                                            >
                                                -
                                            </Button>
                                            <Input
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={form.data.quantity}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'quantity',
                                                        event.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className="h-12 text-center text-xl font-semibold"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-12 text-2xl"
                                                onClick={() =>
                                                    updateQuantity(quantity + 1)
                                                }
                                            >
                                                +
                                            </Button>
                                        </div>
                                        <InputError
                                            message={form.errors.quantity}
                                        />
                                    </div>

                                    {willBeNegative && (
                                        <Alert className="border-amber-300 bg-amber-50 text-amber-950">
                                            <TriangleAlert className="size-4" />
                                            <AlertTitle>
                                                Stock negativo
                                            </AlertTitle>
                                            <AlertDescription>
                                                Se puede confirmar igual. El
                                                stock quedara en{' '}
                                                {formatNumber(stockAfterExit)}{' '}
                                                para revision posterior.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="reference">
                                            Reclamo o referencia
                                        </Label>
                                        <Input
                                            id="reference"
                                            value={form.data.reference}
                                            onChange={(event) =>
                                                form.setData(
                                                    'reference',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Ej: REC-2026-0001"
                                        />
                                        <InputError
                                            message={form.errors.reference}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="reason">
                                            Motivo opcional
                                        </Label>
                                        <Input
                                            id="reason"
                                            value={form.data.reason}
                                            onChange={(event) =>
                                                form.setData(
                                                    'reason',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Ej: retiro para cuadrilla"
                                        />
                                        <InputError
                                            message={form.errors.reason}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                            type="submit"
                                            className="min-h-12 flex-1"
                                            disabled={
                                                form.processing ||
                                                !permissions.can_exit
                                            }
                                        >
                                            <ArrowDownCircle className="size-4" />
                                            {form.processing
                                                ? 'Registrando...'
                                                : 'Confirmar salida provisoria'}
                                        </Button>
                                        <Button asChild variant="outline">
                                            <a
                                                href={selectedItem.quick_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink className="size-4" />
                                                Ver ficha QR
                                            </a>
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                                    <PackageCheck className="size-8 text-foreground" />
                                    <p>
                                        Escanea una etiqueta QR o carga un
                                        codigo manualmente para habilitar el
                                        formulario de salida provisoria.
                                    </p>
                                    {selectedItemCode && (
                                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                                            El codigo {selectedItemCode} no
                                            coincide con un insumo activo.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {history.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Lecturas recientes</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            {history.map((scanResult) => (
                                <button
                                    key={`${scanResult.scannedAt}-${scanResult.rawValue}`}
                                    type="button"
                                    className="rounded-lg border bg-background p-3 text-left text-sm transition hover:bg-muted"
                                    onClick={() =>
                                        selectManualCode(scanResult.parsedCode)
                                    }
                                >
                                    <p className="font-mono break-all">
                                        {scanResult.parsedCode}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {scanResult.matched
                                            ? 'Insumo encontrado'
                                            : 'Sin coincidencia'}{' '}
                                        ·{' '}
                                        {new Date(
                                            scanResult.scannedAt,
                                        ).toLocaleTimeString('es-AR', {
                                            timeZone:
                                                'America/Argentina/Buenos_Aires',
                                        })}
                                    </p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function StatusBox({
    status,
    error,
    isScanning,
}: {
    status: string;
    error: string;
    isScanning: boolean;
}) {
    if (error) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="flex items-center gap-2 font-semibold">
                    <TriangleAlert className="size-4" />
                    Error de camara o lectura
                </p>
                <p className="mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">{status}</p>
            <Badge variant={isScanning ? 'default' : 'outline'}>
                {isScanning ? 'Activo' : 'Detenido'}
            </Badge>
        </div>
    );
}

function ScanDebug({ result }: { result: ScanResult }) {
    return (
        <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                Ultima lectura
            </p>
            <p className="font-mono break-all">{result.rawValue}</p>
            <p className="text-xs text-muted-foreground">
                Codigo detectado: {result.parsedCode || '-'} ·{' '}
                {new Date(result.scannedAt).toLocaleString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                })}
            </p>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-background p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-normal">
                {value}
            </p>
        </div>
    );
}

function isCameraSupported(): boolean {
    return Boolean(navigator.mediaDevices?.getUserMedia);
}

function isLocalOrSecureContext(): boolean {
    return (
        window.isSecureContext ||
        ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    );
}

async function openCameraStream(deviceId: string): Promise<MediaStream> {
    if (deviceId) {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { deviceId: { exact: deviceId } },
            });
        } catch (error) {
            if (isPermissionError(error)) {
                throw error;
            }
        }
    }

    try {
        return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: {
                    ideal: 'environment',
                },
            },
        });
    } catch (error) {
        if (isPermissionError(error)) {
            throw error;
        }

        return navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
        });
    }
}

function stopScannerStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => track.stop());
}

function isPermissionError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError';
}

function cameraErrorMessage(error: unknown): string {
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
            return 'El navegador bloqueo el permiso de camara. Habilitalo en la barra de direcciones y volve a iniciar.';
        }

        if (error.name === 'NotFoundError') {
            return 'No encontramos una camara disponible en este dispositivo.';
        }

        if (error.name === 'NotReadableError') {
            return 'La camara esta siendo usada por otra aplicacion o no se pudo abrir.';
        }

        if (error.name === 'OverconstrainedError') {
            return 'La camara seleccionada no esta disponible. Actualiza la lista o elegi otra.';
        }
    }

    return 'No pudimos abrir la camara ni leer codigos. Verifica permisos, navegador y conexion local segura.';
}

function parseQrCode(rawValue: string): string {
    const trimmedValue = rawValue.trim();

    try {
        const url = new URL(trimmedValue);
        const parts = url.pathname.split('/').filter(Boolean);

        return decodeURIComponent(parts.at(-1) ?? trimmedValue).trim();
    } catch {
        return trimmedValue;
    }
}

function codesMatch(firstCode: string, secondCode: string): boolean {
    return firstCode.trim().toLowerCase() === secondCode.trim().toLowerCase();
}

function formatNumber(value: number): string {
    return value.toLocaleString('es-AR', {
        maximumFractionDigits: 0,
    });
}

InventoryQrMovement.layout = {
    breadcrumbs: [
        { title: 'Inventario', href: '/admin/inventario' },
        { title: 'Movimiento QR', href: '/admin/inventario/movimiento-qr' },
    ],
};
