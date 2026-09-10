import { Head, useForm } from '@inertiajs/react';
import {
    Camera,
    CheckCircle2,
    ChevronDown,
    Clock4,
    MapPin,
    MessageCircle,
    Mic,
    MicOff,
    Phone,
    RotateCcw,
    Search,
    Upload,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { store as intervene } from '@/actions/App/Http/Controllers/Admin/ComplaintInterventionController';
import {
    ComplaintMaterialsPicker,
    type ComplaintMaterialInput,
} from '@/components/complaints/complaint-materials-picker';
import { StaticLocationMap } from '@/components/complaints/static-location-map';
import { WhatsappNotificationToggle } from '@/components/complaints/whatsapp-notification-toggle';
import {
    historyActionLabel,
    statusBadgeClass,
    statusLabel,
} from '@/lib/complaint-labels';

type DictationField =
    'observations' | 'internal_supplies_notes' | 'second_visit_reason';

type ResponseOption = {
    code: string;
    label: string;
    message: string;
    suggested_status: string;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
    onresult: ((event: SpeechRecognitionResultLike) => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionErrorLike = {
    error: string;
};

type SpeechRecognitionResultLike = {
    resultIndex: number;
    results: ArrayLike<{
        isFinal: boolean;
        0: { transcript: string };
    }>;
};

export default function CrewComplaintShow({
    complaint,
    canIntervene,
    inventoryItems,
    responseOptions,
}: any) {
    const neighborName =
        `${complaint.first_name} ${complaint.last_name ?? ''}`.trim();
    const neighborAddress = [
        complaint.street,
        complaint.street_number,
        complaint.neighborhood,
    ]
        .filter(Boolean)
        .join(' ');
    const initialPhotos = complaint.photos.filter(
        (photo: any) => photo.type === 'initial',
    );
    const formStorageKey = `crew-intervention-${complaint.id}`;
    const form = useForm({
        status: 'in_progress',
        response_code: '',
        citizen_message: '',
        observations: '',
        internal_supplies_notes: '',
        second_visit_reason: '',
        suggested_second_visit_date: '',
        photos: [] as File[],
        photo_type: 'intervention',
        send_whatsapp: false,
        materials: [] as ComplaintMaterialInput[],
    });
    const [activeDictationField, setActiveDictationField] =
        useState<DictationField | null>(null);
    const [dictationError, setDictationError] = useState('');
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

    useEffect(() => {
        const savedForm = window.localStorage.getItem(formStorageKey);

        if (!savedForm) {
            return;
        }

        try {
            const parsed = JSON.parse(savedForm);

            form.setData({
                ...form.data,
                ...parsed,
                photos: [],
            });
        } catch {
            window.localStorage.removeItem(formStorageKey);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            formStorageKey,
            JSON.stringify({
                status: form.data.status,
                response_code: form.data.response_code,
                citizen_message: form.data.citizen_message,
                observations: form.data.observations,
                internal_supplies_notes: form.data.internal_supplies_notes,
                second_visit_reason: form.data.second_visit_reason,
                suggested_second_visit_date:
                    form.data.suggested_second_visit_date,
                photo_type: form.data.photo_type,
                send_whatsapp: form.data.send_whatsapp,
                materials: form.data.materials,
            }),
        );
    }, [form.data, formStorageKey]);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(intervene.url(complaint.id), {
            forceFormData: true,
            onSuccess: () => window.localStorage.removeItem(formStorageKey),
        });
    }

    return (
        <>
            <Head title={complaint.type.name} />
            <div className="flex flex-col gap-4 p-3 pb-28 sm:p-4 sm:pb-4">
                <section className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-2xl font-semibold tracking-normal">
                                {complaint.type.name}
                            </h1>
                            <div className="mt-2 grid gap-1 text-sm">
                                <p>
                                    <span className="font-semibold">
                                        Localidad:
                                    </span>{' '}
                                    {complaint.locality.name}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Referencia:
                                    </span>{' '}
                                    {complaint.location_reference ||
                                        complaint.street ||
                                        'Sin referencia cargada'}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${statusBadgeClass(complaint.current_status)}`}
                        >
                            {statusLabel(complaint.current_status)}
                        </span>
                    </div>
                    {complaint.latitude && complaint.longitude && (
                        <a
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                            href={mapsUrl(
                                complaint.latitude,
                                complaint.longitude,
                            )}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <MapPin className="size-4" /> Como llegar
                        </a>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Reclamo {complaint.public_code} · Ingreso{' '}
                        {formatDateTime(complaint.created_at)}
                    </p>
                    {complaint.latitude && complaint.longitude && (
                        <StaticLocationMap
                            latitude={complaint.latitude}
                            longitude={complaint.longitude}
                            className="h-72 sm:h-96"
                        />
                    )}
                </section>

                <DetailsCard title="Datos del vecino" defaultOpen={false}>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <Info label="Nombre" value={neighborName} />
                        <Info label="Telefono" value={complaint.phone} />
                        {neighborAddress && (
                            <Info label="Referencia" value={neighborAddress} />
                        )}
                        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                            <a
                                href={phoneUrl(complaint.phone)}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold"
                            >
                                <Phone className="size-4" /> Llamar
                            </a>
                            <a
                                href={whatsappUrl(complaint.phone)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold"
                            >
                                <MessageCircle className="size-4" /> WhatsApp
                            </a>
                        </div>
                    </div>
                </DetailsCard>

                <section className="rounded-lg border bg-card p-4">
                    <h2 className="text-lg font-semibold">
                        Foto informada por el vecino
                    </h2>
                    {initialPhotos.length > 0 ? (
                        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
                            {initialPhotos.map((photo: any) => (
                                <a
                                    key={photo.id}
                                    href={photo.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="min-w-72 snap-start overflow-hidden rounded-md border bg-background"
                                >
                                    <img
                                        src={photo.url}
                                        alt="Foto informada por el vecino"
                                        className="aspect-video w-full object-cover"
                                    />
                                    <span className="block px-3 py-2 text-xs text-muted-foreground">
                                        {photo.taken_at || 'Sin fecha cargada'}
                                    </span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Este reclamo no tiene foto inicial cargada.
                        </p>
                    )}
                </section>

                <section className="rounded-lg border bg-card p-4">
                    <h2 className="text-lg font-semibold">
                        Registrar intervencion
                    </h2>
                    {!canIntervene && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            No tenes permisos para registrar intervenciones en
                            este reclamo.
                        </p>
                    )}
                    {canIntervene && (
                        <form
                            onSubmit={submit}
                            className="mt-3 flex flex-col gap-4"
                        >
                            <section className="grid gap-3">
                                <h3 className="font-semibold">
                                    ¿Cual es el resultado de esta visita?
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <StatusButton
                                        active={
                                            form.data.status === 'in_progress'
                                        }
                                        icon={<Search className="size-4" />}
                                        label="En relevamiento"
                                        onClick={() =>
                                            setInterventionStatus('in_progress')
                                        }
                                    />
                                    <StatusButton
                                        active={
                                            form.data.status ===
                                            'needs_second_visit'
                                        }
                                        icon={<RotateCcw className="size-4" />}
                                        label="Otra visita"
                                        onClick={() =>
                                            setInterventionStatus(
                                                'needs_second_visit',
                                            )
                                        }
                                    />
                                    <StatusButton
                                        active={form.data.status === 'resolved'}
                                        icon={
                                            <CheckCircle2 className="size-4" />
                                        }
                                        label="Resuelto"
                                        onClick={() =>
                                            setInterventionStatus('resolved')
                                        }
                                    />
                                </div>
                                {form.errors.status && (
                                    <p className="text-xs text-red-600">
                                        {form.errors.status}
                                    </p>
                                )}
                            </section>

                            <section className="grid gap-3 rounded-md border bg-muted/30 p-3">
                                <h3 className="font-semibold">
                                    Motivo / respuesta al vecino
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {responseOptions.map(
                                        (option: ResponseOption) => (
                                            <button
                                                key={option.code}
                                                type="button"
                                                className={`min-h-11 rounded-md border px-3 text-left text-sm font-semibold ${
                                                    form.data.response_code ===
                                                    option.code
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'bg-background hover:bg-muted'
                                                }`}
                                                onClick={() =>
                                                    selectResponse(option)
                                                }
                                            >
                                                {option.label}
                                            </button>
                                        ),
                                    )}
                                </div>
                                {form.errors.response_code && (
                                    <p className="text-xs text-red-600">
                                        {form.errors.response_code}
                                    </p>
                                )}
                            </section>

                            <FieldBlock
                                title="Mensaje al vecino"
                                help="Este mensaje podra ser enviado al vecino."
                                error={form.errors.citizen_message}
                            >
                                <textarea
                                    className="input min-h-36"
                                    value={form.data.citizen_message}
                                    onChange={(event) =>
                                        form.setData(
                                            'citizen_message',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Selecciona una respuesta o escribi el mensaje que recibira el vecino."
                                />
                            </FieldBlock>

                            <FieldBlock
                                title="Observacion interna"
                                help="Solo sera visible para el equipo municipal."
                                error={form.errors.observations}
                            >
                                <DictationTextarea
                                    value={form.data.observations}
                                    active={
                                        activeDictationField === 'observations'
                                    }
                                    className="min-h-32"
                                    onChange={(value) =>
                                        form.setData('observations', value)
                                    }
                                    onDictate={() =>
                                        toggleDictation('observations')
                                    }
                                />
                            </FieldBlock>

                            {form.data.status === 'needs_second_visit' && (
                                <FieldBlock
                                    title="Motivo de nueva visita"
                                    error={form.errors.second_visit_reason}
                                >
                                    <DictationTextarea
                                        value={form.data.second_visit_reason}
                                        active={
                                            activeDictationField ===
                                            'second_visit_reason'
                                        }
                                        className="min-h-28"
                                        onChange={(value) =>
                                            form.setData(
                                                'second_visit_reason',
                                                value,
                                            )
                                        }
                                        onDictate={() =>
                                            toggleDictation(
                                                'second_visit_reason',
                                            )
                                        }
                                    />
                                </FieldBlock>
                            )}

                            <FieldBlock
                                title="Insumos utilizados"
                                help="Escanea un QR o carga el codigo del insumo."
                                error={form.errors.materials}
                            >
                                <ComplaintMaterialsPicker
                                    inventoryItems={inventoryItems}
                                    materials={form.data.materials}
                                    onChange={(materials) =>
                                        form.setData('materials', materials)
                                    }
                                />
                            </FieldBlock>

                            <FieldBlock
                                title="Observacion interna de insumos"
                                help="Solo sera visible para administracion."
                                error={form.errors.internal_supplies_notes}
                            >
                                <DictationTextarea
                                    value={form.data.internal_supplies_notes}
                                    active={
                                        activeDictationField ===
                                        'internal_supplies_notes'
                                    }
                                    className="min-h-28"
                                    onChange={(value) =>
                                        form.setData(
                                            'internal_supplies_notes',
                                            value,
                                        )
                                    }
                                    onDictate={() =>
                                        toggleDictation(
                                            'internal_supplies_notes',
                                        )
                                    }
                                />
                            </FieldBlock>

                            {dictationError && (
                                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    {dictationError}
                                </p>
                            )}

                            <FieldBlock
                                title="Foto del trabajo"
                                help={
                                    form.data.status === 'resolved'
                                        ? 'Para reclamos resueltos se recomienda adjuntar una foto.'
                                        : 'La evidencia fotografica es opcional.'
                                }
                                error={form.errors.photos}
                            >
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <label className="order-1 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background text-sm font-medium hover:bg-muted/60 sm:order-2">
                                        <Upload className="size-5" />
                                        <span>Elegir de galeria</span>
                                        <input
                                            className="hidden"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(event) =>
                                                form.setData(
                                                    'photos',
                                                    Array.from(
                                                        event.target.files ??
                                                            [],
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="order-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background text-sm font-medium hover:bg-muted/60 sm:order-1">
                                        <Camera className="size-5" />
                                        <span>Tomar foto</span>
                                        <input
                                            className="hidden"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(event) =>
                                                form.setData('photos', [
                                                    ...form.data.photos,
                                                    ...Array.from(
                                                        event.target.files ??
                                                            [],
                                                    ),
                                                ])
                                            }
                                        />
                                    </label>
                                </div>
                                {form.data.photos.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {form.data.photos.length}{' '}
                                        {form.data.photos.length === 1
                                            ? 'foto seleccionada'
                                            : 'fotos seleccionadas'}
                                    </p>
                                )}
                            </FieldBlock>

                            <WhatsappNotificationToggle
                                checked={form.data.send_whatsapp}
                                onChange={(checked) =>
                                    form.setData('send_whatsapp', checked)
                                }
                                description="Enviar WhatsApp usando el mensaje al vecino."
                            />

                            <button
                                disabled={form.processing}
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <MessageCircle className="size-4" />
                                {form.processing
                                    ? 'Guardando...'
                                    : 'Guardar intervencion'}
                            </button>
                        </form>
                    )}
                </section>

                <DetailsCard title="Historial" defaultOpen={false}>
                    <div className="grid gap-3">
                        {complaint.history.map((event: any) => (
                            <article
                                key={event.id}
                                className="rounded-md border bg-background p-3 text-sm"
                            >
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock4 className="size-4" />
                                    {event.changed_at || 'Sin fecha'}
                                </p>
                                <p className="mt-1 font-semibold">
                                    {event.to_status
                                        ? statusLabel(event.to_status)
                                        : historyActionLabel(event.action)}
                                </p>
                                {event.user?.name && (
                                    <p className="text-xs text-muted-foreground">
                                        Usuario: {event.user.name}
                                    </p>
                                )}
                                {event.new_values?.response_code && (
                                    <p className="text-xs text-muted-foreground">
                                        Motivo: {event.new_values.response_code}
                                    </p>
                                )}
                                {event.observation && (
                                    <p className="mt-2 text-muted-foreground">
                                        {event.observation}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                </DetailsCard>
            </div>
            <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-2 border-t bg-background/95 p-3 shadow-lg backdrop-blur sm:hidden">
                <a
                    href={phoneUrl(complaint.phone)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold"
                >
                    <Phone className="size-4" />
                    Llamar
                </a>
                <a
                    href={whatsappUrl(complaint.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold"
                >
                    <MessageCircle className="size-4" />
                    Wsp
                </a>
                {complaint.latitude && complaint.longitude ? (
                    <a
                        href={mapsUrl(complaint.latitude, complaint.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                    >
                        <MapPin className="size-4" />
                        Llegar
                    </a>
                ) : (
                    <span className="inline-flex min-h-12 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">
                        Sin mapa
                    </span>
                )}
            </nav>
        </>
    );

    function setInterventionStatus(nextStatus: string) {
        form.setData({
            ...form.data,
            status: nextStatus,
            photo_type:
                nextStatus === 'resolved' ? 'resolution' : 'intervention',
        });
    }

    function selectResponse(option: ResponseOption) {
        form.setData({
            ...form.data,
            status: option.suggested_status,
            response_code: option.code,
            citizen_message: option.message,
            photo_type:
                option.suggested_status === 'resolved'
                    ? 'resolution'
                    : 'intervention',
            send_whatsapp: true,
        });
    }

    function toggleDictation(field: DictationField) {
        if (activeDictationField === field) {
            recognitionRef.current?.stop();
            recognitionRef.current = null;
            setActiveDictationField(null);

            return;
        }

        recognitionRef.current?.stop();

        const SpeechRecognition = getSpeechRecognitionConstructor(window);

        if (!SpeechRecognition) {
            setDictationError(
                'El dictado por microfono no esta disponible en este navegador. En Android suele funcionar con Chrome.',
            );

            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = 'es-AR';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .slice(event.resultIndex)
                .filter((result) => result.isFinal)
                .map((result) => result[0].transcript.trim())
                .filter(Boolean)
                .join(' ');

            if (transcript) {
                appendDictation(field, transcript);
            }
        };
        recognition.onerror = (event) => {
            setDictationError(
                event.error === 'not-allowed'
                    ? 'No se pudo acceder al microfono. Revisa el permiso del navegador para este sitio.'
                    : 'No se pudo iniciar el dictado. Intenta nuevamente.',
            );
            setActiveDictationField(null);
        };
        recognition.onend = () => {
            setActiveDictationField(null);
            recognitionRef.current = null;
        };

        setDictationError('');
        setActiveDictationField(field);
        recognitionRef.current = recognition;
        recognition.start();
    }

    function appendDictation(field: DictationField, transcript: string) {
        form.setData(
            field,
            [String(form.data[field]).trim(), transcript]
                .filter(Boolean)
                .join(' '),
        );
    }
}

function DetailsCard({
    children,
    defaultOpen,
    title,
}: {
    children: ReactNode;
    defaultOpen: boolean;
    title: string;
}) {
    return (
        <details
            open={defaultOpen}
            className="group rounded-lg border bg-card p-4"
        >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {title}
                <ChevronDown className="size-4 transition group-open:rotate-180" />
            </summary>
            <div className="mt-3">{children}</div>
        </details>
    );
}

function FieldBlock({
    children,
    error,
    help,
    title,
}: {
    children: ReactNode;
    error?: string;
    help?: string;
    title: string;
}) {
    return (
        <section className="grid gap-2 rounded-md border bg-background p-3">
            <div>
                <h3 className="font-semibold">{title}</h3>
                {help && (
                    <p className="text-xs text-muted-foreground">{help}</p>
                )}
            </div>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </section>
    );
}

function DictationTextarea({
    active,
    className = '',
    onChange,
    onDictate,
    value,
}: {
    active: boolean;
    className?: string;
    onChange: (value: string) => void;
    onDictate: () => void;
    value: string;
}) {
    return (
        <div className="grid gap-2">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onDictate}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold ${
                        active
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'bg-background hover:bg-muted'
                    }`}
                >
                    {active ? (
                        <MicOff className="size-4" />
                    ) : (
                        <Mic className="size-4" />
                    )}
                    {active ? 'Detener' : 'Dictar'}
                </button>
            </div>
            <textarea
                className={`input ${className}`}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function getSpeechRecognitionConstructor(
    windowObject: Window,
): SpeechRecognitionConstructor | null {
    const candidates = windowObject as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    return (
        candidates.SpeechRecognition ??
        candidates.webkitSpeechRecognition ??
        null
    );
}

function StatusButton({
    active,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-2 text-xs font-semibold ${
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted/60'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background p-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium break-words">{value}</p>
        </div>
    );
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function mapsUrl(latitude: string | number, longitude: string | number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function phoneUrl(phone: string) {
    return `tel:${phone.replace(/\D+/g, '')}`;
}

function whatsappUrl(phone: string) {
    const digits = phone.replace(/\D+/g, '');
    const normalized = digits.startsWith('549') ? digits : `549${digits}`;

    return `https://wa.me/${normalized}`;
}
