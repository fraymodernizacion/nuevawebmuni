import { Link, useForm } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index } from '@/routes/admin/inventory';

type InventoryItemFormValues = {
    code: string;
    category_code: string | null;
    name: string;
    description: string | null;
    unit: string;
    current_stock: string | number;
    minimum_stock: string | number;
    active: boolean;
};

type Props = {
    item: InventoryItemFormValues;
    categories: {
        code: string;
        label: string;
    }[];
    submitLabel: string;
    actionUrl: string;
    method: 'post' | 'patch';
    cancelHref?: InertiaLinkProps['href'];
};

export function InventoryItemForm({
    item,
    categories,
    submitLabel,
    actionUrl,
    method,
    cancelHref = index(),
}: Props) {
    const form = useForm({
        code: item.code,
        category_code: item.category_code ?? '',
        name: item.name,
        description: item.description ?? '',
        unit: item.unit,
        current_stock: integerValue(item.current_stock),
        minimum_stock: integerValue(item.minimum_stock),
        stock_adjustment_type: '',
        stock_adjustment_quantity: '',
        active: item.active,
    });

    const adjustmentQuantity = Number(form.data.stock_adjustment_quantity);
    const currentStock = Number(form.data.current_stock);
    const adjustmentPreview =
        method === 'patch' &&
        form.data.stock_adjustment_type &&
        Number.isFinite(adjustmentQuantity) &&
        adjustmentQuantity > 0 &&
        Number.isFinite(currentStock)
            ? form.data.stock_adjustment_type === 'add'
                ? currentStock + adjustmentQuantity
                : currentStock - adjustmentQuantity
            : null;

    function selectAdjustment(type: 'add' | 'subtract') {
        form.setData(
            'stock_adjustment_type',
            form.data.stock_adjustment_type === type ? '' : type,
        );
    }

    function setIntegerField(
        field: 'current_stock' | 'minimum_stock' | 'stock_adjustment_quantity',
        value: string,
    ) {
        form.setData(field, value.replace(/\D/g, ''));
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (method === 'patch') {
            form.patch(actionUrl, { preserveScroll: true });

            return;
        }

        form.post(actionUrl, {
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo de insumo" error={form.errors.category_code}>
                    <Select
                        value={form.data.category_code}
                        onValueChange={(value) =>
                            form.setData('category_code', value)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem
                                    key={category.code}
                                    value={category.code}
                                >
                                    {category.code} - {category.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="Unidad" error={form.errors.unit}>
                    <Input
                        value={form.data.unit}
                        onChange={(event) =>
                            form.setData('unit', event.target.value)
                        }
                        placeholder="unidad"
                    />
                </Field>
            </div>

            {method === 'patch' && (
                <Field label="Código" error={form.errors.code}>
                    <Input
                        value={form.data.code}
                        onChange={(event) =>
                            form.setData('code', event.target.value)
                        }
                        autoComplete="off"
                        placeholder="ALU-LUM-001"
                    />
                </Field>
            )}

            <Field label="Nombre" error={form.errors.name}>
                <Input
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                    placeholder="Nombre del insumo"
                />
            </Field>

            <Field label="Descripcion" error={form.errors.description}>
                <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                    placeholder="Observaciones, marca, medida o detalle"
                />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stock actual" error={form.errors.current_stock}>
                    <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={
                            method === 'patch' &&
                            form.data.stock_adjustment_type !== ''
                        }
                        value={form.data.current_stock}
                        onChange={(event) =>
                            setIntegerField('current_stock', event.target.value)
                        }
                    />
                </Field>

                <Field label="Stock minimo" error={form.errors.minimum_stock}>
                    <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.data.minimum_stock}
                        onChange={(event) =>
                            setIntegerField('minimum_stock', event.target.value)
                        }
                    />
                </Field>
            </div>

            {method === 'patch' && (
                <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
                    <Label>Ajuste de stock</Label>
                    <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr]">
                        <Button
                            type="button"
                            variant={
                                form.data.stock_adjustment_type === 'add'
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => selectAdjustment('add')}
                        >
                            <Plus className="size-4" />
                            Sumar
                        </Button>
                        <Button
                            type="button"
                            variant={
                                form.data.stock_adjustment_type === 'subtract'
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => selectAdjustment('subtract')}
                        >
                            <Minus className="size-4" />
                            Restar
                        </Button>
                        <Field
                            label="Cantidad"
                            error={form.errors.stock_adjustment_quantity}
                        >
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.data.stock_adjustment_quantity}
                                onChange={(event) =>
                                    setIntegerField(
                                        'stock_adjustment_quantity',
                                        event.target.value,
                                    )
                                }
                                disabled={!form.data.stock_adjustment_type}
                            />
                        </Field>
                    </div>
                    {adjustmentPreview !== null && (
                        <p
                            className={`text-sm font-medium ${
                                adjustmentPreview < 0
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            Stock resultante:{' '}
                            {adjustmentPreview.toLocaleString('es-AR', {
                                maximumFractionDigits: 0,
                            })}
                        </p>
                    )}
                </div>
            )}

            <label className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-3 text-sm">
                <input
                    type="checkbox"
                    checked={form.data.active}
                    onChange={(event) =>
                        form.setData('active', event.target.checked)
                    }
                    className="size-4 rounded border-input"
                />
                <span>Insumo activo</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={form.processing}>
                    {submitLabel}
                </Button>
                <Button asChild variant="outline" type="button">
                    <Link href={cancelHref}>Cancelar</Link>
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="grid gap-2">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </label>
    );
}

function integerValue(value: string | number): string {
    const numberValue = Number(value);

    return Number.isFinite(numberValue)
        ? Math.round(numberValue).toString()
        : '';
}
