import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, FileText, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
    markNotificationAsRead,
    markNotificationsAsRead,
} from '@/actions/App/Http/Controllers/Admin/IntakeRequestController';
import { formatIntakeDate } from '@/lib/intake-labels';
import { index, notifications, show } from '@/routes/admin/intake';

type Notification = {
    id: number;
    action: string;
    from_status_label?: string | null;
    to_status_label?: string | null;
    previous_response?: string | null;
    new_response?: string | null;
    changed_at?: string | null;
    operator_seen_at?: string | null;
    is_seen: boolean;
    user?: { name: string } | null;
    department?: { name: string; secretariat?: string | null; color: string } | null;
    assistance_type?: { name: string; color: string } | null;
    request?: {
        id: number;
        public_code: string;
        subject: string;
        applicant_name: string;
    } | null;
};

type Props = {
    filters: {
        secretariat?: string;
        read_state?: string;
    };
    secretariatOptions: string[];
    unreadCount: number;
    notifications: {
        data: Notification[];
        links: { url: string | null; label: string; active: boolean }[];
    };
};

export default function IntakeNotifications({
    filters,
    secretariatOptions,
    unreadCount,
    notifications: notificationPage,
}: Props) {
    const [secretariat, setSecretariat] = useState(filters.secretariat ?? '');
    const [readState, setReadState] = useState(filters.read_state ?? 'unread');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(
            notifications.url(),
            { secretariat, read_state: readState },
            { preserveState: true },
        );
    }

    function markFilteredAsRead() {
        router.patch(
            markNotificationsAsRead.url(),
            { secretariat, read_state: readState },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Notificaciones de areas" />
            <div className="flex flex-col gap-4 p-4">
                <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                        <Link
                            href={index()}
                            className="text-sm font-medium text-blue-700 dark:text-blue-300"
                        >
                            Volver a Mesa de Entrada
                        </Link>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Notificaciones de areas
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Seguimiento de cambios en respuestas de
                            derivaciones.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={markFilteredAsRead}
                        disabled={notificationPage.data.length === 0}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        <Check className="size-4" />
                        Marcar filtradas como leidas
                    </button>
                </header>

                <section className="grid gap-3 sm:grid-cols-3">
                    <Metric label="Pendientes" value={unreadCount.toString()} />
                    <Metric
                        label="Vista actual"
                        value={notificationPage.data.length.toString()}
                    />
                    <Metric
                        label="Filtro"
                        value={
                            readState === 'unread'
                                ? 'No leidas'
                                : readState === 'read'
                                  ? 'Leidas'
                                  : 'Todas'
                        }
                    />
                </section>

                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_220px_auto]"
                >
                    <label className="relative">
                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <select
                            className="input pl-9"
                            value={secretariat}
                            onChange={(event) =>
                                setSecretariat(event.target.value)
                            }
                        >
                            <option value="">Todas las secretarias</option>
                            {secretariatOptions.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <select
                        className="input"
                        value={readState}
                        onChange={(event) => setReadState(event.target.value)}
                    >
                        <option value="unread">No leidas</option>
                        <option value="all">Todas</option>
                        <option value="read">Leidas</option>
                    </select>
                    <button className="min-h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground">
                        Filtrar
                    </button>
                </form>

                <section className="grid gap-3">
                    {notificationPage.data.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                        />
                    ))}
                    {notificationPage.data.length === 0 && (
                        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                            No hay notificaciones para estos filtros.
                        </div>
                    )}
                </section>

                {notificationPage.links.length > 3 && (
                    <nav className="flex flex-wrap gap-2">
                        {notificationPage.links.map((link) => (
                            <Link
                                key={`${link.label}-${link.url}`}
                                href={link.url ?? '#'}
                                className={`rounded-md border px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card'
                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}

function NotificationItem({ notification }: { notification: Notification }) {
    const response = notification.new_response?.trim();

    return (
        <article
            className={`grid gap-3 rounded-lg border bg-card p-4 text-sm md:grid-cols-[1fr_auto] ${
                notification.is_seen ? 'opacity-75' : ''
            }`}
        >
            <div className="flex gap-3">
                <span
                    className="mt-1 grid size-10 shrink-0 place-items-center rounded-md text-white"
                    style={{
                        backgroundColor:
                            notification.department?.color ?? '#2563eb',
                    }}
                >
                    <Bell className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                        {notification.department?.secretariat ??
                            'Secretaria sin dato'}{' '}
                        · {notification.department?.name ?? 'Area sin dato'}
                    </p>
                    <h2 className="text-lg font-semibold tracking-normal">
                        {notification.request?.public_code ?? 'Solicitud'} ·{' '}
                        {notification.request?.subject ?? 'Sin asunto'}
                    </h2>
                    <p className="text-muted-foreground">
                        {notification.to_status_label ?? 'Actualizada'} ·{' '}
                        {formatIntakeDate(notification.changed_at)} ·{' '}
                        {notification.user?.name ?? 'Area'}
                    </p>
                    {response && <p className="mt-2 line-clamp-3">{response}</p>}
                    {notification.operator_seen_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Leida el{' '}
                            {formatIntakeDate(notification.operator_seen_at)}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-start gap-2 md:justify-end">
                {notification.request && (
                    <Link
                        href={show.url(notification.request.id)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold"
                    >
                        <FileText className="size-4" />
                        Abrir solicitud
                    </Link>
                )}
                {!notification.is_seen && (
                    <button
                        type="button"
                        onClick={() =>
                            router.patch(
                                markNotificationAsRead.url(notification.id),
                                {},
                                { preserveScroll: true },
                            )
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white"
                    >
                        <Check className="size-4" />
                        Marcar leida
                    </button>
                )}
            </div>
        </article>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-normal">
                {value}
            </p>
        </div>
    );
}

IntakeNotifications.layout = {
    breadcrumbs: [{ title: 'Notificaciones', href: notifications() }],
};
