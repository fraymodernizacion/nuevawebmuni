import { Head, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent } from 'react';
import { track as submitTrack } from '@/actions/App/Http/Controllers/PublicComplaintController';
import { MunicipalBrand } from '@/components/municipal-brand';

export default function TrackComplaint() {
    const { data, setData, post, processing, errors } = useForm({
        public_code: '',
        phone: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post(submitTrack.url());
    }

    return (
        <>
            <Head title="Consultar reclamo" />
            <main className="flex min-h-screen items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
                <form
                    onSubmit={submit}
                    className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <MunicipalBrand imageClassName="h-14" />
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Consultar reclamo
                    </h1>
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        Número de reclamo
                        <input
                            className="input"
                            value={data.public_code}
                            onChange={(event) =>
                                setData('public_code', event.target.value)
                            }
                            placeholder="ALU-2026-000001"
                        />
                        {errors.public_code && (
                            <span className="text-xs text-red-600">
                                {errors.public_code}
                            </span>
                        )}
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        Teléfono usado al iniciar
                        <input
                            className="input"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="tel-national"
                            value={data.phone}
                            onChange={(event) =>
                                setData(
                                    'phone',
                                    event.target.value.replace(/\D+/g, ''),
                                )
                            }
                        />
                        {errors.phone && (
                            <span className="text-xs text-red-600">
                                {errors.phone}
                            </span>
                        )}
                    </label>
                    <button
                        disabled={processing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
                    >
                        <Search className="size-4" /> Consultar
                    </button>
                </form>
            </main>
        </>
    );
}
