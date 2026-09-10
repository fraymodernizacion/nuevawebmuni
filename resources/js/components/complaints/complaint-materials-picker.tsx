import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, QrCode, ScanLine, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type InventoryItem = {
    id: number;
    code: string;
    name: string;
    unit: string;
    current_stock: number | string;
    minimum_stock: number | string;
};

export type ComplaintMaterialInput = {
    inventory_item_id: number;
    quantity: number;
};

type ScannerLike = {
    detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

declare global {
    interface Window {
        BarcodeDetector?: new () => ScannerLike;
    }
}

export function ComplaintMaterialsPicker({
    inventoryItems,
    materials,
    onChange,
}: {
    inventoryItems: InventoryItem[];
    materials: ComplaintMaterialInput[];
    onChange: (materials: ComplaintMaterialInput[]) => void;
}) {
    const [code, setCode] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [error, setError] = useState('');
    const [scannerOpen, setScannerOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

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

    const matchedItem = useMemo(
        () =>
            inventoryItems.find(
                (item) => item.code.toLowerCase() === code.trim().toLowerCase(),
            ) ?? null,
        [code, inventoryItems],
    );

    function addMaterialByItem(item: InventoryItem, requestedQuantity: number) {
        if (requestedQuantity <= 0) {
            setError('La cantidad debe ser mayor a cero.');

            return;
        }

        const nextMaterials = [...materials];
        const existingIndex = nextMaterials.findIndex(
            (material) => material.inventory_item_id === item.id,
        );

        if (existingIndex >= 0) {
            nextMaterials[existingIndex] = {
                ...nextMaterials[existingIndex],
                quantity: roundQuantity(
                    nextMaterials[existingIndex].quantity + requestedQuantity,
                ),
            };
        } else {
            nextMaterials.push({
                inventory_item_id: item.id,
                quantity: roundQuantity(requestedQuantity),
            });
        }

        onChange(nextMaterials);
        setCode(item.code);
        setError('');
    }

    function addMaterialByCode() {
        const item = matchedItem;

        if (!item) {
            setError('No encontramos ese codigo en el inventario.');

            return;
        }

        addMaterialByItem(item, parseQuantity(quantity));
    }

    function removeMaterial(inventoryItemId: number) {
        onChange(
            materials.filter(
                (material) => material.inventory_item_id !== inventoryItemId,
            ),
        );
    }

    function handleScannedCode(rawCode: string) {
        const scannedItem = inventoryItems.find(
            (item) => item.code.toLowerCase() === rawCode.toLowerCase(),
        );

        if (!scannedItem) {
            setError(`El QR ${rawCode} no coincide con un insumo cargado.`);
            return;
        }

        addMaterialByItem(scannedItem, parseQuantity(quantity));
        setScannerOpen(false);
    }

    useEffect(() => {
        if (!scannerOpen) {
            return;
        }

        const BarcodeDetector = window.BarcodeDetector;
        const video = videoRef.current;
        let active = true;
        let stream: MediaStream | null = null;
        let intervalId: number | null = null;

        if (
            !BarcodeDetector ||
            !navigator.mediaDevices?.getUserMedia ||
            !video
        ) {
            setError(
                'Este navegador no soporta lectura QR con camara. Proba con Chrome en Android.',
            );
            return () => {
                active = false;
            };
        }

        const detector = new BarcodeDetector();

        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: 'environment',
                },
            })
            .then(async (mediaStream) => {
                if (!active || !videoRef.current) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    return;
                }

                stream = mediaStream;
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();

                intervalId = window.setInterval(async () => {
                    if (!active || !videoRef.current) {
                        return;
                    }

                    const detections = await detector
                        .detect(videoRef.current)
                        .catch(() => []);
                    const codeDetected = detections[0]?.rawValue?.trim();

                    if (codeDetected) {
                        handleScannedCode(codeDetected);
                    }
                }, 700);
            })
            .catch(() => {
                setError('No pudimos abrir la camara para leer el QR.');
                setScannerOpen(false);
            });

        return () => {
            active = false;

            if (intervalId) {
                window.clearInterval(intervalId);
            }

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [scannerOpen]);

    return (
        <section className="rounded-md border bg-muted/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold">Insumos utilizados</p>
                    <p className="text-xs text-muted-foreground">
                        Escaneá el QR o cargá el código del insumo del deposito.
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
                    onClick={() => setScannerOpen(true)}
                >
                    <QrCode className="size-4" /> Escanear QR
                </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                <label className="sr-only" htmlFor="material-code">
                    Codigo
                </label>
                <input
                    id="material-code"
                    className="input"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Codigo o QR"
                />
                <label className="sr-only" htmlFor="material-quantity">
                    Cantidad
                </label>
                <input
                    id="material-quantity"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(event) =>
                        setQuantity(event.target.value.replace(/\D/g, ''))
                    }
                />
                <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                    onClick={addMaterialByCode}
                >
                    <Plus className="size-4" /> Agregar
                </button>
            </div>

            {error && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {error}
                </p>
            )}

            {matchedItem && (
                <p className="mt-2 text-xs text-muted-foreground">
                    Encontrado: {matchedItem.name} · Stock actual{' '}
                    {formatNumber(matchedItem.current_stock)} {matchedItem.unit}
                </p>
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
                                    {material.item?.unit ?? 'unidad'} · Stock{' '}
                                    {material.item
                                        ? `${formatNumber(material.item.current_stock)} disponible`
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

            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
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
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="aspect-video w-full rounded-md border bg-black object-cover"
                        />
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ScanLine className="size-4" />
                            Si el QR coincide con un insumo del inventario, se
                            agregara automaticamente.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
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
