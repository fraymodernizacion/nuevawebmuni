import { Head, Link, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent } from 'react';
import { track } from '@/actions/App/Http/Controllers/PublicIntakeRequestController';
import { index } from '@/routes/intake/public';

export default function TrackIntakeRequest() {
    const { data, setData, post, processing, errors } = useForm({
        public_code: '',
        applicant_phone: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post(track.url());
    }

    return (
        <>
            <Head title="Consultar tramite" />
            <main className="flex min-h-screen items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
                <form
                    onSubmit={submit}
                    className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Consultar tramite
                        </h1>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            Ingresá el numero recibido y el telefono usado en la
                            solicitud.
                        </p>
                    </div>
                    <Field label="Numero de tramite" error={errors.public_code}>
                        <input
                            className="input"
                            value={data.public_code}
                            onChange={(event) =>
                                setData('public_code', event.target.value)
                            }
                            placeholder="FME-2026-000001"
                        />
                    </Field>
                    <Field
                        label="Telefono usado al iniciar"
                        error={errors.applicant_phone}
                    >
                        <input
                            className="input"
                            inputMode="tel"
                            value={data.applicant_phone}
                            onChange={(event) =>
                                setData('applicant_phone', event.target.value)
                            }
                        />
                    </Field>
                    <button
                        disabled={processing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
                    >
                        <Search className="size-4" /> Consultar
                    </button>
                    <Link
                        href={index()}
                        className="text-center text-sm font-medium text-blue-700 dark:text-blue-300"
                    >
                        Volver a Mesa de Entrada
                    </Link>
                </form>
            </main>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
            {label}
            {children}
            {error && <span className="text-xs text-red-600">{error}</span>}
        </label>
    );
}
