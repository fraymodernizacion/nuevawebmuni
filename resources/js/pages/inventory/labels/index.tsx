import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Minus, Printer, QrCode, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { index as inventoryIndex } from '@/routes/admin/inventory';

type InventoryItem = {
    id: number;
    code: string;
    name: string;
    unit: string;
    current_stock: number;
    minimum_stock: number;
    quick_url: string;
};

type Props = {
    items: InventoryItem[];
    filters: {
        search?: string;
    };
    indexUrl: string;
    inventoryUrl: string;
    printUrl: string;
};

export default function InventoryLabelsIndex({
    items,
    filters,
    indexUrl,
    inventoryUrl,
    printUrl,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<Record<number, number>>({});

    const selectedItems = items.filter((item) => selected[item.id]);
    const totalLabels = Object.values(selected).reduce(
        (total, quantity) => total + quantity,
        0,
    );

    function submitSearch(event: FormEvent) {
        event.preventDefault();

        router.get(
            indexUrl,
            { search },
            { preserveState: true, preserveScroll: true },
        );
    }

    function toggleItem(itemId: number, checked: boolean) {
        setSelected((current) => {
            const next = { ...current };

            if (checked) {
                next[itemId] = next[itemId] ?? 1;
            } else {
                delete next[itemId];
            }

            return next;
        });
    }

    function updateQuantity(itemId: number, quantity: number) {
        setSelected((current) => ({
            ...current,
            [itemId]: Math.max(1, Math.min(99, quantity)),
        }));
    }

    function openPrint() {
        const params = new URLSearchParams();

        Object.entries(selected).forEach(([itemId, quantity]) => {
            params.set(`items[${itemId}]`, quantity.toString());
        });

        window.open(`${printUrl}?${params.toString()}`, '_blank', 'noopener');
    }

    return (
        <>
            <Head title="Etiquetas QR" />
            <div className="flex flex-col gap-5 p-4">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                            Inventario
                        </p>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Etiquetas QR
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Armado por lote para rollo termico de 80 mm. Cada QR
                            abre el movimiento rapido del insumo.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="min-h-11">
                            <Link href={inventoryUrl}>
                                <ArrowLeft className="size-4" />
                                Volver
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            disabled={totalLabels === 0}
                            onClick={openPrint}
                            className="min-h-11"
                        >
                            <Printer className="size-4" />
                            Imprimir {totalLabels || ''}
                        </Button>
                    </div>
                </header>

                <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <div className="grid gap-4">
                        <form
                            onSubmit={submitSearch}
                            className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_auto]"
                        >
                            <label className="relative">
                                <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="pl-9"
                                    placeholder="Buscar por codigo, nombre o descripcion"
                                />
                            </label>
                            <Button type="submit" className="min-h-11">
                                Buscar
                            </Button>
                        </form>

                        <div className="grid gap-3">
                            {items.map((item) => {
                                const quantity = selected[item.id] ?? 1;
                                const isSelected = Boolean(selected[item.id]);

                                return (
                                    <article
                                        key={item.id}
                                        className={`grid gap-3 rounded-xl border bg-card p-4 transition sm:grid-cols-[auto_1fr_136px] sm:items-center ${isSelected ? 'border-slate-900 ring-2 ring-slate-200' : ''}`}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) =>
                                                toggleItem(
                                                    item.id,
                                                    checked === true,
                                                )
                                            }
                                            className="size-5"
                                            aria-label={`Seleccionar ${item.code}`}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-mono text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                                    {item.code}
                                                </p>
                                                <Badge variant="outline">
                                                    {item.unit}
                                                </Badge>
                                            </div>
                                            <h2 className="mt-1 truncate text-lg font-semibold">
                                                {item.name}
                                            </h2>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                URL QR: {item.quick_url}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-[40px_1fr_40px] gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={!isSelected}
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        quantity - 1,
                                                    )
                                                }
                                            >
                                                <Minus className="size-4" />
                                            </Button>
                                            <Input
                                                inputMode="numeric"
                                                disabled={!isSelected}
                                                value={quantity}
                                                onChange={(event) =>
                                                    updateQuantity(
                                                        item.id,
                                                        Number(
                                                            event.target.value,
                                                        ) || 1,
                                                    )
                                                }
                                                className="text-center font-bold"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={!isSelected}
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        quantity + 1,
                                                    )
                                                }
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}

                            {items.length === 0 && (
                                <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                                    No hay insumos activos para esta busqueda.
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="h-fit rounded-2xl border bg-card p-4 lg:sticky lg:top-4">
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-xl bg-slate-900 text-white">
                                <QrCode className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-semibold">
                                    Lote seleccionado
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedItems.length} insumos,{' '}
                                    {totalLabels} etiquetas
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                            {selectedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-muted/50 p-3 text-sm"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">
                                            {item.name}
                                        </p>
                                        <p className="font-mono text-xs text-muted-foreground">
                                            {item.code} · x{selected[item.id]}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            toggleItem(item.id, false)
                                        }
                                        aria-label={`Quitar ${item.code}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}

                            {selectedItems.length === 0 && (
                                <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                                    Selecciona uno o mas insumos para preparar
                                    el lote de impresion.
                                </p>
                            )}
                        </div>
                    </aside>
                </section>
            </div>
        </>
    );
}

InventoryLabelsIndex.layout = {
    breadcrumbs: [
        { title: 'Inventario', href: inventoryIndex() },
        { title: 'Etiquetas QR', href: '/admin/inventario/etiquetas' },
    ],
};
