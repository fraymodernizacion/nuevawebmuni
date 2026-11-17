import { Head, Link, useForm } from '@inertiajs/react';
import {
    Camera,
    ClipboardList,
    FileText,
    Send,
    Upload,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { store } from '@/actions/App/Http/Controllers/PublicIntakeRequestController';
import { IntakePublicField as Field } from '@/components/intake-public-field';
import type { IntakeFieldAria } from '@/components/intake-public-field';
import { index } from '@/routes/intake/public';

type SchemaField = {
    name: string;
    label: string;
    type?: 'text' | 'textarea' | 'date' | 'time' | 'select';
    required?: boolean;
    options?: string[];
};

type IntakeType = {
    slug: string;
    name: string;
    category: string;
    description: string;
    cost_information?: string | null;
    requirements: string[];
    schema: SchemaField[];
    subtypes: IntakeSubtype[];
};

type IntakeSubtype = {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    cost_information?: string | null;
    result_information?: string | null;
    requirements: string[];
    schema: SchemaField[];
};

export default function CreateIntakeRequest({
    type,
    initialSubtypeId,
    emailNotificationsEnabled,
}: {
    type: IntakeType;
    initialSubtypeId: number | null;
    emailNotificationsEnabled: boolean;
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        progress,
        clearErrors,
        setError,
    } = useForm({
        applicant_name: '',
        applicant_dni: '',
        applicant_phone: '',
        applicant_email: '',
        applicant_address: '',
        intake_request_subtype_id: initialSubtypeId?.toString() ?? '',
        summary: '',
        fields: {} as Record<string, string>,
        attachments: [] as File[],
    });
    const [step, setStep] = useState(0);
    const stepRef = useRef<HTMLHeadingElement>(null);
    const steps = ['Información', 'Completar datos', 'Revisar y enviar'];
    const selectedSubtype =
        type.subtypes.find(
            (subtype) =>
                subtype.id.toString() === data.intake_request_subtype_id,
        ) ?? null;
    const displayedRequirements =
        selectedSubtype?.requirements.length || type.requirements.length === 0
            ? (selectedSubtype?.requirements ?? type.requirements)
            : type.requirements;
    const displayedSchema = selectedSubtype?.schema ?? type.schema;
    const displayedCost =
        selectedSubtype?.cost_information ?? type.cost_information;
    const needsSubtype = type.subtypes.length > 0 && !selectedSubtype;
    const attachmentMessages = [
        ...new Set(
            Object.entries(errors)
                .filter(
                    ([key]) =>
                        key === 'attachments' || key.startsWith('attachments.'),
                )
                .map(([key, message]) => {
                    const position = /^attachments\.(\d+)$/.exec(key);
                    const file = position
                        ? data.attachments[Number(position[1])]
                        : undefined;

                    return file ? `${file.name}. ${message}` : message;
                }),
        ),
    ];
    const hasAttachmentErrors = attachmentMessages.length > 0;
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            formRef.current
                ?.querySelector<HTMLElement>('[aria-invalid="true"]')
                ?.focus();
        }
    }, [errors, step]);

    function goToStep(next: number) {
        setStep(next);
        requestAnimationFrame(() => {
            if (
                !formRef.current?.contains(document.activeElement) ||
                !formRef.current?.querySelector('[aria-invalid="true"]:focus')
            ) {
                stepRef.current?.focus();
            }
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (needsSubtype) {
            setError(
                'intake_request_subtype_id',
                'Elegí un trámite de la lista.',
            );
            goToStep(0);
            return;
        }
        if (step === 0) {
            goToStep(1);
            return;
        }
        if (step === 1) {
            const missing = Object.fromEntries(
                displayedSchema
                    .filter(
                        (field) =>
                            field.required && !data.fields[field.name]?.trim(),
                    )
                    .map((field) => [
                        `fields.${field.name}`,
                        field.type === 'select'
                            ? 'Elegí una opción de la lista.'
                            : 'Completá este dato.',
                    ]),
            );
            if (data.attachments.length > 5) {
                missing.attachments =
                    'Podés adjuntar hasta 5 archivos. Quitá los que sobran.';
            } else {
                data.attachments.forEach((file, index) => {
                    if (file.size > 10 * 1024 * 1024) {
                        missing[`attachments.${index}`] =
                            'Este archivo supera los 10 MB. Quitalo para continuar.';
                    }
                });
            }
            if (!data.applicant_name.trim())
                missing.applicant_name = 'Ingresá tu nombre y apellido.';
            if (!/^[0-9]{1,8}$/.test(data.applicant_dni))
                missing.applicant_dni =
                    'Ingresá el DNI de quien presenta la solicitud, sin puntos.';
            if (!data.applicant_phone.trim())
                missing.applicant_phone =
                    'Ingresá un teléfono para que podamos contactarte.';
            if (emailNotificationsEnabled && !data.applicant_email.trim())
                missing.applicant_email =
                    'Ingresá el correo donde querés recibir los avisos del trámite.';
            clearErrors();
            if (Object.keys(missing).length) {
                setError(missing);
                return;
            }
            goToStep(2);
            return;
        }
        post(store.url(type.slug), {
            forceFormData: true,
            preserveScroll: true,
            onError: (requestErrors) =>
                goToStep(requestErrors.intake_request_subtype_id ? 0 : 1),
            onHttpException: (response) => {
                if (response.status === 413) {
                    setError(
                        'attachments',
                        'El servidor rechazó el tamaño total. Reducí el peso de los archivos y volvé a revisar la solicitud.',
                    );
                    goToStep(1);

                    return false;
                }
            },
        });
    }

    function setField(name: string, value: string) {
        setData('fields', { ...data.fields, [name]: value });
    }

    function addAttachments(files: FileList | null) {
        const selected = [...data.attachments];
        for (const file of Array.from(files ?? [])) {
            if (
                !selected.some(
                    (item) =>
                        item.name === file.name &&
                        item.size === file.size &&
                        item.lastModified === file.lastModified,
                )
            ) {
                selected.push(file);
            }
        }
        setData('attachments', selected);
    }

    return (
        <>
            <Head title={selectedSubtype?.name ?? type.name} />
            <main className="min-h-screen bg-municipal-surface px-4 py-6 text-lg text-zinc-950 dark:text-zinc-50">
                <form
                    ref={formRef}
                    onSubmit={submit}
                    className="mx-auto flex w-full max-w-3xl flex-col gap-5"
                >
                    <header className="flex flex-col gap-2">
                        <Link
                            href={index()}
                            className="inline-flex min-h-11 w-fit items-center text-base font-medium text-municipal-link underline"
                        >
                            Volver a Mesa de Entrada
                        </Link>
                        <p className="text-base font-medium text-municipal-link">
                            {type.category}
                        </p>
                        <h1 className="text-[26px] leading-tight font-bold tracking-normal">
                            {selectedSubtype?.name ?? type.name}
                        </h1>
                        {!selectedSubtype && (
                            <p className="text-zinc-700 dark:text-zinc-200">
                                {type.description}
                            </p>
                        )}
                    </header>

                    <ol
                        aria-label="Pasos de la solicitud"
                        className="grid grid-cols-3 gap-2"
                    >
                        {steps.map((label, position) => (
                            <li
                                key={label}
                                aria-current={
                                    position === step ? 'step' : undefined
                                }
                                className={
                                    position === step
                                        ? 'border-t-4 border-municipal-lime pt-2 text-base font-semibold text-municipal-link'
                                        : 'border-t-4 border-zinc-300 pt-2 text-base text-zinc-700 dark:border-zinc-600 dark:text-zinc-200'
                                }
                            >
                                <span className="block">{position + 1}.</span>{' '}
                                {label}
                            </li>
                        ))}
                    </ol>
                    <h2
                        ref={stepRef}
                        tabIndex={-1}
                        className="scroll-mt-4 text-[22px] font-semibold outline-offset-4"
                    >
                        {steps[step]}
                    </h2>

                    {Object.keys(errors).length > 0 && (
                        <p
                            role="alert"
                            className="rounded-md border border-red-300 bg-red-50 p-3 text-base font-semibold text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                        >
                            Revisá los campos marcados para continuar.
                        </p>
                    )}

                    {step === 0 && type.subtypes.length > 0 && (
                        <Field
                            label="Elegí el trámite que querés hacer"
                            required
                            error={errors.intake_request_subtype_id}
                        >
                            <select
                                className="input min-h-12 text-lg"
                                value={data.intake_request_subtype_id}
                                onChange={(event) => {
                                    clearErrors();
                                    setData({
                                        ...data,
                                        intake_request_subtype_id:
                                            event.target.value,
                                        fields: {},
                                    });
                                }}
                            >
                                <option value="">Seleccioná un trámite</option>
                                {type.subtypes.map((subtype) => (
                                    <option
                                        key={subtype.id}
                                        value={subtype.id.toString()}
                                    >
                                        {subtype.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}

                    {step === 0 && !needsSubtype && (
                        <section className="grid gap-2 rounded-md border border-l-4 border-blue-200 border-l-blue-700 bg-blue-50 p-4 text-blue-950 dark:border-blue-900/60 dark:border-l-blue-400 dark:bg-blue-950/30 dark:text-blue-100">
                            <h2 className="text-xl font-semibold">
                                Antes de empezar
                            </h2>
                            <p>
                                <strong>Costo</strong> ·{' '}
                                {displayedCost &&
                                /^(sin costo|gratis|gratuito)[.]?$/i.test(
                                    displayedCost.trim(),
                                )
                                    ? 'Gratis'
                                    : (displayedCost ??
                                      'A confirmar por el área.')}
                            </p>
                            {displayedRequirements.length > 0 && (
                                <ul className="list-disc space-y-1 pl-5">
                                    {displayedRequirements.map(
                                        (requirement) => (
                                            <li key={requirement}>
                                                {requirement}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                            {selectedSubtype?.result_information && (
                                <p>{selectedSubtype.result_information}</p>
                            )}
                            <p>
                                Vas a recibir un número para consultar el estado
                                de tu trámite en este portal.
                            </p>
                        </section>
                    )}

                    {step === 1 && (
                        <>
                            <section className="grid gap-3 border-t border-zinc-200 pt-5 sm:grid-cols-2 dark:border-zinc-800">
                                <h2 className="flex items-center gap-2 text-xl font-semibold sm:col-span-2">
                                    <UserRound
                                        aria-hidden="true"
                                        className="size-5 shrink-0 text-municipal-link"
                                    />
                                    Tus datos
                                </h2>
                                <p className="text-base text-zinc-700 sm:col-span-2 dark:text-zinc-200">
                                    Los campos con asterisco (*) son
                                    obligatorios.
                                </p>
                                <Field
                                    label="Nombre y apellido"
                                    required
                                    error={
                                        errors.applicant_name &&
                                        (!data.applicant_name.trim()
                                            ? 'Ingresá tu nombre y apellido.'
                                            : errors.applicant_name)
                                    }
                                >
                                    <input
                                        className="input min-h-12 text-lg"
                                        autoComplete="name"
                                        value={data.applicant_name}
                                        onChange={(event) =>
                                            setData(
                                                'applicant_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
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
                                                event.target.value.replace(
                                                    /[.\s]/g,
                                                    '',
                                                ),
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Teléfono de contacto"
                                    required
                                    error={
                                        errors.applicant_phone &&
                                        (!data.applicant_phone.trim()
                                            ? 'Ingresá un teléfono para que podamos contactarte.'
                                            : errors.applicant_phone)
                                    }
                                >
                                    <input
                                        className="input min-h-12 text-lg"
                                        type="tel"
                                        autoComplete="tel"
                                        value={data.applicant_phone}
                                        onChange={(event) =>
                                            setData(
                                                'applicant_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label={
                                        emailNotificationsEnabled
                                            ? 'Correo electrónico para recibir avisos'
                                            : 'Correo electrónico (opcional)'
                                    }
                                    required={emailNotificationsEnabled}
                                    error={errors.applicant_email}
                                >
                                    <input
                                        className="input min-h-12 text-lg"
                                        type="email"
                                        autoComplete="email"
                                        value={data.applicant_email}
                                        onChange={(event) =>
                                            setData(
                                                'applicant_email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Domicilio (opcional)"
                                    error={errors.applicant_address}
                                >
                                    <input
                                        className="input min-h-12 text-lg"
                                        autoComplete="street-address"
                                        value={data.applicant_address}
                                        onChange={(event) =>
                                            setData(
                                                'applicant_address',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </section>

                            <section className="grid gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                                <h2 className="flex items-center gap-2 text-xl font-semibold">
                                    <ClipboardList
                                        aria-hidden="true"
                                        className="size-5 shrink-0 text-municipal-link"
                                    />
                                    Tu pedido
                                </h2>
                                {displayedSchema.map((field) => (
                                    <Field
                                        key={field.name}
                                        label={field.label}
                                        required={field.required}
                                        error={
                                            errors[`fields.${field.name}`] &&
                                            (!data.fields[field.name]?.trim()
                                                ? field.type === 'select'
                                                    ? 'Elegí una opción de la lista.'
                                                    : 'Completá este dato.'
                                                : errors[
                                                      `fields.${field.name}`
                                                  ])
                                        }
                                    >
                                        <DynamicField
                                            field={field}
                                            value={
                                                data.fields[field.name] ?? ''
                                            }
                                            onChange={(value) =>
                                                setField(field.name, value)
                                            }
                                        />
                                    </Field>
                                ))}
                            </section>

                            <section
                                aria-labelledby="documentos"
                                className="grid gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800"
                            >
                                <h2
                                    id="documentos"
                                    className="flex items-center gap-2 text-xl font-semibold"
                                >
                                    <FileText
                                        aria-hidden="true"
                                        className="size-5 shrink-0 text-municipal-link"
                                    />{' '}
                                    Documentos
                                </h2>
                                <p id="ayuda-documentos">
                                    Si el trámite pide una nota, una foto u otro
                                    documento, agregalo acá. Podés adjuntar
                                    hasta 5 archivos de 10 MB cada uno.
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-400 bg-municipal-surface px-3 text-center font-semibold has-[:focus-visible]:ring-2 dark:border-zinc-600">
                                        <Upload className="size-5" />
                                        <span>Elegir archivos</span>
                                        <input
                                            className="sr-only"
                                            type="file"
                                            multiple
                                            aria-invalid={
                                                hasAttachmentErrors || undefined
                                            }
                                            aria-describedby={
                                                hasAttachmentErrors
                                                    ? 'ayuda-documentos error-documentos'
                                                    : 'ayuda-documentos'
                                            }
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                            onChange={(event) => {
                                                addAttachments(
                                                    event.target.files,
                                                );
                                                event.target.value = '';
                                            }}
                                        />
                                    </label>
                                    <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-400 bg-municipal-surface px-3 text-center font-semibold has-[:focus-visible]:ring-2 dark:border-zinc-600">
                                        <Camera className="size-5" />
                                        <span>Tomar foto</span>
                                        <input
                                            className="sr-only"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            aria-describedby="ayuda-documentos"
                                            onChange={(event) => {
                                                addAttachments(
                                                    event.target.files,
                                                );
                                                event.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                                {data.attachments.length > 0 && (
                                    <ul
                                        aria-label="Archivos seleccionados"
                                        className="grid gap-2"
                                    >
                                        {data.attachments.map(
                                            (file, position) => (
                                                <li
                                                    key={`${file.name}-${file.size}-${file.lastModified}`}
                                                    className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-1 dark:border-zinc-700"
                                                >
                                                    <span className="min-w-0 [overflow-wrap:anywhere]">
                                                        {file.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        aria-label={`Quitar ${file.name}`}
                                                        className="min-h-11 text-base font-semibold text-municipal-link underline"
                                                        onClick={() =>
                                                            setData(
                                                                'attachments',
                                                                data.attachments.filter(
                                                                    (
                                                                        _,
                                                                        index,
                                                                    ) =>
                                                                        index !==
                                                                        position,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        Quitar
                                                    </button>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                                {hasAttachmentErrors && (
                                    <ul
                                        id="error-documentos"
                                        className="list-disc space-y-1 pl-5 text-base font-semibold [overflow-wrap:anywhere] text-red-800 dark:text-red-300"
                                    >
                                        {attachmentMessages.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    )}

                    {step === 2 && (
                        <section
                            aria-label="Datos para revisar"
                            className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <dl className="grid gap-3 [overflow-wrap:anywhere]">
                                {[
                                    [
                                        'Trámite',
                                        selectedSubtype?.name ?? type.name,
                                    ],
                                    ['Nombre y apellido', data.applicant_name],
                                    [
                                        'Teléfono de contacto',
                                        data.applicant_phone,
                                    ],
                                    ['DNI', data.applicant_dni],
                                    [
                                        'Correo electrónico',
                                        data.applicant_email,
                                    ],
                                    ['Domicilio', data.applicant_address],
                                    ...displayedSchema.map((field) => [
                                        field.label,
                                        data.fields[field.name],
                                    ]),
                                ]
                                    .filter(([, value]) => Boolean(value))
                                    .map(([label, value]) => (
                                        <div key={label}>
                                            <dt className="text-base font-semibold">
                                                {label}
                                            </dt>
                                            <dd className="whitespace-pre-wrap">
                                                {value}
                                            </dd>
                                        </div>
                                    ))}
                                <div>
                                    <dt className="text-base font-semibold">
                                        Documentos
                                    </dt>
                                    <dd>
                                        {data.attachments.length
                                            ? data.attachments
                                                  .map((file) => file.name)
                                                  .join(', ')
                                            : 'Sin archivos adjuntos'}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    )}

                    {progress && (
                        <progress
                            value={progress.percentage}
                            max="100"
                            aria-label="Envío de archivos"
                            className="h-2 w-full"
                        />
                    )}
                    {(!needsSubtype || step > 0) && (
                        <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border-t border-zinc-200 bg-municipal-surface py-3 dark:border-zinc-800">
                            {step > 0 && (
                                <button
                                    type="button"
                                    disabled={processing}
                                    className="min-h-12 flex-1 rounded-xl border border-zinc-400 px-4 text-base font-semibold sm:flex-none dark:border-zinc-600"
                                    onClick={() => {
                                        clearErrors();
                                        goToStep(step - 1);
                                    }}
                                >
                                    Volver
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-municipal-action px-4 py-2 text-center text-base font-semibold text-municipal-on-action disabled:opacity-60 sm:flex-none"
                            >
                                {step === 2 && (
                                    <Send
                                        aria-hidden="true"
                                        className="size-5 shrink-0"
                                    />
                                )}
                                {step === 0
                                    ? 'Completar mis datos'
                                    : step === 1
                                      ? 'Revisar solicitud'
                                      : processing
                                        ? 'Enviando…'
                                        : 'Enviar solicitud'}
                            </button>
                        </div>
                    )}
                </form>
            </main>
        </>
    );
}

function DynamicField({
    field,
    value,
    onChange,
    ...accessibility
}: {
    field: SchemaField;
    value: string;
    onChange: (value: string) => void;
} & IntakeFieldAria) {
    if (field.type === 'textarea') {
        return (
            <textarea
                {...accessibility}
                className="input min-h-28 text-lg"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (field.type === 'select') {
        return (
            <select
                {...accessibility}
                className="input min-h-12 text-lg"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">Seleccionar</option>
                {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <input
            {...accessibility}
            className="input min-h-12 text-lg"
            type={
                field.type === 'date' || field.type === 'time'
                    ? field.type
                    : 'text'
            }
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}
