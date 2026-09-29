import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { Plus, QrCode, ScanLine, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type InventoryItem = {
    id: number;
    code: string;
    name: string;
    unit: string;
    current_stock: number | string;
    minimum_stock: number | string;
    withdrawn_quantity: number | string;
    used_quantity: number | string;
    returned_quantity: number | string;
    pending_quantity: number | string;
};

export type ComplaintMaterialInput = {
    inventory_item_id: number;
    quantity: number;
};

export function ComplaintMaterialsPicker({
    inventoryItems,
    materials,
    onChange,
}: {
    inventoryItems: InventoryItem[];
    materials: ComplaintMaterialInput[];
    onChange: (materials: ComplaintMaterialInput[]) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [quantityDraft, setQuantityDraft] = useState('1');
    const [error, setError] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerStatus, setScannerStatus] = useState('');
    const [quantityItem, setQuantityItem] = useState<InventoryItem | null>(
        null,
    );
    const [scannerVideo, setScannerVideo] = useState<HTMLVideoElement | null>(
        null,
    );
    const scannerControlsRef = useRef<IScannerControls | null>(null);
    const scannerStreamRef = useRef<MediaStream | null>(null);
    const qrPhotoInputRef = useRef<HTMLInputElement | null>(null);

    const selectedMaterials = useMemo(
        () =>
            materials.map((material) => {
                const item = inventoryItems.find(
                    (candidate) => candidate.id === material.inventory_item_id,
                );

                return {
                    ...material,
                    item,
                };
            }),
        [inventoryItems, materials],
    );

    const searchResults = useMemo(
        () => searchInventoryItems(inventoryItems, searchQuery),
        [inventoryItems, searchQuery],
    );

    const addMaterialByItem = useCallback(
        (item: InventoryItem, requestedQuantity: number) => {
            if (requestedQuantity <= 0) {
                setError('La cantidad debe ser mayor a cero.');

                return;
            }

            if (requestedQuantity > Number(item.pending_quantity)) {
                setError(
                    `Solo hay ${formatNumber(item.pending_quantity)} ${item.unit} pendiente de rendir para este insumo.`,
                );

                return;
            }

            const nextMaterials = [...materials];
            const existingIndex = nextMaterials.findIndex(
                (material) => material.inventory_item_id === item.id,
            );

            if (existingIndex >= 0) {
                const nextQuantity = roundQuantity(
                    nextMaterials[existingIndex].quantity + requestedQuantity,
                );

                if (nextQuantity > Number(item.pending_quantity)) {
                    setError(
                        `Solo hay ${formatNumber(item.pending_quantity)} ${item.unit} pendiente de rendir para este insumo.`,
                    );

                    return;
                }

                nextMaterials[existingIndex] = {
                    ...nextMaterials[existingIndex],
                    quantity: nextQuantity,
                };
            } else {
                nextMaterials.push({
                    inventory_item_id: item.id,
                    quantity: roundQuantity(requestedQuantity),
                });
            }

            onChange(nextMaterials);
            setSearchQuery('');
            setError('');
        },
        [materials, onChange],
    );

    function removeMaterial(inventoryItemId: number) {
        onChange(
            materials.filter(
                (material) => material.inventory_item_id !== inventoryItemId,
            ),
        );
    }

    const openQuantityDialog = useCallback((item: InventoryItem) => {
        setError('');
        setQuantityDraft('1');
        setQuantityItem(item);
    }, []);

    function addSelectedQuantity() {
        if (!quantityItem) {
            return;
        }

        const parsedQuantity = parseQuantity(quantityDraft);

        if (parsedQuantity <= 0) {
            setError('La cantidad debe ser mayor a cero.');

            return;
        }

        addMaterialByItem(quantityItem, parsedQuantity);
        setQuantityItem(null);
    }

    const handleScannedCode = useCallback(
        (rawCode: string) => {
            const normalizedCode = normalizeScannedCode(rawCode);
            const scannedItem = inventoryItems.find((item) =>
                codesMatch(item.code, normalizedCode),
            );

            if (!scannedItem) {
                setError(
                    `El QR ${normalizedCode} no coincide con un insumo cargado.`,
                );

                return;
            }

            if (Number(scannedItem.pending_quantity) <= 0) {
                setError(
                    `El QR ${normalizedCode} corresponde a ${scannedItem.name}, pero no tiene cantidad retirada pendiente de rendir para este reclamo.`,
                );
                setSearchQuery(scannedItem.code);

                return;
            }

            setScannerOpen(false);
            setScannerStatus('');
            openQuantityDialog(scannedItem);
            setSearchQuery(scannedItem.code);
        },
        [inventoryItems, openQuantityDialog],
    );

    function openScanner() {
        if (!isCameraSupported() || !isLocalOrSecureContext()) {
            setError(
                'El visor en vivo no está disponible aquí. Tomá una foto del QR para leerlo.',
            );
            qrPhotoInputRef.current?.click();

            return;
        }

        setError('');
        setScannerStatus('Abriendo camara...');
        setScannerOpen(true);
    }

    async function scanQrPhoto(file: File | undefined) {
        if (!file) {
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setError('');

        try {
            const result = await new BrowserQRCodeReader().decodeFromImageUrl(
                objectUrl,
            );
            handleScannedCode(result.getText());
        } catch {
            setError(
                'No pudimos leer el QR de la foto. Acercá la cámara y volvé a intentar.',
            );
        } finally {
            URL.revokeObjectURL(objectUrl);

            if (qrPhotoInputRef.current) {
                qrPhotoInputRef.current.value = '';
            }
        }
    }

    useEffect(() => {
        if (!scannerOpen) {
            scannerControlsRef.current?.stop();
            scannerControlsRef.current = null;
            stopScannerStream(scannerStreamRef.current);
            scannerStreamRef.current = null;

            return;
        }

        const video = scannerVideo;
        let active = true;
        const codeReader = new BrowserQRCodeReader(undefined, {
            delayBetweenScanAttempts: 350,
        });

        if (!isCameraSupported()) {
            return () => {
                active = false;
            };
        }

        if (!video) {
            return () => {
                active = false;
            };
        }

        openCameraStream()
            .then(async (stream) => {
                if (!active) {
                    stopScannerStream(stream);

                    return;
                }

                scannerStreamRef.current = stream;
                video.srcObject = stream;
                await video.play();

                const controls = await codeReader.decodeFromStream(
                    stream,
                    video,
                    (result) => {
                        if (!active || !result) {
                            return;
                        }

                        const scannedCode = normalizeScannedCode(
                            result.getText(),
                        );

                        if (scannedCode) {
                            scannerControlsRef.current?.stop();
                            scannerControlsRef.current = null;
                            stopScannerStream(scannerStreamRef.current);
                            scannerStreamRef.current = null;
                            handleScannedCode(scannedCode);
                        }
                    },
                );

                if (!active) {
                    controls.stop();
                    stopScannerStream(stream);

                    return;
                }

                scannerControlsRef.current = controls;
                setScannerStatus('Apunta la camara al QR del insumo.');
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }

                setError(cameraErrorMessage(error));
                setScannerOpen(false);
            });

        return () => {
            active = false;
            scannerControlsRef.current?.stop();
            scannerControlsRef.current = null;
            stopScannerStream(scannerStreamRef.current);
            scannerStreamRef.current = null;

            if (video) {
                video.srcObject = null;
            }
        };
    }, [handleScannedCode, scannerOpen, scannerVideo]);

    return (
        <section className="rounded-md border bg-muted/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold">Insumos utilizados</p>
                    <p className="text-xs text-muted-foreground">
                        Usá materiales ya retirados del deposito y pendientes de
                        rendir.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
                        onClick={openScanner}
                    >
                        <QrCode className="size-4" /> Escanear QR
                    </button>
                    <button
                        type="button"
                        onClick={() => qrPhotoInputRef.current?.click()}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
                    >
                        Leer QR con foto
                    </button>
                    <input
                        ref={qrPhotoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(event) =>
                            void scanQrPhoto(event.target.files?.[0])
                        }
                    />
                </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                <div className="sm:col-span-3">
                    <label className="sr-only" htmlFor="material-search">
                        Buscar insumo
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            id="material-search"
                            className="input pl-9"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Buscar por codigo, nombre, unidad o palabras clave"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {error}
                </p>
            )}

            {searchQuery.trim() && (
                <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto rounded-md border bg-background p-2">
                    {searchResults.length > 0 ? (
                        searchResults.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                disabled={Number(item.pending_quantity) <= 0}
                                className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => openQuantityDialog(item)}
                            >
                                <span>
                                    <span className="block text-sm font-semibold">
                                        {item.code} · {item.name}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Stock actual{' '}
                                        {formatNumber(item.current_stock)} ·
                                        pendiente{' '}
                                        {formatNumber(item.pending_quantity)}{' '}
                                        {item.unit}
                                    </span>
                                </span>
                                <span className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold">
                                    {Number(item.pending_quantity) > 0 ? (
                                        <>
                                            <Plus className="size-3.5" /> Usar
                                        </>
                                    ) : (
                                        'Sin pendiente'
                                    )}
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="px-3 py-4 text-sm text-muted-foreground">
                            No encontramos insumos que coincidan con esa
                            busqueda.
                        </p>
                    )}
                </div>
            )}

            {selectedMaterials.length > 0 ? (
                <div className="mt-3 grid gap-2">
                    {selectedMaterials.map((material) => (
                        <div
                            key={material.inventory_item_id}
                            className="flex flex-col gap-2 rounded-md border bg-background p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p className="font-semibold">
                                    {material.item?.code ?? 'SIN CODIGO'} ·{' '}
                                    {material.item?.name ?? 'Insumo'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatNumber(material.quantity)}{' '}
                                    {material.item?.unit ?? 'unidad'} ·
                                    Pendiente{' '}
                                    {material.item
                                        ? `${formatNumber(material.item.pending_quantity)} disponible`
                                        : 'no disponible'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
                                onClick={() =>
                                    removeMaterial(material.inventory_item_id)
                                }
                            >
                                <Trash2 className="size-4" /> Quitar
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                    Todavia no agregaste insumos a esta intervencion.
                </p>
            )}

            <Dialog
                open={scannerOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setScannerStatus('');
                    }

                    setScannerOpen(open);
                }}
            >
                <DialogContent className="max-w-xl gap-4">
                    <DialogHeader>
                        <DialogTitle>Escanear QR de insumo</DialogTitle>
                        <DialogDescription>
                            Apuntá la camara al codigo del insumo para cargarlo
                            en esta intervencion.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <video
                            ref={setScannerVideo}
                            autoPlay
                            playsInline
                            muted
                            className="aspect-video w-full rounded-md border bg-black object-cover"
                        />
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ScanLine className="size-4" />
                            {scannerStatus ||
                                'Si el QR coincide con un insumo del inventario, vas a poder indicar la cantidad.'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {quantityItem && (
                <Dialog
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setQuantityItem(null);
                        }
                    }}
                >
                    <DialogContent className="max-w-md gap-4">
                        <DialogHeader>
                            <DialogTitle>Cantidad utilizada</DialogTitle>
                            <DialogDescription>
                                {quantityItem.code} · {quantityItem.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                                Pendiente de rendir{' '}
                                {formatNumber(quantityItem.pending_quantity)}{' '}
                                {quantityItem.unit}
                            </p>
                            <div className="grid gap-2">
                                <label
                                    className="text-sm font-medium"
                                    htmlFor="material-quantity"
                                >
                                    Unidades utilizadas
                                </label>
                                <input
                                    id="material-quantity"
                                    className="input"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={quantityDraft}
                                    onChange={(event) =>
                                        setQuantityDraft(
                                            event.target.value.replace(
                                                /\D/g,
                                                '',
                                            ),
                                        )
                                    }
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    className="inline-flex min-h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted"
                                    onClick={() => setQuantityItem(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                                    onClick={addSelectedQuantity}
                                >
                                    <Plus className="size-4" /> Agregar
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </section>
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

function searchInventoryItems(
    inventoryItems: InventoryItem[],
    query: string,
): InventoryItem[] {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) {
        return [];
    }

    const terms = normalizedQuery.split(' ').filter(Boolean);

    return inventoryItems
        .filter((item) => {
            const searchableValue = normalizeSearchValue(
                `${item.code} ${item.name} ${item.unit}`,
            );

            return terms.every((term) => searchableValue.includes(term));
        })
        .sort((firstItem, secondItem) => {
            const firstCode = normalizeSearchValue(firstItem.code);
            const secondCode = normalizeSearchValue(secondItem.code);
            const firstName = normalizeSearchValue(firstItem.name);
            const secondName = normalizeSearchValue(secondItem.name);
            const firstStartsWithQuery =
                firstCode.startsWith(normalizedQuery) ||
                firstName.startsWith(normalizedQuery);
            const secondStartsWithQuery =
                secondCode.startsWith(normalizedQuery) ||
                secondName.startsWith(normalizedQuery);

            if (firstStartsWithQuery !== secondStartsWithQuery) {
                return firstStartsWithQuery ? -1 : 1;
            }

            return firstItem.code.localeCompare(secondItem.code, 'es-AR');
        })
        .slice(0, 12);
}

function normalizeSearchValue(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

async function openCameraStream(): Promise<MediaStream> {
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

function normalizeScannedCode(value: string): string {
    const trimmedValue = value.trim();

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

function cameraErrorMessage(error: unknown): string {
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
            return 'El navegador bloqueo el permiso de camara. Habilitalo o carga el codigo manualmente.';
        }

        if (error.name === 'NotFoundError') {
            return 'No encontramos una camara disponible en este dispositivo. Carga el codigo manualmente.';
        }

        if (error.name === 'NotReadableError') {
            return 'La camara esta siendo usada por otra aplicacion o el navegador no pudo abrirla. Cerrá otras apps y volve a intentar.';
        }

        if (error.name === 'OverconstrainedError') {
            return 'La camara trasera no esta disponible. Volve a intentar o carga el codigo manualmente.';
        }
    }

    return 'No pudimos abrir la camara para leer el QR. Carga el codigo manualmente.';
}

function parseQuantity(value: string): number {
    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : 0;
}

function roundQuantity(value: number): number {
    return Math.trunc(value);
}

function formatNumber(value: number | string): string {
    return Number(value).toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}
