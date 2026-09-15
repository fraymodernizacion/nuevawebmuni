import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { MunicipalBrand } from '@/components/municipal-brand';

type Props = {
    complaint: {
        public_code: string;
        category: string | null;
        type: string;
        created_at: string | null;
        status: string;
        updated_at: string | null;
        description: string | null;
        other_problem_description: string | null;
        location: {
            locality: string | null;
            zone: string | null;
            street: string | null;
            street_number: string | null;
            neighborhood: string | null;
            reference: string | null;
            latitude: string | null;
            longitude: string | null;
            maps_url: string | null;
        };
        photos: ComplaintPhoto[];
        timeline: {
            action: string;
            status: string | null;
            date: string | null;
            status_label: string | null;
            observation: string | null;
            photos: ComplaintPhoto[];
        }[];
    };
};

type ComplaintPhoto = {
    id: number;
    type: string;
    type_label: string;
    url: string;
    original_name: string | null;
    taken_at: string | null;
};

export default function PublicComplaintStatus({ complaint }: Props) {
    return (
        <>
            <Head title={`Reclamo ${complaint.public_code}`} />
            <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_26rem),linear-gradient(180deg,#f8fafc,#e2e8f0)] px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
                <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
                    <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <MunicipalBrand imageClassName="h-14" />
                        <p className="mt-5 text-sm font-semibold text-amber-600 uppercase">
                            Seguimiento de reclamo
                        </p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">
                                    {complaint.public_code}
                                </h1>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    {complaint.category ?? 'Reclamo municipal'}{' '}
                                    · {complaint.type}
                                </p>
                            </div>
                            <span className="w-fit rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                                {complaint.status}
                            </span>
                        </div>
                    </header>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Info
                            label="Ingreso"
                            value={complaint.created_at ?? '-'}
                        />
                        <Info
                            label="Última actualización"
                            value={complaint.updated_at ?? '-'}
                        />
                        <Info
                            label="Localidad"
                            value={complaint.location.locality ?? '-'}
                        />
                    </div>

                    <section className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="text-xl font-bold">Detalle informado</h2>
                        <div className="grid gap-3 text-sm">
                            <Detail
                                label="Problema"
                                value={
                                    complaint.other_problem_description ??
                                    complaint.description ??
                                    complaint.type
                                }
                            />
                            <Detail
                                label="Ubicación GPS"
                                value={
                                    <GpsLocation
                                        location={complaint.location}
                                    />
                                }
                            />
                        </div>
                    </section>

                    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-bold">
                                Fotos del reclamo
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Imagen cargada al iniciar el reclamo.
                            </p>
                        </div>

                        <PhotoGroup
                            className="mt-5"
                            title="Foto cargada por el vecino"
                            emptyText="El vecino no cargó foto inicial."
                            photos={complaint.photos}
                        />
                    </section>

                    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="text-xl font-bold">
                            Historial y observaciones
                        </h2>
                        <ol className="mt-5 flex flex-col gap-4 border-l border-zinc-200 pl-5 dark:border-zinc-800">
                            {complaint.timeline.map((item, index) => {
                                const isResolved = item.status === 'resolved';

                                return (
                                    <li
                                        key={`${item.date}-${index}`}
                                        className="relative text-sm"
                                    >
                                        <span
                                            className={`absolute top-1 -left-[27px] size-3 rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                                                isResolved
                                                    ? 'bg-emerald-500'
                                                    : 'bg-amber-500'
                                            }`}
                                        />
                                        <div
                                            className={`flex flex-col gap-1 rounded-2xl p-4 ${
                                                isResolved
                                                    ? 'border border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/30'
                                                    : 'bg-zinc-50 dark:bg-zinc-800/70'
                                            }`}
                                        >
                                            <span className="text-xs font-semibold text-zinc-500">
                                                {item.date ?? '-'}
                                            </span>
                                            <p
                                                className={`font-bold ${
                                                    isResolved
                                                        ? 'text-emerald-700 dark:text-emerald-300'
                                                        : ''
                                                }`}
                                            >
                                                {item.status_label ??
                                                    actionLabel(item.action)}
                                            </p>
                                            {item.observation ? (
                                                <p className="leading-6 text-zinc-700 dark:text-zinc-200">
                                                    {item.observation}
                                                </p>
                                            ) : (
                                                <p className="text-zinc-500 dark:text-zinc-400">
                                                    Sin observaciones
                                                    registradas.
                                                </p>
                                            )}
                                            {item.photos.length > 0 && (
                                                <TimelinePhotos
                                                    photos={item.photos}
                                                />
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                </section>
            </main>
        </>
    );
}

function GpsLocation({
    location,
}: {
    location: Props['complaint']['location'];
}) {
    if (!location.maps_url || !location.latitude || !location.longitude) {
        return <span>Sin ubicación GPS registrada</span>;
    }

    return (
        <div className="flex flex-col gap-2">
            <a
                href={location.maps_url}
                target="_blank"
                rel="noreferrer"
                className="w-fit rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
            >
                Ver ubicación en Google Maps
            </a>
            {location.reference ? (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {location.reference}
                </span>
            ) : null}
        </div>
    );
}

function PhotoGroup({
    className = '',
    title,
    emptyText,
    photos,
}: {
    className?: string;
    title: string;
    emptyText: string;
    photos: ComplaintPhoto[];
}) {
    return (
        <div className={className}>
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                {title}
            </h3>
            {photos.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {photos.map((photo) => (
                        <a
                            key={photo.id}
                            href={photo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-800/70"
                        >
                            <img
                                src={photo.url}
                                alt={photo.original_name ?? photo.type_label}
                                className="aspect-[4/3] w-full bg-zinc-100 object-cover transition group-hover:scale-[1.02] dark:bg-zinc-950"
                            />
                            <div className="flex flex-col gap-1 p-3 text-sm">
                                <span className="font-semibold">
                                    {photo.type_label}
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {photo.taken_at ??
                                        photo.original_name ??
                                        'Sin fecha registrada'}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400">
                    {emptyText}
                </p>
            )}
        </div>
    );
}

function TimelinePhotos({ photos }: { photos: ComplaintPhoto[] }) {
    return (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {photos.map((photo) => (
                <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900"
                >
                    <img
                        src={photo.url}
                        alt={photo.original_name ?? photo.type_label}
                        className="aspect-[4/3] w-full bg-zinc-100 object-cover transition group-hover:scale-[1.02] dark:bg-zinc-950"
                    />
                    <div className="flex flex-col gap-1 p-3">
                        <span className="font-semibold">
                            {photo.type_label}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {photo.taken_at ??
                                photo.original_name ??
                                'Sin fecha registrada'}
                        </span>
                    </div>
                </a>
            ))}
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/70">
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-1 leading-6">{value}</p>
        </div>
    );
}

function actionLabel(action: string) {
    return (
        {
            created: 'Reclamo recibido',
            assigned: 'Reclamo asignado',
            status_changed: 'Estado actualizado',
            intervention: 'Intervención registrada',
        }[action] ?? 'Movimiento registrado'
    );
}
