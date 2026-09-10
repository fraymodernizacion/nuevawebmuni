import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type LabelItem = {
    id: number;
    code: string;
    name: string;
    unit: string;
    quick_url: string;
    quantity: number;
    qr_svg: string;
};

type Props = {
    items: LabelItem[];
    labels: LabelItem[];
    totalLabels: number;
};

export default function InventoryLabelsPrint({
    items,
    labels,
    totalLabels,
}: Props) {
    useEffect(() => {
        if (totalLabels > 0) {
            const timeout = window.setTimeout(() => window.print(), 350);

            return () => window.clearTimeout(timeout);
        }
    }, [totalLabels]);

    return (
        <>
            <Head title="Imprimir etiquetas QR" />
            <style>{`
                @page {
                    size: 80mm 40mm;
                    margin: 0;
                }

                @media print {
                    html,
                    body,
                    #app {
                        width: 80mm;
                        margin: 0 !important;
                        background: white !important;
                    }

                    .print-toolbar {
                        display: none !important;
                    }

                    .thermal-label {
                        break-after: page;
                        page-break-after: always;
                        box-shadow: none !important;
                    }

                    .thermal-label:last-child {
                        break-after: auto;
                        page-break-after: auto;
                    }
                }
            `}</style>
            <main className="min-h-screen bg-slate-200 print:bg-white">
                <div className="print-toolbar sticky top-0 z-10 border-b bg-white/95 p-4 shadow-sm backdrop-blur">
                    <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Etiquetas listas para imprimir
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {items.length} insumos seleccionados,{' '}
                                {totalLabels} etiquetas totales.
                            </p>
                        </div>
                        <Button type="button" onClick={() => window.print()}>
                            <Printer className="size-4" />
                            Imprimir ahora
                        </Button>
                    </div>
                </div>

                <section className="mx-auto grid w-fit gap-4 py-6 print:block print:py-0">
                    {labels.map((item, index) => (
                        <article
                            key={`${item.id}-${index}`}
                            className="thermal-label grid h-[40mm] w-[80mm] grid-cols-[31mm_1fr] gap-[3mm] overflow-hidden bg-white p-[4mm] text-black shadow-xl"
                        >
                            <div
                                className="flex items-center justify-center [&_svg]:h-[30mm] [&_svg]:w-[30mm]"
                                dangerouslySetInnerHTML={{
                                    __html: item.qr_svg,
                                }}
                            />
                            <div className="flex min-w-0 flex-col justify-center">
                                <p className="text-[9px] leading-tight font-black tracking-[0.08em] uppercase">
                                    Municipalidad de
                                </p>
                                <p className="text-[10px] leading-tight font-black uppercase">
                                    Fray Mamerto Esquiu
                                </p>
                                <p className="mt-[1mm] text-[8px] leading-tight font-semibold uppercase">
                                    Alumbrado Publico
                                </p>
                                <div className="my-[2mm] h-px bg-black/20" />
                                <p className="line-clamp-2 text-[10px] leading-tight font-black uppercase">
                                    {item.name}
                                </p>
                                <p className="mt-[1mm] font-mono text-[12px] leading-tight font-black">
                                    {item.code}
                                </p>
                                <p className="mt-[1mm] text-[7px] leading-tight font-semibold uppercase">
                                    Escanear para registrar movimiento
                                </p>
                            </div>
                        </article>
                    ))}

                    {labels.length === 0 && (
                        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-600 shadow">
                            No seleccionaste etiquetas para imprimir.
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
