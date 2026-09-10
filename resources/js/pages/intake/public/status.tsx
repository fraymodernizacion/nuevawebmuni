import { Head, Link } from '@inertiajs/react';
import { index } from '@/routes/intake/public';

type Props = {
    request: {
        public_code: string;
        type: string;
        status: string;
        summary: string;
        created_at: string;
        timeline: {
            action: string;
            status_label?: string | null;
            date: string;
            comment?: string | null;
        }[];
    };
};

export default function PublicIntakeStatus({ request }: Props) {
    return (
        <>
            <Head title={`Tramite ${request.public_code}`} />
            <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
                <section className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div>
                        <p className="text-sm text-zinc-500">Tramite</p>
                        <h1 className="text-3xl font-semibold tracking-normal">
                            {request.public_code}
                        </h1>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Info label="Tipo" value={request.type} />
                        <Info label="Estado" value={request.status} />
                        <Info label="Ingreso" value={request.created_at} />
                    </div>
                    <p className="rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
                        {request.summary}
                    </p>
                    <ol className="flex flex-col gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                        {request.timeline.map((item, index) => (
                            <li
                                key={`${item.date}-${index}`}
                                className="text-sm"
                            >
                                <span className="font-semibold">
                                    {item.date}
                                </span>
                                <p className="text-zinc-600 dark:text-zinc-300">
                                    {item.status_label ?? item.action}
                                </p>
                                {item.comment && <p>{item.comment}</p>}
                            </li>
                        ))}
                    </ol>
                    <Link
                        href={index()}
                        className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 font-semibold dark:border-zinc-700"
                    >
                        Volver a Mesa de Entrada
                    </Link>
                </section>
            </main>
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    );
}
