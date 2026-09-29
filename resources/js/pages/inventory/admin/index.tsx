import { Head, Link, router } from '@inertiajs/react';
import {
    LoaderCircle,
    Plus,
    Printer,
    QrCode,
    ScanLine,
    Search,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    create as createItem,
    index as inventoryIndex,
    show as inventoryShow,
} from '@/routes/admin/inventory';

type InventoryItem = {
    id: number;
    code: string;
    category_label: string | null;
    name: string;
    description: string | null;
    unit: string;
    current_stock: number;
    minimum_stock: number;
    qr_value: string;
    active: boolean;
    low_stock: boolean;
    movements_count: number;
};

type Props = {
    items: {
        data: InventoryItem[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        search?: string;
        stock_state?: string;
    };
    stockStates: { value: string; label: string }[];
    labelBatchUrl: string;
    qrMovementUrl: string;
    summary: {
        total_items: number;
        active_items: number;
        low_stock_items: number;
        inactive_items: number;
        total_stock: number;
    };
};

export default function InventoryIndex({
    items,
    filters,
    stockStates,
    labelBatchUrl,
    qrMovementUrl,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [stockState, setStockState] = useState(filters.stock_state ?? 'all');
    const [isSearching, setIsSearching] = useState(false);
    const firstRender = useRef(true);
    const latestVisitId = useRef(0);
    const visibleItems = useMemo(
        () => filterVisibleItems(items.data, search, stockState),
        [items.data, search, stockState],
    );

    function visitWithFilters(nextSearch: string, nextStockState: string) {
        const visitId = latestVisitId.current + 1;

        latestVisitId.current = visitId;
        router.cancelAll();
        setIsSearching(true);

        router.get(
            inventoryIndex.url(),
            {
                search: nextSearch,
                stock_state: nextStockState === 'all' ? '' : nextStockState,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => {
                    if (latestVisitId.current === visitId) {
                        setIsSearching(false);
                    }
                },
            },
        );
    }

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = window.setTimeout(() => {
            visitWithFilters(search, stockState);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, stockState]);

    function submit(event: FormEvent) {
        event.preventDefault();
        visitWithFilters(search, stockState);
    }

    function clearSearch() {
        setSearch('');
    }

    function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape' && search) {
            event.preventDefault();
            clearSearch();
        }
    }

    function changeStockState(nextStockState: string) {
        setStockState(nextStockState);
    }

    return (
        <>
            <Head title="Inventario" />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Inventario
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestion general de insumos del deposito de
                            alumbrado.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            asChild
                            variant="outline"
                            className="self-start"
                        >
                            <Link href={qrMovementUrl} prefetch>
                                <ScanLine className="size-4" />
                                Movimiento QR
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="self-start"
                        >
                            <Link href={labelBatchUrl} prefetch>
                                <Printer className="size-4" />
                                Etiquetas QR
                            </Link>
                        </Button>
                        <Button asChild className="self-start">
                            <Link href={createItem()} prefetch>
                                <Plus className="size-4" />
                                Nuevo insumo
                            </Link>
                        </Button>
                    </div>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <Metric label="Insumos" value={summary.total_items} />
                    <Metric label="Activos" value={summary.active_items} />
                    <Metric
                        label="Bajo stock"
                        value={summary.low_stock_items}
                    />
                    <Metric label="Inactivos" value={summary.inactive_items} />
                    <Metric
                        label="Stock total"
                        value={summary.total_stock.toLocaleString('es-AR', {
                            maximumFractionDigits: 0,
                        })}
                    />
                </section>

                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_220px]"
                >
                    <label className="relative">
                        {isSearching ? (
                            <LoaderCircle className="absolute top-3 left-3 size-4 animate-spin text-muted-foreground" />
                        ) : (
                            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        )}
                        <input
                            className="input min-h-11 pr-9 pl-9 focus-visible:ring-2 focus-visible:ring-primary/40"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Codigo, nombre, descripcion o QR"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Limpiar busqueda"
                                className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </label>
                    <select
                        className="input min-h-11"
                        value={stockState}
                        onChange={(event) =>
                            changeStockState(event.target.value)
                        }
                    >
                        {stockStates.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </form>

                <section className="grid gap-3">
                    {visibleItems.map((item) => (
                        <Link
                            key={item.id}
                            href={inventoryShow(item.id)}
                            className="grid gap-3 rounded-lg border bg-card p-4 text-sm transition hover:bg-muted/60 md:grid-cols-[1fr_140px_160px_140px]"
                        >
                            <div className="flex min-w-0 items-start gap-3">
                                <span
                                    className={`mt-1 grid size-10 shrink-0 place-items-center rounded-md text-white ${item.low_stock ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    {item.low_stock ? (
                                        <TriangleAlert className="size-5" />
                                    ) : (
                                        <QrCode className="size-5" />
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                        {item.code}
                                    </p>
                                    <h2 className="truncate text-lg font-semibold tracking-normal">
                                        {item.name}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {item.category_label ?? 'Sin tipo'} ·
                                        QR: {item.qr_value}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Stock actual
                                </p>
                                <p className="text-lg font-semibold">
                                    {formatStock(item.current_stock)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Minimo: {formatStock(item.minimum_stock)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Unidad
                                </p>
                                <p className="font-medium">{item.unit}</p>
                                <p className="text-xs text-muted-foreground">
                                    {item.movements_count} movimientos
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 md:justify-end">
                                <Badge
                                    variant={
                                        item.active ? 'default' : 'secondary'
                                    }
                                >
                                    {item.active ? 'Activo' : 'Inactivo'}
                                </Badge>
                                {item.low_stock && (
                                    <Badge variant="outline">Bajo stock</Badge>
                                )}
                            </div>
                        </Link>
                    ))}
                    {visibleItems.length === 0 && (
                        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                            No hay insumos para estos filtros.
                        </div>
                    )}
                </section>

                {items.total > 0 && (
                    <nav className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-muted-foreground">
                            Mostrando {items.from} a {items.to} de {items.total}{' '}
                            insumos
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {items.links.map((link, indexKey) => (
                                <PaginationLink
                                    key={`${link.label}-${indexKey}`}
                                    link={link}
                                />
                            ))}
                        </div>
                    </nav>
                )}
            </div>
        </>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-normal">
                {value}
            </p>
        </div>
    );
}

function PaginationLink({
    link,
}: {
    link: { url: string | null; label: string; active: boolean };
}) {
    const label = paginationLabel(link.label);

    if (!link.url) {
        return (
            <span className="rounded-md border px-3 py-2 text-muted-foreground opacity-50">
                {label}
            </span>
        );
    }

    return (
        <Link
            href={link.url}
            preserveScroll
            className={`rounded-md border px-3 py-2 font-medium ${
                link.active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted/50'
            }`}
        >
            {label}
        </Link>
    );
}

function paginationLabel(label: string) {
    return label.replace('&laquo;', 'Anterior').replace('&raquo;', 'Siguiente');
}

function formatStock(value: number): string {
    return value.toLocaleString('es-AR', {
        maximumFractionDigits: 0,
    });
}

function filterVisibleItems(
    items: InventoryItem[],
    search: string,
    stockState: string,
): InventoryItem[] {
    const normalizedSearch = normalizeSearch(search);

    return items.filter((item) => {
        const matchesSearch =
            normalizedSearch === '' ||
            [
                item.code,
                item.name,
                item.description ?? '',
                item.qr_value,
                item.category_label ?? '',
            ]
                .map(normalizeSearch)
                .some((value) => value.includes(normalizedSearch));

        const matchesStockState =
            stockState === 'all' ||
            (stockState === 'low' && item.low_stock) ||
            (stockState === 'inactive' && !item.active);

        return matchesSearch && matchesStockState;
    });
}

function normalizeSearch(value: string): string {
    return value.trim().toLocaleLowerCase('es-AR');
}

InventoryIndex.layout = {
    breadcrumbs: [{ title: 'Inventario', href: inventoryIndex() }],
};
