import { Head, Link, useRemember } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ClipboardList,
    FileText,
    GraduationCap,
    HeartHandshake,
    Landmark,
    Leaf,
    Lightbulb,
    MapPinHouse,
    Megaphone,
    Monitor,
    PawPrint,
    Presentation,
    Receipt,
    Scale,
    Search,
    Sparkles,
    Store,
    Trash2,
    TreeDeciduous,
    Wrench,
} from 'lucide-react';
import { useRef } from 'react';
import { MunicipalBrand } from '@/components/municipal-brand';
import { create as createComplaint } from '@/routes/complaints/public';
import { create, track } from '@/routes/intake/public';

type IntakeType = {
    id: number;
    slug: string;
    name: string;
    category: string;
    description: string;
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

const groupIcons: Record<string, typeof FileText> = {
    ambiente: Leaf,
    eventos: Megaphone,
    juventudes: GraduationCap,
    'comercio-bromatologia': Store,
    'rentas-tasas': Receipt,
    'catastro-obras-cementerio': MapPinHouse,
    'juzgado-faltas': Scale,
    'tesoreria-proveedores': Receipt,
    'modernizacion-punto-digital': Monitor,
    'servicios-publicos-asistencia-operativa': Wrench,
    'desarrollo-social-area-mujer-infancias': HeartHandshake,
    'cultura-deportes-turismo-emprendedurismo': Landmark,
};

const subtypeIcons: Record<string, typeof FileText> = {
    'retiro-residuos-domicilio': Trash2,
    'charla-ambiente': Presentation,
    'visita-planta': MapPinHouse,
    'desinfeccion-institucional': Sparkles,
    'castracion-domiciliaria': PawPrint,
    'charla-zoonosis': PawPrint,
    'visita-botanico': TreeDeciduous,
    'poda-cerca-cables': TreeDeciduous,
    poda: TreeDeciduous,
};

const searchAliases: Record<string, string> = {
    'que-bien-te-veo': 'lentes anteojos gafas receta oftalmológica',
    'prestamo-ortopedia': 'silla de ruedas muletas andador bastón',
    'retiro-residuos-domicilio':
        'recolección basura retirar basura domiciliaria',
    'desmalezado-limpieza': 'cortar pasto sacar yuyos limpiar terreno',
    'poda-cerca-cables': 'ramas sobre cables árbol en luminaria',
    'modulo-alimentario': 'ayuda alimentaria bolsón de alimentos mercadería',
    'castracion-domiciliaria': 'castrar esterilizar perro gato mascota',
    'exencion-tasas': 'exención descuento en impuestos municipales',
    'charla-ambiente': 'charla para la escuela escolar',
    'charlas-alimentacion': 'charla para la escuela escolar',
    'emociones-bullying': 'charla para la escuela escolar',
};

const stopWords = new Set(
    'a al como con de del el en es la las lo los me mi necesito para pedir por puedo que quiero se tengo un una y'.split(
        ' ',
    ),
);

const lighting = {
    title: 'Alumbrado público',
    description: 'Informá un problema de iluminación.',
    href: createComplaint.url('alumbrado-publico'),
    icon: Lightbulb,
    action: 'Hacer reclamo',
};

function searchTerms(query: string): string[] {
    const words = normalize(query).split(' ').filter(Boolean);
    const meaningful = words.filter((word) => !stopWords.has(word));

    return meaningful.length ? meaningful : words;
}

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function matches(terms: string[], ...values: (string | null | undefined)[]) {
    const text = normalize(values.filter(Boolean).join(' '));

    return terms.every((term) => text.includes(term));
}

export default function PublicIntakeIndex({ types }: { types: IntakeType[] }) {
    const [{ query, groupSlug }, setBrowseState] = useRemember(
        { query: '', groupSlug: '' },
        'intake.catalog',
    );
    const resultsRef = useRef<HTMLHeadingElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const group = types.find((type) => type.slug === groupSlug);
    const terms = searchTerms(query);
    const searching = terms.length > 0;
    const entries = types.flatMap<{
        type: IntakeType;
        subtype: IntakeSubtype | null;
    }>((type) =>
        type.subtypes.length
            ? type.subtypes.map((subtype) => ({ type, subtype }))
            : [{ type, subtype: null }],
    );
    const matchesLighting =
        searching &&
        matches(
            terms,
            lighting.title,
            'reclamo luz quemada quemo foco luminaria apagada calle iluminacion',
        );
    const results = searching
        ? entries.filter(({ type, subtype }) =>
              matches(
                  terms,
                  type.name,
                  type.category,
                  subtype?.name,
                  subtype?.description ?? type.description,
                  ...(subtype?.requirements ?? type.requirements),
                  subtype ? searchAliases[subtype.slug] : '',
              ),
          )
        : entries.filter(({ type }) => type === group);
    const waste = entries.find(
        ({ subtype }) => subtype?.slug === 'retiro-residuos-domicilio',
    );
    const environment = types.find((type) => type.slug === 'ambiente');
    const browsing = !searching && !group;

    function focusResults() {
        requestAnimationFrame(() => resultsRef.current?.focus());
    }

    function openGroup(slug: string) {
        setBrowseState({ query: '', groupSlug: slug });
        focusResults();
    }

    function showTopics() {
        setBrowseState({ query: '', groupSlug: '' });
        focusResults();
    }

    return (
        <>
            <Head title="Mesa de Entrada Virtual" />
            <main className="min-h-screen bg-municipal-surface px-4 py-5 text-base text-foreground sm:px-6 sm:py-7">
                <div className="mx-auto grid max-w-5xl gap-6">
                    <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-xl border border-municipal-outline bg-white px-4 py-3 sm:px-6">
                        <MunicipalBrand
                            compact
                            imageClassName="h-10 max-w-full"
                        />
                        <p className="border-s-2 border-municipal-pink ps-3 font-semibold text-municipal-navy">
                            Portal de Trámites
                        </p>
                    </header>
                    <section
                        aria-labelledby="titulo-portal"
                        className="grid gap-4 overflow-hidden rounded-xl border-t-4 border-municipal-lime bg-municipal-navy p-4 text-white sm:p-7"
                    >
                        <div className="grid gap-1">
                            <h1
                                id="titulo-portal"
                                className="text-[26px] leading-tight font-bold sm:text-4xl"
                            >
                                ¿Qué necesitás hacer?
                            </h1>
                            <p className="text-blue-100">
                                Encontrá un trámite municipal y realizalo desde
                                tu celular.
                            </p>
                        </div>
                        <div className="relative">
                            <Search
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-municipal-navy"
                            />
                            <input
                                ref={searchRef}
                                aria-label="Buscar un trámite"
                                type="search"
                                value={query}
                                placeholder="Ej. residuos, lentes, reclamos"
                                className="input min-h-14 rounded-xl border-transparent bg-white pl-12 text-lg text-municipal-navy ring-municipal-lime placeholder:text-slate-600"
                                onChange={(event) =>
                                    setBrowseState({
                                        query: event.target.value,
                                        groupSlug: '',
                                    })
                                }
                            />
                        </div>
                        <nav
                            aria-label="Acciones del portal"
                            className="grid gap-2 sm:grid-cols-2"
                        >
                            <button
                                type="button"
                                onClick={showTopics}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-municipal-lime px-4 py-2 text-center font-bold text-[#142300] hover:bg-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-municipal-lime"
                            >
                                Iniciar un trámite{' '}
                                <ArrowDown
                                    aria-hidden="true"
                                    className="size-5 shrink-0"
                                />
                            </button>
                            <Link
                                href={track()}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/60 bg-white px-4 py-2 text-center font-semibold text-municipal-navy hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-municipal-lime"
                            >
                                <ClipboardList
                                    aria-hidden="true"
                                    className="size-5 shrink-0 text-municipal-navy"
                                />{' '}
                                Consultar mi trámite
                            </Link>
                        </nav>
                    </section>

                    {browsing && (
                        <section
                            aria-labelledby="frecuentes"
                            className="grid gap-3"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-x-4">
                                <h2
                                    id="frecuentes"
                                    className="text-[22px] font-semibold"
                                >
                                    Trámites frecuentes
                                </h2>
                                <button
                                    type="button"
                                    onClick={showTopics}
                                    className="min-h-12 font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300"
                                >
                                    Ver todos
                                </button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-3">
                                {waste && (
                                    <ServiceCard
                                        title="Retiro de residuos"
                                        description="Solicitá el retiro en tu domicilio."
                                        href={subtypeUrl(
                                            waste.type,
                                            waste.subtype,
                                        )}
                                        icon={Trash2}
                                    />
                                )}
                                <ServiceCard {...lighting} />
                                {environment && (
                                    <ServiceCard
                                        title="Ambiente y espacios verdes"
                                        description="Consultas y solicitudes municipales."
                                        icon={Leaf}
                                        onClick={() =>
                                            openGroup(environment.slug)
                                        }
                                    />
                                )}
                            </div>
                        </section>
                    )}

                    <section
                        aria-labelledby="catalogo-tramites"
                        className="grid gap-3"
                    >
                        {!browsing && (
                            <button
                                type="button"
                                onClick={showTopics}
                                className="inline-flex min-h-12 w-fit items-center gap-2 font-semibold text-municipal-link"
                            >
                                <ArrowLeft
                                    aria-hidden="true"
                                    className="size-5"
                                />{' '}
                                Todos los temas
                            </button>
                        )}
                        <h2
                            id="catalogo-tramites"
                            ref={resultsRef}
                            tabIndex={-1}
                            className="scroll-mt-4 text-[22px] font-semibold outline-offset-4"
                        >
                            {searching
                                ? 'Resultados de búsqueda'
                                : (group?.name ?? 'Explorar trámites por tema')}
                        </h2>
                        {searching && (
                            <p
                                role="status"
                                className="text-zinc-700 dark:text-zinc-200"
                            >
                                {results.length + Number(matchesLighting)}{' '}
                                {results.length + Number(matchesLighting) === 1
                                    ? 'resultado'
                                    : 'resultados'}
                            </p>
                        )}
                        <div className="grid gap-2 md:grid-cols-2">
                            {browsing
                                ? types.map((type) => (
                                      <ServiceCard
                                          key={type.id}
                                          title={type.name}
                                          icon={
                                              groupIcons[type.slug] ?? FileText
                                          }
                                          description={
                                              type.subtypes.length > 0
                                                  ? `${type.subtypes.length} ${type.subtypes.length === 1 ? 'trámite' : 'trámites'}`
                                                  : undefined
                                          }
                                          onClick={() => openGroup(type.slug)}
                                      />
                                  ))
                                : results.map(({ type, subtype }) => (
                                      <ServiceCard
                                          key={
                                              subtype?.id
                                                  ? `subtype-${subtype.id}`
                                                  : `type-${type.id}`
                                          }
                                          title={subtype?.name ?? type.name}
                                          description={
                                              subtype?.description ??
                                              type.description
                                          }
                                          cost={
                                              subtype?.cost_information ??
                                              type.cost_information
                                          }
                                          action="Ver requisitos"
                                          href={subtypeUrl(type, subtype)}
                                          icon={
                                              (subtype &&
                                                  subtypeIcons[subtype.slug]) ||
                                              groupIcons[type.slug] ||
                                              FileText
                                          }
                                      />
                                  ))}
                            {matchesLighting && <ServiceCard {...lighting} />}
                        </div>
                        {searching && !results.length && !matchesLighting && (
                            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <p>
                                    No encontramos trámites. Probá con otra
                                    palabra, como «poda» o «lentes».
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBrowseState({
                                            query: '',
                                            groupSlug: '',
                                        });
                                        searchRef.current?.focus();
                                    }}
                                    className="min-h-12 font-semibold text-emerald-800 underline dark:text-emerald-300"
                                >
                                    Limpiar búsqueda
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}

function subtypeUrl(type: IntakeType, subtype: IntakeSubtype | null) {
    return create.url(
        type.slug,
        subtype ? { query: { subtipo: subtype.id } } : undefined,
    );
}

function ServiceCard({
    title,
    description,
    icon: Icon,
    cost,
    action,
    href,
    onClick,
}: {
    title: string;
    description?: string | null;
    icon: typeof FileText;
    cost?: string | null;
    action?: string;
} & (
    { href: string; onClick?: never } | { href?: never; onClick: () => void }
)) {
    const className =
        'flex min-h-16 min-w-0 items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-municipal-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-municipal-link dark:border-zinc-800 dark:bg-zinc-900';
    const content = (
        <>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-municipal-tint text-municipal-link">
                <Icon aria-hidden="true" className="size-6" />
            </span>
            <span className="grid min-w-0 flex-1 gap-1">
                <span className="font-semibold [overflow-wrap:anywhere]">
                    {title}
                </span>
                {description && (
                    <span className="text-zinc-700 dark:text-zinc-200">
                        {description}
                    </span>
                )}
                {cost && (
                    <span className="font-medium">
                        {/^(sin costo|gratuito|gratis)[.]?$/i.test(cost.trim())
                            ? 'Gratis'
                            : cost}
                    </span>
                )}
                {action && (
                    <span className="font-semibold text-municipal-link">
                        {action}
                    </span>
                )}
            </span>
            <ArrowRight
                aria-hidden="true"
                className="mt-2 size-5 shrink-0 text-municipal-link"
            />
        </>
    );

    return href ? (
        <Link href={href} className={className}>
            {content}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={className}>
            {content}
        </button>
    );
}
