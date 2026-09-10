import { Head, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleOff,
    KeyRound,
    ShieldCheck,
    ShieldOff,
    Save,
    UserPlus,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/Admin/UserManagementController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/admin/users';

type ManagedUser = {
    id: number;
    name: string;
    username: string;
    dni?: string | null;
    email: string;
    role: string;
    active: boolean;
    module_permissions: Record<string, boolean>;
    primary_crew_id?: number | null;
    intake_department_id?: number | null;
};

type Option = { value: string; label: string };
type IdOption = { id: number; name: string; code?: string };
type ModuleOption = { key: string; label: string };

type FormData = {
    name: string;
    username: string;
    dni: string;
    email: string;
    password: string;
    role: string;
    active: boolean;
    module_permissions: Record<string, boolean>;
    primary_crew_id: string;
    intake_department_id: string;
};

type Props = {
    users: ManagedUser[];
    options: {
        roles: Option[];
        modules: ModuleOption[];
        crews: IdOption[];
        intakeDepartments: IdOption[];
    };
};

const emptyForm = (modules: ModuleOption[]): FormData => ({
    name: '',
    username: '',
    dni: '',
    email: '',
    password: '',
    role: 'operator',
    active: true,
    module_permissions: Object.fromEntries(
        modules.map((module) => [module.key, false]),
    ),
    primary_crew_id: '',
    intake_department_id: '',
});

function selectedModulePermissions(
    user: ManagedUser,
    modules: ModuleOption[],
): Record<string, boolean> {
    return Object.fromEntries(
        modules.map((module) => [
            module.key,
            isEnabledPermission(user.module_permissions[module.key]),
        ]),
    );
}

function isEnabledPermission(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

export default function UserManagementIndex({ users, options }: Props) {
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const initialData = useMemo(
        () => emptyForm(options.modules),
        [options.modules],
    );
    const form = useForm<FormData>(initialData);
    const roleLabel = (role: string) =>
        options.roles.find((option) => option.value === role)?.label ?? role;
    const isEditing = selectedUser !== null;

    function selectUser(user: ManagedUser) {
        setSelectedUser(user);
        form.clearErrors();
        form.setData({
            name: user.name,
            username: user.username,
            dni: user.dni ?? '',
            email: user.email,
            password: '',
            role: user.role,
            active: user.active,
            module_permissions: selectedModulePermissions(
                user,
                options.modules,
            ),
            primary_crew_id: user.primary_crew_id
                ? String(user.primary_crew_id)
                : '',
            intake_department_id: user.intake_department_id
                ? String(user.intake_department_id)
                : '',
        });
    }

    function resetForm() {
        setSelectedUser(null);
        form.clearErrors();
        form.setData(initialData);
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (selectedUser) {
            form.patch(update.url(selectedUser.id), {
                preserveScroll: true,
                onSuccess: resetForm,
            });

            return;
        }

        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: resetForm,
        });
    }

    function togglePermission(key: string) {
        form.setData('module_permissions', {
            ...form.data.module_permissions,
            [key]: !form.data.module_permissions[key],
        });
    }

    return (
        <>
            <Head title="Gestión de usuarios" />
            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <main className="grid gap-4">
                    <header className="rounded-lg border bg-card p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Administración del sistema
                        </p>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Gestión de usuarios
                        </h1>
                    </header>

                    <section className="overflow-hidden rounded-lg border bg-card">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => selectUser(user)}
                                className={`grid w-full gap-2 border-b p-4 text-left transition hover:bg-muted/50 ${
                                    selectedUser?.id === user.id
                                        ? 'bg-muted/70'
                                        : ''
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h2 className="font-semibold">
                                            {user.name}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            @{user.username}
                                            {user.dni
                                                ? ` · DNI ${user.dni}`
                                                : ''}
                                            {' · '}
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            {roleLabel(user.role)}
                                        </Badge>
                                        <Badge
                                            variant={
                                                user.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            {user.active
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {options.modules
                                        .filter(
                                            (module) =>
                                                user.role === 'superadmin' ||
                                                user.module_permissions[
                                                    module.key
                                                ],
                                        )
                                        .map((module) => (
                                            <span
                                                key={module.key}
                                                className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                                            >
                                                {module.label}
                                            </span>
                                        ))}
                                </div>
                            </button>
                        ))}
                    </section>
                </main>

                <aside className="rounded-lg border bg-card p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Usuario, rol y módulos habilitados
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                        >
                            <UserPlus className="size-4" />
                            Nuevo
                        </Button>
                    </div>

                    <form onSubmit={submit} className="grid gap-4">
                        <Field
                            label="Nombre y apellido"
                            error={form.errors.name}
                        >
                            <Input
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                            />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Usuario" error={form.errors.username}>
                                <Input
                                    value={form.data.username}
                                    onChange={(event) =>
                                        form.setData(
                                            'username',
                                            event.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9._-]+/g, ''),
                                        )
                                    }
                                    required
                                />
                            </Field>
                            <Field label="DNI" error={form.errors.dni}>
                                <Input
                                    inputMode="numeric"
                                    value={form.data.dni}
                                    onChange={(event) =>
                                        form.setData(
                                            'dni',
                                            event.target.value.replace(
                                                /\D+/g,
                                                '',
                                            ),
                                        )
                                    }
                                    placeholder="Sólo números"
                                />
                            </Field>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Correo" error={form.errors.email}>
                                <Input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                            </Field>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Rol" error={form.errors.role}>
                                <select
                                    className="input"
                                    value={form.data.role}
                                    onChange={(event) =>
                                        form.setData('role', event.target.value)
                                    }
                                >
                                    {options.roles.map((role) => (
                                        <option
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label={
                                    isEditing
                                        ? 'Nueva contraseña'
                                        : 'Contraseña'
                                }
                                error={form.errors.password}
                            >
                                <Input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    required={!isEditing}
                                    placeholder={
                                        isEditing
                                            ? 'Dejar vacía para conservar'
                                            : 'Mínimo 8 caracteres'
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                                label="Cuadrilla principal"
                                error={form.errors.primary_crew_id}
                            >
                                <select
                                    className="input"
                                    value={form.data.primary_crew_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'primary_crew_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Sin cuadrilla</option>
                                    {options.crews.map((crew) => (
                                        <option key={crew.id} value={crew.id}>
                                            {crew.code
                                                ? `${crew.code} · ${crew.name}`
                                                : crew.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Área de derivación"
                                error={form.errors.intake_department_id}
                            >
                                <select
                                    className="input"
                                    value={form.data.intake_department_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'intake_department_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Sin área</option>
                                    {options.intakeDepartments.map(
                                        (department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>
                        </div>

                        <label className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={form.data.active}
                                onChange={(event) =>
                                    form.setData('active', event.target.checked)
                                }
                            />
                            Usuario activo
                        </label>

                        <section className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <KeyRound className="size-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold">
                                    Permisos por módulo
                                </h3>
                            </div>
                            <div className="grid gap-2">
                                {options.modules.map((module) => (
                                    <div
                                        key={module.key}
                                        className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition ${
                                            form.data.module_permissions[
                                                module.key
                                            ]
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100'
                                                : 'bg-background'
                                        }`}
                                    >
                                        <span className="flex min-w-0 items-center gap-2 font-medium">
                                            {form.data.module_permissions[
                                                module.key
                                            ] ? (
                                                <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                            ) : (
                                                <ShieldOff className="size-4 shrink-0 text-muted-foreground" />
                                            )}
                                            <span className="truncate">
                                                {module.label}
                                            </span>
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                                form.data.module_permissions[
                                                    module.key
                                                ]
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                            onClick={() =>
                                                togglePermission(module.key)
                                            }
                                            className="shrink-0"
                                        >
                                            {form.data.module_permissions[
                                                module.key
                                            ]
                                                ? 'Quitar'
                                                : 'Asignar'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <Button disabled={form.processing} className="min-h-11">
                            {isEditing ? (
                                <Save className="size-4" />
                            ) : (
                                <CheckCircle2 className="size-4" />
                            )}
                            {isEditing ? 'Guardar cambios' : 'Crear usuario'}
                        </Button>
                        {Object.keys(form.errors).length > 0 && (
                            <p className="flex items-center gap-2 text-sm text-red-600">
                                <CircleOff className="size-4" />
                                Revisá los campos marcados.
                            </p>
                        )}
                    </form>
                </aside>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="grid gap-1.5 text-sm font-medium">
            {label}
            {children}
            {error && <span className="text-xs text-red-600">{error}</span>}
        </label>
    );
}

UserManagementIndex.layout = {
    breadcrumbs: [{ title: 'Gestión de usuarios', href: index() }],
};
