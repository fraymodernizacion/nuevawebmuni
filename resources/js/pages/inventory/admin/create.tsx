import { Head } from '@inertiajs/react';
import { index, store } from '@/routes/admin/inventory';
import { InventoryItemForm } from './item-form';

type Props = {
    item: {
        code: string;
        category_code: string;
        name: string;
        description: string | null;
        unit: string;
        current_stock: string;
        minimum_stock: string;
        active: boolean;
    };
    categories: {
        code: string;
        label: string;
    }[];
};

export default function InventoryCreate({ item, categories }: Props) {
    return (
        <>
            <Head title="Nuevo insumo" />
            <div className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Nuevo insumo
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Cargamos el insumo directamente al inventario general.
                    </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <InventoryItemForm
                        item={item}
                        categories={categories}
                        submitLabel="Crear insumo"
                        actionUrl={store.url()}
                        method="post"
                        cancelHref={index()}
                    />
                </div>
            </div>
        </>
    );
}

InventoryCreate.layout = {
    breadcrumbs: [{ title: 'Inventario', href: index() }],
};
