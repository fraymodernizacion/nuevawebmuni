import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { index, track as trackCreate } from '@/routes/intake/public';

export default function IntakeReceived({
    request,
}: {
    request: { public_code: string; applicant_phone: string };
}) {
    return (
        <>
            <Head title="Solicitud recibida" />
            <main className="flex min-h-screen items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
                <section className="mx-auto flex w-full max-w-lg flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-6 text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <div>
                        <h1 className="text-3xl font-semibold tracking-normal">
                            Recibimos tu solicitud
                        </h1>
                        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                            Guarda este numero para consultar el avance.
                        </p>
                    </div>
                    <div className="rounded-md bg-zinc-100 p-4 text-center text-2xl font-bold tracking-normal dark:bg-zinc-800">
                        {request.public_code}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Link
                            href={trackCreate()}
                            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 font-semibold text-white"
                        >
                            Consultar estado
                        </Link>
                        <Link
                            href={index()}
                            className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 font-semibold dark:border-zinc-700"
                        >
                            Nueva solicitud
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}
