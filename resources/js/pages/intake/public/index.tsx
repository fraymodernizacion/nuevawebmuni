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
    cost_information?: string | null;
    requirements: string[];
    subtypes: IntakeSubtype[];
};

type IntakeSubtype = {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    cost_information?: string | null;
    requirements: string[];
};

export default function PublicIntakeIndex({ types }: { types: IntakeType[] }) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const categories = [...new Set(types.map((type) => type.category))];
    const normalizedQuery = normalizeSearch(query);
    const filteredTypes = useMemo(
        () =>
            types.filter((type) => {
                const matchesCategory = !category || type.category === category;
                const matchesQuery =
                    normalizedQuery === '' ||
                    searchableTypeText(type).includes(normalizedQuery);

                return matchesCategory && matchesQuery;
            }),
        [category, normalizedQuery, types],
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
                            <ClipboardList className="size-4" /> Reclamo de
                            alumbrado
                        </Link>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredTypes.map((type) => (
                            <article
                                key={type.id}
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
                                    {type.cost_information && (
                                        <p className="text-sm font-medium">
                                            Costo: {type.cost_information}
                                        </p>
                                    )}
                                    <SubtypePreview
                                        type={type}
                                        query={normalizedQuery}
                                    />
                                </div>
                                <Link
                                    href={create(type.slug)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white"
                                >
                                    <Send className="size-4" /> Iniciar
                                </Link>
                            </article>
                        ))}
                        {filteredTypes.length === 0 && (
                            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 md:col-span-2 xl:col-span-3 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                No encontramos tramites o subtramites para esa
                                busqueda.
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}

function SubtypePreview({
    type,
    query,
}: {
    type: IntakeType;
    query: string;
}) {
    if (type.subtypes.length === 0) {
        return null;
    }

    const matchingSubtypes =
        query === ''
            ? type.subtypes.slice(0, 4)
            : type.subtypes
                  .filter((subtype) => searchableSubtypeText(subtype).includes(query))
                  .slice(0, 4);
    const previewSubtypes =
        matchingSubtypes.length > 0 ? matchingSubtypes : type.subtypes.slice(0, 4);
    const remainingCount = Math.max(type.subtypes.length - previewSubtypes.length, 0);

    return (
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold text-zinc-500 uppercase">
                Opciones disponibles
            </p>
            <div className="mt-2 flex flex-col gap-2">
                {previewSubtypes.map((subtype) => (
                    <Link
                        key={subtype.id}
                        href={create(type.slug, {
                            query: {
                                subtipo: subtype.id,
                            },
                        })}
                        className="rounded-md border border-zinc-200 bg-white p-2 text-left text-sm hover:border-emerald-500 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                    >
                        <span className="font-semibold">{subtype.name}</span>
                        {subtype.description && (
                            <span className="mt-1 line-clamp-2 block text-xs text-zinc-600 dark:text-zinc-300">
                                {subtype.description}
                            </span>
                        )}
                        {subtype.cost_information && (
                            <span className="mt-1 block text-xs font-medium">
                                Costo: {subtype.cost_information}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
            {remainingCount > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                    Y {remainingCount} opcion/es mas dentro de este grupo.
                </p>
            )}
        </div>
    );
}

function normalizeSearch(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

function searchableTypeText(type: IntakeType): string {
    return normalizeSearch(
        [
            type.name,
            type.description,
            type.category,
            type.cost_information,
            ...type.requirements,
            ...type.subtypes.flatMap((subtype) => [
                subtype.name,
                subtype.description,
                subtype.cost_information,
                ...subtype.requirements,
            ]),
        ]
            .filter(Boolean)
            .join(' '),
    );
}

function searchableSubtypeText(subtype: IntakeSubtype): string {
    return normalizeSearch(
        [
            subtype.name,
            subtype.description,
            subtype.cost_information,
            ...subtype.requirements,
        ]
            .filter(Boolean)
            .join(' '),
    );
}
