import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { index, track as trackCreate } from '@/routes/intake/public';

export default function IntakeReceived({
    request,
}: {
    request: { public_code: string };
}) {
    return (
        <>
            <Head title="Solicitud recibida" />
            <main className="flex min-h-screen items-center bg-municipal-surface px-4 py-8">
                <section className="mx-auto flex w-full max-w-lg flex-col gap-5 rounded-xl border border-t-4 border-municipal-outline border-t-municipal-lime bg-white p-6 text-lg text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <div>
                        <h1 className="text-3xl font-semibold tracking-normal">
                            Recibimos tu solicitud
                        </h1>
                        <p className="mt-2 text-zinc-700 dark:text-zinc-200">
                            Guardá este número. Para consultar cómo va tu
                            trámite, vas a necesitar ese número y el DNI sin
                            puntos.
                        </p>
                    </div>
                    <div className="rounded-md bg-municipal-tint p-4 text-center text-2xl font-bold tracking-normal [overflow-wrap:anywhere] text-municipal-link">
                        {request.public_code}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <Link
                            href={trackCreate()}
                            className="inline-flex min-h-12 items-center justify-center rounded-md bg-municipal-action px-4 py-2 text-center font-semibold text-municipal-on-action"
                        >
                            Consultar estado
                        </Link>
                        <Link
                            href={index()}
                            className="inline-flex min-h-12 items-center justify-center rounded-md border border-zinc-400 px-4 py-2 text-center font-semibold dark:border-zinc-600"
                        >
                            Nueva solicitud
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}
