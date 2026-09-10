import { Head, useForm } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    PackageCheck,
    PackageSearch,
    Recycle,
    ShieldCheck,
    TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MovementType = 'exit' | 'entry' | 'recycled';

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

type Props = {
    code: string;
    item: InventoryItem | null;
    permissions: {
        can_exit: boolean;
        can_entry: boolean;
        can_recycled: boolean;
    };
};

const movementOptions = [
    {
        value: 'exit',
        label: 'Salida',
        description: 'Material que se retira para usar en campo.',
        icon: ArrowDownCircle,
        color: 'border-red-200 bg-red-50 text-red-950',
        selected: 'border-red-500 bg-red-100 ring-red-200',
        permission: 'can_exit',
    },
    {
        value: 'entry',
        label: 'Entrada',
        description: 'Material que ingresa al deposito.',
        icon: ArrowUpCircle,
        color: 'border-emerald-200 bg-emerald-50 text-emerald-950',
        selected: 'border-emerald-500 bg-emerald-100 ring-emerald-200',
        permission: 'can_entry',
    },
    {
        value: 'recycled',
        label: 'Reciclado',
        description: 'Material recuperado que vuelve al registro.',
        icon: Recycle,
        color: 'border-sky-200 bg-sky-50 text-sky-950',
        selected: 'border-sky-500 bg-sky-100 ring-sky-200',
        permission: 'can_recycled',
    },
] as const;

export default function InventoryQuickShow({ code, item, permissions }: Props) {
    const firstAllowedMovement =
        movementOptions.find((option) => permissions[option.permission])
            ?.value ?? 'exit';
    const [movementType, setMovementType] =
        useState<MovementType>(firstAllowedMovement);
    const form = useForm({
        movement_type: firstAllowedMovement,
        quantity: '1',
        reference: '',
        reason: '',
    });

    if (!item) {
        return (
            <>
                <Head title="Insumo no encontrado" />
                <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
                    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-5">
                        <div className="grid size-16 place-items-center rounded-2xl bg-amber-400 text-slate-950">
                            <PackageSearch className="size-9" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-[0.25em] text-amber-200 uppercase">
                                Codigo {code}
                            </p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight">
                                El insumo escaneado no existe en el inventario
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                Verifica que la etiqueta corresponda a un insumo
                                cargado o consulta con deposito antes de
                                registrar movimientos.
                            </p>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    const quantity = Number(form.data.quantity || 0);
    const stockAfterExit = item.current_stock - quantity;
    const movementStoreUrl = item.movement_store_url;
    const willBeNegative =
        movementType === 'exit' && quantity > 0 && stockAfterExit < 0;

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post(movementStoreUrl, {
            preserveScroll: true,
        });
    }

    function updateQuantity(nextQuantity: number) {
        form.setData('quantity', Math.max(1, nextQuantity).toString());
    }

    return (
        <>
            <Head title={`Movimiento rapido - ${item.code}`} />
            <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fde68a,transparent_28rem),linear-gradient(145deg,#0f172a,#1f2937_45%,#111827)] px-4 py-5 text-white">
                <section className="mx-auto flex max-w-md flex-col gap-4">
                    <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.25em] text-amber-200 uppercase">
                                    Alumbrado publico
                                </p>
                                <h1 className="mt-2 text-3xl font-black tracking-tight">
                                    Movimiento rapido
                                </h1>
                            </div>
                            <div className="grid size-13 place-items-center rounded-2xl bg-amber-300 text-slate-950">
                                <PackageCheck className="size-7" />
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200">
                            Escanea, elegi el movimiento y confirma. La sesion
                            queda activa para no pedir login en cada etiqueta.
                        </p>
                    </header>

                    <section className="rounded-[2rem] bg-white p-5 text-slate-950 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
                                    {item.code}
                                </p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight">
                                    {item.name}
                                </h2>
                                {item.description && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                            <Badge
                                variant={item.low_stock ? 'outline' : 'default'}
                                className="shrink-0"
                            >
                                {item.low_stock ? 'Bajo' : 'OK'}
                            </Badge>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <Metric
                                label="Stock actual"
                                value={item.current_stock.toLocaleString(
                                    'es-AR',
                                    {
                                        maximumFractionDigits: 0,
                                    },
                                )}
                            />
                            <Metric label="Unidad" value={item.unit} />
                        </div>
                    </section>

                    <form
                        onSubmit={submit}
                        className="rounded-[2rem] bg-white p-5 text-slate-950 shadow-2xl"
                    >
                        <div className="grid gap-3">
                            <Label>Tipo de movimiento</Label>
                            {movementOptions.map((option) => {
                                const Icon = option.icon;
                                const allowed = permissions[option.permission];
                                const selected = movementType === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={!allowed}
                                        onClick={() => {
                                            setMovementType(option.value);
                                            form.setData(
                                                'movement_type',
                                                option.value,
                                            );
                                        }}
                                        className={`flex min-h-22 items-center gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${option.color} ${selected ? `${option.selected} ring-2` : ''}`}
                                    >
                                        <Icon className="size-8 shrink-0" />
                                        <span>
                                            <span className="block text-lg font-black">
                                                {option.label}
                                            </span>
                                            <span className="block text-sm opacity-75">
                                                {allowed
                                                    ? option.description
                                                    : 'Tu rol no permite este movimiento.'}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                            <InputError message={form.errors.movement_type} />
                        </div>

                        <div className="mt-5 grid gap-2">
                            <Label>Cantidad</Label>
                            <div className="grid grid-cols-[64px_1fr_64px] gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-16 text-3xl"
                                    onClick={() => updateQuantity(quantity - 1)}
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
                                    className="h-16 text-center text-3xl font-black"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-16 text-3xl"
                                    onClick={() => updateQuantity(quantity + 1)}
                                >
                                    +
                                </Button>
                            </div>
                            <InputError message={form.errors.quantity} />
                        </div>

                        {willBeNegative && (
                            <Alert className="mt-5 border-amber-300 bg-amber-50 text-amber-950">
                                <TriangleAlert className="size-4" />
                                <AlertTitle>Stock negativo</AlertTitle>
                                <AlertDescription>
                                    Se puede confirmar igual. El stock quedara
                                    en {stockAfterExit.toLocaleString('es-AR')}{' '}
                                    para revision posterior.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="mt-5 grid gap-4">
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
                                <InputError message={form.errors.reference} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reason">Motivo opcional</Label>
                                <Input
                                    id="reason"
                                    value={form.data.reason}
                                    onChange={(event) =>
                                        form.setData(
                                            'reason',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ej: reposicion en deposito"
                                />
                                <InputError message={form.errors.reason} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-6 h-16 w-full rounded-2xl text-lg font-black"
                            disabled={form.processing}
                        >
                            <ShieldCheck className="size-5" />
                            {form.processing
                                ? 'Registrando...'
                                : 'Confirmar movimiento'}
                        </Button>
                    </form>
                </section>
            </main>
        </>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
                {label}
            </p>
            <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
    );
}
