import { Head, Link, useForm } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Cable,
    Camera,
    HelpCircle,
    Lightbulb,
    LightbulbOff,
    MapPin,
    Navigation,
    Send,
    TriangleAlert,
    Upload,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { store } from '@/actions/App/Http/Controllers/PublicComplaintController';
import { InteractiveLocationMap } from '@/components/complaints/interactive-location-map';
import { MunicipalBrand } from '@/components/municipal-brand';
import { track } from '@/routes/complaints/public';

type ComplaintType = {
    id: number;
    name: string;
    requires_description: boolean;
};
type CitizenProblemOption = {
    id: number;
    name: string;
    description: string;
    icon: LucideIcon;
    requires_description: boolean;
};

type Props = {
    category: { id: number; name: string; slug: string };
    types: ComplaintType[];
};

export default function CreatePublicLightingComplaint({
    category,
    types,
}: Props) {
    const [geoMessage, setGeoMessage] = useState('');
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const cameraInputRef = useRef<HTMLInputElement | null>(null);
    const { data, setData, post, processing, errors, progress } = useForm({
        full_name: '',
        dni: '',
        phone: '',
        complaint_type_id: '',
        other_problem_description: '',
        description: '',
        location_reference: '',
        street: '',
        street_number: '',
        neighborhood: '',
        locality_id: '',
        latitude: '',
        longitude: '',
        photo: null as File | null,
    });

    const citizenProblemOptions = useMemo(
        () => buildCitizenProblemOptions(types),
        [types],
    );

    const selectedType = useMemo(
        () =>
            citizenProblemOptions.find(
                (type) => type.id.toString() === data.complaint_type_id,
            ),
        [citizenProblemOptions, data.complaint_type_id],
    );
    const photoPreviewUrl = useMemo(
        () => (data.photo ? URL.createObjectURL(data.photo) : null),
        [data.photo],
    );

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);

    function submit(event: FormEvent) {
        event.preventDefault();
        post(store.url(category.slug), { forceFormData: true });
    }

    function selectPhoto(file: File | null) {
        setData('photo', file);
        resetPhotoInputs();
    }

    function clearPhoto() {
        setData('photo', null);
        resetPhotoInputs();
    }

    function resetPhotoInputs() {
        if (galleryInputRef.current) {
            galleryInputRef.current.value = '';
        }

        if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
        }
    }

    function useMyLocation() {
        if (!navigator.geolocation) {
            setGeoMessage(
                'Este navegador no permite tomar tu ubicación. Tocá el mapa para marcar el lugar.',
            );

            return;
        }

        if (!window.isSecureContext) {
            setGeoMessage(
                'El navegador bloqueó la ubicación porque la página no está en un contexto seguro. Tocá el mapa para marcar el lugar.',
            );

            return;
        }

        setGeoMessage('Solicitando ubicación...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData('latitude', position.coords.latitude.toFixed(7));
                setData('longitude', position.coords.longitude.toFixed(7));
                setGeoMessage(
                    'Ubicación cargada. Podés corregirla si hace falta.',
                );
            },
            (error) => setGeoMessage(geolocationErrorMessage(error)),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
    }

    function markMunicipalArea() {
        setData('latitude', '-28.3830000');
        setData('longitude', '-65.7000000');
        setGeoMessage(
            'Marcamos una referencia inicial. Arrastrá el pin o tocá el mapa para ubicar el problema.',
        );
    }

    return (
        <>
            <Head title="Reclamo de Alumbrado Público" />
            <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
                    <header className="flex flex-col gap-2">
                        <div className="flex flex-col gap-4 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-emerald-950 dark:bg-zinc-900">
                            <MunicipalBrand imageClassName="h-14" />
                            <Link
                                href={track()}
                                className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-200 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-950"
                            >
                                Consultar reclamo
                            </Link>
                        </div>
                        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                            {category.name}
                        </h1>
                    </header>

                    <form
                        onSubmit={submit}
                        className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <section className="grid gap-3">
                            <StepHeading
                                number={1}
                                title="¿Qué problema encontraste?"
                            />
                            <ProblemTypePicker
                                error={errors.complaint_type_id}
                                selectedValue={data.complaint_type_id}
                                types={citizenProblemOptions}
                                onSelect={(value) =>
                                    setData('complaint_type_id', value)
                                }
                            />
                            {selectedType?.requires_description && (
                                <Field
                                    label="Descripción de otro problema"
                                    error={errors.other_problem_description}
                                >
                                    <input
                                        className="input"
                                        value={data.other_problem_description}
                                        onChange={(event) =>
                                            setData(
                                                'other_problem_description',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            )}
                            <Field
                                label="Contanos algo más (opcional)"
                                error={errors.description}
                            >
                                <textarea
                                    className="input min-h-28"
                                    placeholder="Si querés, agregá algún detalle que ayude a encontrar o entender el problema."
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </section>

                        <section className="grid gap-3 sm:grid-cols-2">
                            <StepHeading number={2} title="¿Dónde está?" />
                            <div className="flex flex-col gap-3 sm:col-span-2">
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={useMyLocation}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
                                    >
                                        <Navigation className="size-4" /> Usar
                                        mi ubicación
                                    </button>
                                    <button
                                        type="button"
                                        onClick={markMunicipalArea}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
                                    >
                                        <MapPin className="size-4" /> Marcar en
                                        el mapa
                                    </button>
                                </div>
                                {geoMessage && (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                        {geoMessage}
                                    </p>
                                )}
                                <InteractiveLocationMap
                                    latitude={data.latitude}
                                    longitude={data.longitude}
                                    onChange={(latitude, longitude) => {
                                        setData('latitude', latitude);
                                        setData('longitude', longitude);
                                        setGeoMessage(
                                            'Ubicación marcada en el mapa.',
                                        );
                                    }}
                                />
                                <p className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    <MapPin className="mt-0.5 size-4 shrink-0" />{' '}
                                    Tocá el mapa o arrastrá el pin hasta el
                                    lugar exacto del problema.
                                </p>
                                {(errors.latitude || errors.longitude) && (
                                    <p className="text-xs text-red-600">
                                        {errors.latitude || errors.longitude}
                                    </p>
                                )}
                                {data.latitude && data.longitude && (
                                    <p className="text-xs text-zinc-500">
                                        Punto marcado: {data.latitude},{' '}
                                        {data.longitude}
                                    </p>
                                )}
                            </div>
                            <Field
                                label="Referencia del lugar (opcional)"
                                error={errors.location_reference}
                                className="sm:col-span-2"
                            >
                                <input
                                    className="input"
                                    placeholder="Ej.: frente a la plaza, esquina de..., al lado de..."
                                    value={data.location_reference}
                                    onChange={(event) =>
                                        setData(
                                            'location_reference',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </section>

                        <section className="grid gap-3 sm:grid-cols-2">
                            <StepHeading
                                number={3}
                                title="¿Cómo podemos contactarte?"
                            />
                            <Field
                                label="Nombre y apellido"
                                error={errors.full_name}
                            >
                                <input
                                    className="input"
                                    value={data.full_name}
                                    onChange={(event) =>
                                        setData('full_name', event.target.value)
                                    }
                                />
                            </Field>
                            <Field label="DNI" error={errors.dni}>
                                <input
                                    className="input"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="off"
                                    maxLength={9}
                                    placeholder="Ej.: 30123456"
                                    value={data.dni}
                                    onChange={(event) =>
                                        setData(
                                            'dni',
                                            event.target.value.replace(
                                                /\D+/g,
                                                '',
                                            ),
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Celular / WhatsApp"
                                error={errors.phone}
                            >
                                <input
                                    className="input"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="tel-national"
                                    placeholder="Ej.: 3834218946"
                                    value={data.phone}
                                    onChange={(event) =>
                                        setData(
                                            'phone',
                                            event.target.value.replace(
                                                /\D+/g,
                                                '',
                                            ),
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Fotografía opcional"
                                error={errors.photo}
                                className="sm:col-span-2"
                            >
                                <div className="grid gap-3">
                                    <div className="rounded-md border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/60 dark:bg-blue-950/30">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-100">
                                            <Camera className="size-4" />
                                            Foto de referencia del lugar
                                        </div>
                                        <p className="mt-1 text-sm text-blue-900 dark:text-blue-100/80">
                                            Si podés adjuntar una foto, intentá
                                            que se vea el poste completo y una
                                            referencia del entorno.
                                        </p>
                                        <a
                                            href="/assets/complaints/photo-reference-lighting.png"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 block overflow-hidden rounded-md border border-blue-200 bg-white dark:border-blue-900 dark:bg-zinc-950"
                                        >
                                            <img
                                                src="/assets/complaints/photo-reference-lighting.png"
                                                alt="Ejemplo de foto correcta para reclamos de alumbrado público"
                                                className="max-h-[520px] w-full object-contain"
                                            />
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950">
                                        <Upload className="size-5" />
                                        <span>Elegir de galería</span>
                                        <input
                                            ref={galleryInputRef}
                                            className="hidden"
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                selectPhoto(
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950">
                                        <Camera className="size-5" />
                                        <span>Tomar con cámara</span>
                                        <input
                                            ref={cameraInputRef}
                                            className="hidden"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(event) =>
                                                selectPhoto(
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                {data.photo && photoPreviewUrl && (
                                    <div className="mt-3 overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
                                        <img
                                            src={photoPreviewUrl}
                                            alt="Foto seleccionada para el reclamo"
                                            className="aspect-video w-full object-cover"
                                        />
                                        <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                                                    {data.photo.name}
                                                </p>
                                                <p className="text-xs text-emerald-800 dark:text-emerald-100/80">
                                                    Esta foto se adjuntara al
                                                    reclamo.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={clearPhoto}
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-zinc-950 dark:text-emerald-100"
                                                >
                                                    <X className="size-4" />
                                                    Quitar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        galleryInputRef.current?.click()
                                                    }
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white"
                                                >
                                                    <Upload className="size-4" />
                                                    Reemplazar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Field>
                        </section>

                        {progress && (
                            <progress
                                value={progress.percentage}
                                max="100"
                                className="h-2 w-full"
                            />
                        )}
                        <button
                            disabled={processing}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:opacity-60"
                        >
                            <Send className="size-4" /> Enviar reclamo
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
}

function ProblemTypePicker({
    error,
    selectedValue,
    types,
    onSelect,
}: {
    error?: string;
    selectedValue: string;
    types: CitizenProblemOption[];
    onSelect: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <span className="text-sm font-medium">
                        Tipo de problema
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Elegi la opcion que mas se parece a lo que ves.
                    </p>
                </div>
                {selectedValue && (
                    <button
                        type="button"
                        className="text-xs font-medium text-zinc-500 underline underline-offset-4 dark:text-zinc-400"
                        onClick={() => onSelect('')}
                    >
                        Cambiar
                    </button>
                )}
            </div>
            <div
                className="grid gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Tipo de problema"
            >
                {types.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedValue === type.id.toString();

                    return (
                        <button
                            key={type.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`flex min-h-24 items-start gap-3 rounded-md border p-3 text-left transition ${
                                isSelected
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-50 dark:ring-emerald-900'
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
                            }`}
                            onClick={() => onSelect(type.id.toString())}
                        >
                            <span
                                className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                                    isSelected
                                        ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950'
                                        : 'bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                                }`}
                            >
                                <Icon className="size-5" />
                            </span>
                            <span className="flex min-w-0 flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    {type.name}
                                </span>
                                <span className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                                    {type.description}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}

function buildCitizenProblemOptions(
    types: ComplaintType[],
): CitizenProblemOption[] {
    return [
        {
            key: 'apagada',
            name: 'Luz apagada',
            description: 'La luz no enciende durante la noche.',
            icon: LightbulbOff,
            match: (name: string) =>
                normalizedProblemName(name).includes('apagada'),
        },
        {
            key: 'parpadea',
            name: 'Luz que parpadea',
            description: 'Prende y apaga o funciona por momentos.',
            icon: Zap,
            match: (name: string) =>
                normalizedProblemName(name).includes('intermitente') ||
                normalizedProblemName(name).includes('parpadea'),
        },
        {
            key: 'encendida-dia',
            name: 'Luz encendida de día',
            description: 'La luz permanece prendida durante el día.',
            icon: Lightbulb,
            match: (name: string) =>
                normalizedProblemName(name).includes('encendida'),
        },
        {
            key: 'poste',
            name: 'Poste dañado o caído',
            description:
                'El poste está torcido, roto, caído o presenta riesgo.',
            icon: TriangleAlert,
            match: (name: string) =>
                normalizedProblemName(name).includes('poste'),
        },
        {
            key: 'cables',
            name: 'Problema con cables',
            description: 'Hay cables cortados, sueltos, bajos o en mal estado.',
            icon: Cable,
            match: (name: string) =>
                normalizedProblemName(name).includes('cable'),
        },
        {
            key: 'otro',
            name: 'Otro problema',
            description: 'El problema no coincide con las opciones anteriores.',
            icon: HelpCircle,
            match: (name: string) =>
                normalizedProblemName(name).includes('otro'),
        },
    ].flatMap((option) => {
        const type = types.find((candidate) => option.match(candidate.name));

        if (!type) {
            return [];
        }

        return [
            {
                id: type.id,
                name: option.name,
                description: option.description,
                icon: option.icon,
                requires_description: type.requires_description,
            },
        ];
    });
}

function normalizedProblemName(name: string): string {
    const normalizedName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return normalizedName;
}

function StepHeading({ number, title }: { number: number; title: string }) {
    return (
        <h2 className="flex items-center gap-2 text-lg font-semibold sm:col-span-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {number}
            </span>
            {title}
        </h2>
    );
}

function Field({
    label,
    error,
    className = '',
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label
            className={`flex flex-col gap-1.5 text-sm font-medium ${className}`}
        >
            {label}
            {children}
            {error && <span className="text-xs text-red-600">{error}</span>}
        </label>
    );
}

function geolocationErrorMessage(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
        return 'El navegador no tiene permiso para usar tu ubicación. Habilitá el permiso o tocá el mapa para marcar el lugar.';
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
        return 'No pudimos detectar tu ubicación actual. Tocá el mapa para marcar el lugar.';
    }

    if (error.code === error.TIMEOUT) {
        return 'La ubicación tardó demasiado en responder. Podés intentar de nuevo o tocar el mapa para marcar el lugar.';
    }

    return 'No pudimos tomar tu ubicación. Tocá el mapa para marcar el lugar.';
}
