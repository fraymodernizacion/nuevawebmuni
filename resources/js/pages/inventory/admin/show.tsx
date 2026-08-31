import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    edit,
    index,
} from '@/routes/admin/inventory';

type Movement = {
    id: number;
    movement_type: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    description: string | null;
    created_at: string;
    user: { id: number; name: string } | null;
    complaint_intervention: { id: number; complaint_code: string } | null;
};

type Props = {
    item: {
        id: number;
        code: string;
        name: string;
        description: string | null;
        unit: string;
        current_stock: number;
        minimum_stock: number;
        qr_value: string;
        source_sheet: string | null;
        source_row: number | null;
        active: boolean;
        low_stock: boolean;
        movements_count: number;
        created_at: string | null;
        updated_at: string | null;
    };
    recentMovements: Movement[];
};

export default function InventoryShow({ item, recentMovements }: Props) {
    return (
        <>
            <Head title={item.name} />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                            {item.code}
                        </p>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            {item.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            QR: {item.qr_value}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={index()}>Volver</Link>
                        </Button>
                        <Button asChild>
                            <Link href={edit(item.id)}>Editar insumo</Link>
                        </Button>
                    </div>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Stock actual" value={item.current_stock} />
                    <Metric label="Stock minimo" value={item.minimum_stock} />
                    <Metric label="Movimientos" value={item.movements_count} />
                    <Metric
                        label="Estado"
                        value={item.low_stock ? 'Bajo stock' : 'OK'}
                    />
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle del insumo</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm">
                            <Row label="Descripcion" value={item.description ?? 'Sin descripcion'} />
                            <Row label="Unidad" value={item.unit} />
                            <Row label="Activo" value={item.active ? 'Si' : 'No'} />
                            <Row label="Origen" value={item.source_sheet ?? 'Carga manual'} />
                            <Row
                                label="Fila origen"
                                value={item.source_row?.toString() ?? '-'}
                            />
                            <Row
                                label="Actualizado"
                                value={item.updated_at ? new Date(item.updated_at).toLocaleString('es-AR') : '-'}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>QR / etiqueta</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                    Valor QR
                                </p>
                                <p className="mt-2 font-mono text-lg font-semibold">
                                    {item.qr_value}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Este valor es el que se escanea desde el
                                    reclamo cuando se carga material utilizado.
                                </p>
                            </div>
                            <Badge
                                variant={item.low_stock ? 'outline' : 'default'}
                                className="w-fit"
                            >
                                {item.low_stock ? 'Bajo stock' : 'Stock saludable'}
                            </Badge>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>Movimientos recientes</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {recentMovements.length > 0 ? (
                            recentMovements.map((movement, index) => (
                                <div key={movement.id}>
                                    {index > 0 && <Separator className="my-3" />}
                                    <div className="grid gap-2 text-sm md:grid-cols-[1fr_160px_140px] md:items-start">
                                        <div>
                                            <p className="font-semibold">
                                                {movement.description ?? movement.movement_type}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {movement.user?.name ?? 'Sistema'}
                                                {movement.complaint_intervention &&
                                                    ` · Reclamo ${movement.complaint_intervention.complaint_code}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">
                                                Cantidad
                                            </p>
                                            <p>{movement.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">
                                                Fecha
                                            </p>
                                            <p>
                                                {new Date(movement.created_at).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No hay movimientos registrados para este insumo.
                            </p>
                        )}
                    </CardContent>
                </Card>
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

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0 last:pb-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}

InventoryShow.layout = {
    breadcrumbs: [{ title: 'Inventario', href: index() }],
};
