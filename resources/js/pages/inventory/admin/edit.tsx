import { Head } from '@inertiajs/react';
import { index, show, update } from '@/routes/admin/inventory';
import { InventoryItemForm } from './item-form';

type Props = {
    item: {
        id: number;
        code: string;
        category_code: string | null;
        name: string;
        description: string | null;
        unit: string;
        current_stock: number;
        minimum_stock: number;
        active: boolean;
    };
    categories: {
        code: string;
        label: string;
    }[];
};

export default function InventoryEdit({ item, categories }: Props) {
    return (
        <>
            <Head title={`Editar ${item.code}`} />
            <div className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Editar insumo
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Ajustamos la ficha sin perder el historial de
                        movimientos.
                    </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <InventoryItemForm
                        item={item}
                        categories={categories}
                        submitLabel="Guardar cambios"
                        actionUrl={update.url(item.id)}
                        method="patch"
                        cancelHref={show(item.id)}
                    />
                </div>
            </div>
        </>
    );
}

InventoryEdit.layout = {
    breadcrumbs: [{ title: 'Inventario', href: index() }],
};
