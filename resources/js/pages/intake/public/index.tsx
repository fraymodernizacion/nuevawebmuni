import { Head, Link } from '@inertiajs/react';
import { ClipboardList, FileText, Search, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { create as createComplaint } from '@/routes/complaints/public';
import { create, track as trackCreate } from '@/routes/intake/public';

type IntakeType = {
    id: number;
    slug: string;
    name: string;
    category: string;
    description: string;
    color: string;
    estimated_time?: string | null;
    requirements: string[];
};

export default function PublicIntakeIndex({ types }: { types: IntakeType[] }) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const categories = [...new Set(types.map((type) => type.category))];
    const filteredTypes = useMemo(
        () =>
            types.filter((type) => {
                const matchesCategory = !category || type.category === category;
                const text = `${type.name} ${type.description} ${type.category}`;
                const matchesQuery = text
                    .toLowerCase()
                    .includes(query.toLowerCase());

                return matchesCategory && matchesQuery;
            }),
        [category, query, types],
    );

    return (
        <>
            <Head title="Mesa de Entrada Virtual" />
            <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                    <header className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 md:grid-cols-[1fr_auto] md:items-center dark:border-zinc-800 dark:bg-zinc-900">
                        <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                Municipalidad de Fray Mamerto Esquiu
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
                                Mesa de Entrada Virtual
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                                Inicia solicitudes, adjunta documentacion y
                                consulta el avance con tu numero de tramite.
                            </p>
                        </div>
                        <Link
                            href={trackCreate()}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
                        >
                            <Search className="size-4" /> Consultar tramite
                        </Link>
                    </header>

                    <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 md:grid-cols-[1fr_240px_auto] dark:border-zinc-800 dark:bg-zinc-900">
                        <label className="relative">
                            <Search className="absolute top-3 left-3 size-4 text-zinc-500" />
                            <input
                                className="input pl-9"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Buscar solicitud o tramite"
                            />
                        </label>
                        <select
                            className="input"
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                        >
                            <option value="">Todas las categorias</option>
                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                        <Link
                            href={createComplaint('alumbrado-publico')}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-semibold dark:border-zinc-700"
                        >
                            <ClipboardList className="size-4" /> Reclamos
                        </Link>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredTypes.map((type) => (
                            <Link
                                key={type.id}
                                href={create(type.slug)}
                                className="flex min-h-64 flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <span
                                    className="grid size-11 place-items-center rounded-md text-white"
                                    style={{ backgroundColor: type.color }}
                                >
                                    <FileText className="size-5" />
                                </span>
                                <div className="flex flex-1 flex-col gap-2">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase">
                                        {type.category}
                                    </p>
                                    <h2 className="text-xl font-semibold tracking-normal">
                                        {type.name}
                                    </h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                        {type.description}
                                    </p>
                                    {type.estimated_time && (
                                        <p className="text-sm font-medium">
                                            Tiempo estimado:{' '}
                                            {type.estimated_time}
                                        </p>
                                    )}
                                </div>
                                <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">
                                    <Send className="size-4" /> Iniciar
                                </span>
                            </Link>
                        ))}
                    </section>
                </div>
            </main>
        </>
    );
}
