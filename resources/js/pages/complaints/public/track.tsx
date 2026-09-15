import { Head, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent } from 'react';
import { track as submitTrack } from '@/actions/App/Http/Controllers/PublicComplaintController';
import { MunicipalBrand } from '@/components/municipal-brand';

type ComplaintCategoryOption = {
    prefix: string;
    name: string;
};

type TrackComplaintProps = {
    complaintCategories: ComplaintCategoryOption[];
    currentYear: number;
};

export default function TrackComplaint({
    complaintCategories,
    currentYear,
}: TrackComplaintProps) {
    const defaultCategory = complaintCategories[0] ?? {
        prefix: 'ALU',
        name: 'Alumbrado publico',
    };
    const categoryOptions =
        complaintCategories.length > 0 ? complaintCategories : [defaultCategory];
    const { data, setData, post, processing, errors } = useForm({
        public_code: '',
        public_code_prefix: defaultCategory.prefix,
        public_code_year: currentYear.toString(),
        public_code_number: '',
        dni: '',
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
                    <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_1fr]">
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Tipo
                            <select
                                className="input"
                                value={data.public_code_prefix}
                                onChange={(event) =>
                                    setData(
                                        'public_code_prefix',
                                        event.target.value,
                                    )
                                }
                            >
                                {categoryOptions.map((category) => (
                                    <option
                                        key={`${category.prefix}-${category.name}`}
                                        value={category.prefix}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.public_code_prefix && (
                                <span className="text-xs text-red-600">
                                    {errors.public_code_prefix}
                                </span>
                            )}
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Año
                            <input
                                className="input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                value={data.public_code_year}
                                onChange={(event) =>
                                    setData(
                                        'public_code_year',
                                        event.target.value.replace(/\D+/g, ''),
                                    )
                                }
                            />
                            {errors.public_code_year && (
                                <span className="text-xs text-red-600">
                                    {errors.public_code_year}
                                </span>
                            )}
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                            Número
                            <input
                                className="input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={data.public_code_number}
                                onChange={(event) =>
                                    setData(
                                        'public_code_number',
                                        event.target.value.replace(/\D+/g, ''),
                                    )
                                }
                                placeholder="123"
                            />
                            {errors.public_code_number && (
                                <span className="text-xs text-red-600">
                                    {errors.public_code_number}
                                </span>
                            )}
                        </label>
                        {errors.public_code && (
                            <span className="text-xs text-red-600 sm:col-span-3">
                                {errors.public_code}
                            </span>
                        )}
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        DNI usado al iniciar
                        <input
                            className="input"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            value={data.dni}
                            onChange={(event) =>
                                setData(
                                    'dni',
                                    event.target.value.replace(/\D+/g, ''),
                                )
                            }
                        />
                        {errors.dni && (
                            <span className="text-xs text-red-600">
                                {errors.dni}
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
