import { Link, useForm } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/inventory';

type InventoryItemFormValues = {
    code: string;
    name: string;
    description: string | null;
    unit: string;
    current_stock: string | number;
    minimum_stock: string | number;
    active: boolean;
};

type Props = {
    item: InventoryItemFormValues;
    submitLabel: string;
    actionUrl: string;
    method: 'post' | 'patch';
    cancelHref?: InertiaLinkProps['href'];
};

export function InventoryItemForm({
    item,
    submitLabel,
    actionUrl,
    method,
    cancelHref = index(),
}: Props) {
    const form = useForm({
        code: item.code,
        name: item.name,
        description: item.description ?? '',
        unit: item.unit,
        current_stock: String(item.current_stock),
        minimum_stock: String(item.minimum_stock),
        active: item.active,
    });

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
                <Field label="Código" error={form.errors.code}>
                    <Input
                        value={form.data.code}
                        onChange={(event) =>
                            form.setData('code', event.target.value)
                        }
                        autoComplete="off"
                        placeholder="ALU-0001"
                    />
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
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.data.current_stock}
                        onChange={(event) =>
                            form.setData('current_stock', event.target.value)
                        }
                    />
                </Field>

                <Field label="Stock minimo" error={form.errors.minimum_stock}>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.data.minimum_stock}
                        onChange={(event) =>
                            form.setData('minimum_stock', event.target.value)
                        }
                    />
                </Field>
            </div>

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
