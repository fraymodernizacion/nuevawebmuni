import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Save, Settings2 } from 'lucide-react';
import { FormEvent } from 'react';
import {
    storeAssistanceType,
    storeDepartment,
    updateAssistanceType,
    updateDepartment,
} from '@/actions/App/Http/Controllers/Admin/IntakeConfigurationController';
import { configuration, index } from '@/routes/admin/intake';

type Department = {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    color: string;
    active: boolean;
    users_count: number;
    derivations_count: number;
};

type AssistanceType = {
    id: number;
    default_intake_department_id?: number | null;
    slug: string;
    name: string;
    description?: string | null;
    color: string;
    active: boolean;
    derivations_count: number;
    default_department?: Department | null;
};

export default function IntakeConfiguration({
    departments,
    assistanceTypes,
    departmentOptions,
}: {
    departments: Department[];
    assistanceTypes: AssistanceType[];
    departmentOptions: Pick<Department, 'id' | 'name' | 'color'>[];
}) {
    return (
        <>
            <Head title="Configuracion de derivaciones" />
            <div className="flex flex-col gap-5 p-4">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Mesa de Entrada
                        </p>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Configuracion de derivaciones
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Define areas responsables y tipificaciones internas
                            para derivar solicitudes.
                        </p>
                    </div>
                    <Link
                        href={index()}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold"
                    >
                        Volver a Mesa de Entrada
                    </Link>
                </header>

                <section className="grid gap-4 xl:grid-cols-2">
                    <CreateDepartmentForm />
                    <CreateAssistanceTypeForm departments={departmentOptions} />
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Panel
                        title="Areas responsables"
                        description="Cada encargado puede tener una de estas areas asignada."
                    >
                        <div className="grid gap-3">
                            {departments.map((department) => (
                                <DepartmentForm
                                    key={department.id}
                                    department={department}
                                />
                            ))}
                        </div>
                    </Panel>
                    <Panel
                        title="Tipos de asistencia"
                        description="El operador tipifica para estadistica y el sistema sugiere el area por defecto."
                    >
                        <div className="grid gap-3">
                            {assistanceTypes.map((assistanceType) => (
                                <AssistanceTypeForm
                                    key={assistanceType.id}
                                    assistanceType={assistanceType}
                                    departments={departmentOptions}
                                />
                            ))}
                        </div>
                    </Panel>
                </section>
            </div>
        </>
    );
}

function CreateDepartmentForm() {
    const form = useForm({
        name: '',
        slug: '',
        description: '',
        color: '#2563eb',
        active: true,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(storeDepartment.url(), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form
            onSubmit={submit}
            className="grid gap-3 rounded-lg border bg-card p-4"
        >
            <FormTitle title="Nueva area" />
            <DepartmentFields form={form} />
            <SubmitButton processing={form.processing} label="Crear area" />
        </form>
    );
}

function DepartmentForm({ department }: { department: Department }) {
    const form = useForm({
        name: department.name,
        slug: department.slug,
        description: department.description ?? '',
        color: department.color,
        active: department.active,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.patch(updateDepartment.url(department.id), {
            preserveScroll: true,
        });
    }

    return (
        <form
            onSubmit={submit}
            className="grid gap-3 rounded-lg border bg-background p-3"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold">{department.name}</h3>
                    <p className="text-xs text-muted-foreground">
                        {department.users_count} encargado/s ·{' '}
                        {department.derivations_count} derivacion/es
                    </p>
                </div>
                <StatusPill active={form.data.active} />
            </div>
            <DepartmentFields form={form} />
            <SubmitButton processing={form.processing} label="Guardar area" />
        </form>
    );
}

function CreateAssistanceTypeForm({
    departments,
}: {
    departments: Pick<Department, 'id' | 'name' | 'color'>[];
}) {
    const form = useForm({
        name: '',
        slug: '',
        description: '',
        color: '#7c3aed',
        default_intake_department_id: '',
        active: true,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(storeAssistanceType.url(), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form
            onSubmit={submit}
            className="grid gap-3 rounded-lg border bg-card p-4"
        >
            <FormTitle title="Nuevo tipo de asistencia" />
            <AssistanceTypeFields form={form} departments={departments} />
            <SubmitButton processing={form.processing} label="Crear tipo" />
        </form>
    );
}

function AssistanceTypeForm({
    assistanceType,
    departments,
}: {
    assistanceType: AssistanceType;
    departments: Pick<Department, 'id' | 'name' | 'color'>[];
}) {
    const form = useForm({
        name: assistanceType.name,
        slug: assistanceType.slug,
        description: assistanceType.description ?? '',
        color: assistanceType.color,
        default_intake_department_id:
            assistanceType.default_intake_department_id?.toString() ?? '',
        active: assistanceType.active,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.patch(updateAssistanceType.url(assistanceType.id), {
            preserveScroll: true,
        });
    }

    return (
        <form
            onSubmit={submit}
            className="grid gap-3 rounded-lg border bg-background p-3"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold">{assistanceType.name}</h3>
                    <p className="text-xs text-muted-foreground">
                        Deriva a:{' '}
                        {assistanceType.default_department?.name ??
                            'Sin area sugerida'}{' '}
                        · {assistanceType.derivations_count} derivacion/es
                    </p>
                </div>
                <StatusPill active={form.data.active} />
            </div>
            <AssistanceTypeFields form={form} departments={departments} />
            <SubmitButton processing={form.processing} label="Guardar tipo" />
        </form>
    );
}

function DepartmentFields({ form }: { form: ReturnType<typeof useForm<any>> }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" error={form.errors.name}>
                <input
                    className="input"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                />
            </Field>
            <Field label="Slug" error={form.errors.slug}>
                <input
                    className="input"
                    value={form.data.slug}
                    onChange={(event) =>
                        form.setData('slug', event.target.value)
                    }
                    placeholder="sonido-logistica"
                />
            </Field>
            <Field label="Color" error={form.errors.color}>
                <input
                    className="input h-11"
                    type="color"
                    value={form.data.color}
                    onChange={(event) =>
                        form.setData('color', event.target.value)
                    }
                />
            </Field>
            <label className="flex items-center gap-2 self-end rounded-md border bg-background px-3 py-2 text-sm font-medium">
                <input
                    type="checkbox"
                    checked={form.data.active}
                    onChange={(event) =>
                        form.setData('active', event.target.checked)
                    }
                />
                Activa
            </label>
            <Field
                label="Descripcion"
                error={form.errors.description}
                className="sm:col-span-2"
            >
                <textarea
                    className="input min-h-20"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
            </Field>
        </div>
    );
}

function AssistanceTypeFields({
    form,
    departments,
}: {
    form: ReturnType<typeof useForm<any>>;
    departments: Pick<Department, 'id' | 'name' | 'color'>[];
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" error={form.errors.name}>
                <input
                    className="input"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                />
            </Field>
            <Field label="Slug" error={form.errors.slug}>
                <input
                    className="input"
                    value={form.data.slug}
                    onChange={(event) =>
                        form.setData('slug', event.target.value)
                    }
                    placeholder="sonido-logistica"
                />
            </Field>
            <Field
                label="Area sugerida"
                error={form.errors.default_intake_department_id}
            >
                <select
                    className="input"
                    value={form.data.default_intake_department_id}
                    onChange={(event) =>
                        form.setData(
                            'default_intake_department_id',
                            event.target.value,
                        )
                    }
                >
                    <option value="">Sin area sugerida</option>
                    {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                            {department.name}
                        </option>
                    ))}
                </select>
            </Field>
            <Field label="Color" error={form.errors.color}>
                <input
                    className="input h-11"
                    type="color"
                    value={form.data.color}
                    onChange={(event) =>
                        form.setData('color', event.target.value)
                    }
                />
            </Field>
            <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium sm:col-span-2">
                <input
                    type="checkbox"
                    checked={form.data.active}
                    onChange={(event) =>
                        form.setData('active', event.target.checked)
                    }
                />
                Activo para nuevas tipificaciones
            </label>
            <Field
                label="Descripcion"
                error={form.errors.description}
                className="sm:col-span-2"
            >
                <textarea
                    className="input min-h-20"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
            </Field>
        </div>
    );
}

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border bg-card p-4">
            <div className="mb-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </section>
    );
}

function FormTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Settings2 className="size-4" />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
    );
}

function Field({
    label,
    error,
    children,
    className = '',
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
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

function SubmitButton({
    processing,
    label,
}: {
    processing: boolean;
    label: string;
}) {
    return (
        <button
            disabled={processing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
            {label.startsWith('Crear') ? (
                <Plus className="size-4" />
            ) : (
                <Save className="size-4" />
            )}
            {label}
        </button>
    );
}

function StatusPill({ active }: { active: boolean }) {
    return (
        <span
            className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
            }`}
        >
            {active ? 'Activo' : 'Inactivo'}
        </span>
    );
}

IntakeConfiguration.layout = {
    breadcrumbs: [{ title: 'Configuracion', href: configuration() }],
};
