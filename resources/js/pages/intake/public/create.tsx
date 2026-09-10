import { Head, Link, useForm } from '@inertiajs/react';
import { Camera, FileText, Send, Upload } from 'lucide-react';
import { FormEvent } from 'react';
import { store } from '@/actions/App/Http/Controllers/PublicIntakeRequestController';
import { index, track as trackCreate } from '@/routes/intake/public';

type SchemaField = {
    name: string;
    label: string;
    type?: 'text' | 'textarea' | 'date' | 'select';
    required?: boolean;
    options?: string[];
};

type IntakeType = {
    slug: string;
    name: string;
    category: string;
    description: string;
    requirements: string[];
    schema: SchemaField[];
};

export default function CreateIntakeRequest({ type }: { type: IntakeType }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        applicant_name: '',
        applicant_dni: '',
        applicant_phone: '',
        applicant_email: '',
        applicant_address: '',
        summary: '',
        fields: {} as Record<string, string>,
        attachments: [] as File[],
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post(store.url(type.slug), { forceFormData: true });
    }

    function setField(name: string, value: string) {
        setData('fields', { ...data.fields, [name]: value });
    }

    return (
        <>
            <Head title={type.name} />
            <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
                <form
                    onSubmit={submit}
                    className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <header className="flex flex-col gap-2">
                        <Link
                            href={index()}
                            className="text-sm font-medium text-blue-700 dark:text-blue-300"
                        >
                            Volver a Mesa de Entrada
                        </Link>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {type.category}
                        </p>
                        <h1 className="text-3xl font-semibold tracking-normal">
                            {type.name}
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            {type.description}
                        </p>
                    </header>

                    {type.requirements.length > 0 && (
                        <section className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
                            <h2 className="font-semibold">Antes de iniciar</h2>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                {type.requirements.map((requirement) => (
                                    <li key={requirement}>{requirement}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="grid gap-3 sm:grid-cols-2">
                        <h2 className="text-lg font-semibold sm:col-span-2">
                            Datos del vecino
                        </h2>
                        <Field
                            label="Nombre y apellido"
                            error={errors.applicant_name}
                        >
                            <input
                                className="input"
                                value={data.applicant_name}
                                onChange={(event) =>
                                    setData(
                                        'applicant_name',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="DNI / CUIT" error={errors.applicant_dni}>
                            <input
                                className="input"
                                value={data.applicant_dni}
                                onChange={(event) =>
                                    setData('applicant_dni', event.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label="Celular / WhatsApp"
                            error={errors.applicant_phone}
                        >
                            <input
                                className="input"
                                inputMode="tel"
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
                            label="Correo electronico"
                            error={errors.applicant_email}
                        >
                            <input
                                className="input"
                                type="email"
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
                            label="Domicilio"
                            error={errors.applicant_address}
                        >
                            <input
                                className="input"
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

                    <section className="grid gap-3">
                        <h2 className="text-lg font-semibold">
                            Datos de la solicitud
                        </h2>
                        <Field label="Resumen" error={errors.summary}>
                            <textarea
                                className="input min-h-32"
                                value={data.summary}
                                onChange={(event) =>
                                    setData('summary', event.target.value)
                                }
                            />
                        </Field>
                        {type.schema.map((field) => (
                            <Field
                                key={field.name}
                                label={`${field.label}${field.required ? ' *' : ''}`}
                                error={errors[`fields.${field.name}`]}
                            >
                                <DynamicField
                                    field={field}
                                    value={data.fields[field.name] ?? ''}
                                    onChange={(value) =>
                                        setField(field.name, value)
                                    }
                                />
                            </Field>
                        ))}
                    </section>

                    <Field
                        label="Documentacion adjunta"
                        error={errors.attachments}
                    >
                        <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950">
                                <Upload className="size-5" />
                                <span>Elegir archivos</span>
                                <input
                                    className="hidden"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,image/*"
                                    onChange={(event) =>
                                        setData(
                                            'attachments',
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        )
                                    }
                                />
                            </label>
                            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950">
                                <Camera className="size-5" />
                                <span>Tomar foto</span>
                                <input
                                    className="hidden"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(event) =>
                                        setData(
                                            'attachments',
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        )
                                    }
                                />
                            </label>
                        </div>
                        {data.attachments.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                                {data.attachments.map((file) => (
                                    <li key={`${file.name}-${file.size}`}>
                                        {file.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Field>

                    {progress && (
                        <progress
                            value={progress.percentage}
                            max="100"
                            className="h-2 w-full"
                        />
                    )}
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Link
                            href={trackCreate()}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 font-semibold dark:border-zinc-700"
                        >
                            <FileText className="size-4" /> Consultar tramite
                        </Link>
                        <button
                            disabled={processing}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 font-semibold text-white disabled:opacity-60"
                        >
                            <Send className="size-4" /> Enviar solicitud
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}

function DynamicField({
    field,
    value,
    onChange,
}: {
    field: SchemaField;
    value: string;
    onChange: (value: string) => void;
}) {
    if (field.type === 'textarea') {
        return (
            <textarea
                className="input min-h-28"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (field.type === 'select') {
        return (
            <select
                className="input"
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
            className="input"
            type={field.type === 'date' ? 'date' : 'text'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
            {label}
            {children}
            {error && <span className="text-xs text-red-600">{error}</span>}
        </label>
    );
}
