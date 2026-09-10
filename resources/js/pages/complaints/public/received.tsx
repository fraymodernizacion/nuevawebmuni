import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { MunicipalBrand } from '@/components/municipal-brand';
import { track } from '@/routes/complaints/public';

export default function ComplaintReceived({
    complaint,
}: {
    complaint: { public_code: string };
}) {
    return (
        <>
            <Head title="Reclamo recibido" />
            <main className="flex min-h-screen items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
                <section className="mx-auto flex w-full max-w-lg flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-6 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                    <MunicipalBrand imageClassName="h-14" />
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <div>
                        <h1 className="text-3xl font-semibold tracking-normal">
                            Recibimos tu reclamo
                        </h1>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                            Podés utilizar este número para consultar el estado.
                        </p>
                    </div>
                    <div className="rounded-md bg-zinc-100 p-4 text-center text-2xl font-bold tracking-normal dark:bg-zinc-800">
                        {complaint.public_code}
                    </div>
                    <Link
                        href={track()}
                        className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 font-semibold text-white"
                    >
                        Consultar mi reclamo
                    </Link>
                </section>
            </main>
        </>
    );
}
