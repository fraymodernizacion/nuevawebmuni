import { Head, Link, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { track } from '@/actions/App/Http/Controllers/PublicIntakeRequestController';
import { IntakePublicField as Field } from '@/components/intake-public-field';
import { index } from '@/routes/intake/public';

export default function TrackIntakeRequest({
    currentYear,
}: {
    currentYear: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        year: currentYear,
        number: '',
        applicant_dni: '',
    });
    const suffix = data.number.trim().toUpperCase();
    const preview =
        /^[1-9]\d{3}$/.test(data.year) && /^[A-Z0-9]*$/.test(suffix)
            ? `FME-${data.year}-${/^\d+$/.test(suffix) ? suffix.replace(/^0+/, '').padStart(6, '0') : suffix || '…'}`
            : null;

    function updateNumber(value: string) {
        const code = /^FME-(\d{4})-([A-Z0-9]+)$/i.exec(value.trim());

        if (code) {
            setData((previous) => ({
                ...previous,
                year: code[1],
                number: code[2].toUpperCase(),
            }));
        } else {
            setData('number', value);
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        post(track.url());
    }

    return (
        <>
            <Head title="Consultar cómo va mi trámite" />
            <main className="min-h-screen bg-municipal-surface px-4 py-8 text-lg text-zinc-950 dark:text-zinc-50">
                <form
                    onSubmit={submit}
                    className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-xl border border-t-4 border-municipal-outline border-t-municipal-lime bg-card p-5"
                >
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal text-municipal-link">
                            Consultar cómo va mi trámite
                        </h1>
                        <p className="mt-2 text-zinc-700 dark:text-zinc-200">
                            Tené a mano el código que recibiste y el DNI que
                            usaste al enviar el trámite.
                        </p>
                    </div>
                    <fieldset className="grid gap-3">
                        <legend className="pb-2 font-semibold">
                            Código de trámite
                        </legend>
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3">
                            <Field label="Año" required error={errors.year}>
                                <input
                                    className="input min-h-12 text-lg"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={data.year}
                                    onChange={(event) =>
                                        setData('year', event.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                label="Número final"
                                required
                                error={errors.number}
                            >
                                <input
                                    className="input min-h-12 text-lg"
                                    inputMode="numeric"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    value={data.number}
                                    onChange={(event) =>
                                        updateNumber(event.target.value)
                                    }
                                    placeholder="Ej. 42"
                                />
                            </Field>
                        </div>
                        <p className="text-base text-zinc-700 dark:text-zinc-200">
                            Escribí el número final sin los ceros del comienzo,
                            o pegá el código completo.
                        </p>
                        {preview && (
                            <p className="rounded-md bg-zinc-100 px-3 py-2 text-base [overflow-wrap:anywhere] dark:bg-zinc-800">
                                Código <strong>{preview}</strong>
                            </p>
                        )}
                    </fieldset>
                    <Field
                        label="DNI sin puntos"
                        required
                        error={errors.applicant_dni}
                    >
                        <input
                            className="input min-h-12 text-lg"
                            inputMode="numeric"
                            value={data.applicant_dni}
                            onChange={(event) =>
                                setData(
                                    'applicant_dni',
                                    event.target.value.replace(/[.\s]/g, ''),
                                )
                            }
                        />
                    </Field>
                    <button
                        disabled={processing}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-municipal-action px-4 font-semibold text-municipal-on-action disabled:opacity-60"
                    >
                        <Search className="size-5" />{' '}
                        {processing ? 'Consultando…' : 'Ver estado del trámite'}
                    </button>
                    <Link
                        href={index()}
                        className="inline-flex min-h-12 items-center justify-center text-center text-base font-medium text-municipal-link underline"
                    >
                        Volver a Mesa de Entrada
                    </Link>
                </form>
            </main>
        </>
    );
}
