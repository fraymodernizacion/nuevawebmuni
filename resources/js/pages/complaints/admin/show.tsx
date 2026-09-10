import { Head, useForm } from '@inertiajs/react';
import { Expand, MapPin, MessageCircle, Save } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';
import { updateNeighbor } from '@/actions/App/Http/Controllers/Admin/ComplaintController';
import { update as updateStatus } from '@/actions/App/Http/Controllers/Admin/ComplaintStatusController';
import { StaticLocationMap } from '@/components/complaints/static-location-map';
import { WhatsappNotificationToggle } from '@/components/complaints/whatsapp-notification-toggle';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    formatDateTime,
    historyActionLabel,
    priorityLabel,
    priorityLabels,
    statusLabel,
} from '@/lib/complaint-labels';

type Complaint = Record<string, any>;

export default function AdminComplaintShow({
    complaint,
    nearbyComplaints,
}: {
    complaint: Complaint;
    nearbyComplaints: any[];
}) {
    const status = useForm({
        status: complaint.current_status,
        priority: complaint.priority,
        observation: '',
        location_needs_verification: complaint.location_needs_verification,
        send_whatsapp: false,
    });
    const neighbor = useForm({
        first_name: complaint.first_name ?? '',
        last_name: complaint.last_name ?? '',
        dni: complaint.dni ?? '',
        phone: complaint.phone ?? '',
        email: complaint.email ?? '',
        street: complaint.street ?? '',
        street_number: complaint.street_number ?? '',
        neighborhood: complaint.neighborhood ?? '',
        location_reference: complaint.location_reference ?? '',
    });
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const mapUrl =
        complaint.latitude && complaint.longitude
            ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(complaint.longitude) - 0.003}%2C${Number(complaint.latitude) - 0.003}%2C${Number(complaint.longitude) + 0.003}%2C${Number(complaint.latitude) + 0.003}&layer=mapnik&marker=${complaint.latitude}%2C${complaint.longitude}`
            : null;

    function submitStatus(event: FormEvent) {
        event.preventDefault();
        status.patch(updateStatus.url(complaint.id));
    }

    function submitNeighbor(event: FormEvent) {
        event.preventDefault();
        neighbor.patch(updateNeighbor.url(complaint.id), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={complaint.public_code} />
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
                <main className="flex flex-col gap-4">
                    <section className="rounded-lg border bg-card p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-normal">
                                    {complaint.public_code}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {complaint.type.name} ·{' '}
                                    {formatDateTime(complaint.created_at)}
                                </p>
                            </div>
                            <span
                                className="rounded-md px-3 py-1 text-sm font-semibold"
                                style={{
                                    color: complaint.operational_zone.color,
                                }}
                            >
                                Zona {complaint.operational_zone.code}
                            </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <Info
                                label="Estado"
                                value={statusLabel(complaint.current_status)}
                            />
                            <Info
                                label="Prioridad"
                                value={priorityLabel(complaint.priority)}
                            />
                            <Info
                                label="Localidad"
                                value={complaint.locality.name}
                            />
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <Panel title="Vecino">
                            <form
                                onSubmit={submitNeighbor}
                                className="grid gap-3"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <NeighborField
                                        label="Nombre"
                                        error={neighbor.errors.first_name}
                                    >
                                        <input
                                            className="input"
                                            value={neighbor.data.first_name}
                                            onChange={(event) =>
                                                neighbor.setData(
                                                    'first_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </NeighborField>
                                    <NeighborField
                                        label="Apellido"
                                        error={neighbor.errors.last_name}
                                    >
                                        <input
                                            className="input"
                                            value={neighbor.data.last_name}
                                            onChange={(event) =>
                                                neighbor.setData(
                                                    'last_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </NeighborField>
                                    <NeighborField
                                        label="DNI"
                                        error={neighbor.errors.dni}
                                    >
                                        <input
                                            className="input"
                                            inputMode="numeric"
                                            value={neighbor.data.dni}
                                            onChange={(event) =>
                                                neighbor.setData(
                                                    'dni',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </NeighborField>
                                    <NeighborField
                                        label="Teléfono"
                                        error={neighbor.errors.phone}
                                    >
                                        <input
                                            className="input"
                                            inputMode="tel"
                                            value={neighbor.data.phone}
                                            onChange={(event) =>
                                                neighbor.setData(
                                                    'phone',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </NeighborField>
                                </div>

                                <NeighborField
                                    label="Email"
                                    error={neighbor.errors.email}
                                >
                                    <input
                                        className="input"
                                        type="email"
                                        value={neighbor.data.email}
                                        onChange={(event) =>
                                            neighbor.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </NeighborField>

                                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                                    <NeighborField
                                        label="Calle"
                                        error={neighbor.errors.street}
                                    >
                                        <input
                                            className="input"
                                            value={neighbor.data.street}
                                            onChange={(event) =>
                                                neighbor.setData(
                                                    'street',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </NeighborField>
                                    <NeighborField
                                        label="Número"
                                        error={neighbor.errors.street_number}
                                    >
                                        <input
                                            className="input"
                                            value={neighbor.data.street_number}
                                            onChange={(event) =>
                                                neighbor.setData(
                                                    'street_number',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </NeighborField>
                                </div>

                                <NeighborField
                                    label="Barrio"
                                    error={neighbor.errors.neighborhood}
                                >
                                    <input
                                        className="input"
                                        value={neighbor.data.neighborhood}
                                        onChange={(event) =>
                                            neighbor.setData(
                                                'neighborhood',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </NeighborField>

                                <NeighborField
                                    label="Referencia"
                                    error={neighbor.errors.location_reference}
                                >
                                    <textarea
                                        className="input min-h-20"
                                        value={neighbor.data.location_reference}
                                        onChange={(event) =>
                                            neighbor.setData(
                                                'location_reference',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </NeighborField>

                                <button
                                    className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                    disabled={neighbor.processing}
                                >
                                    <Save className="size-4" />
                                    Guardar datos del vecino
                                </button>
                            </form>
                        </Panel>
                        <Panel title="Ubicación">
                            <p className="text-sm">
                                {[
                                    complaint.street,
                                    complaint.street_number,
                                    complaint.neighborhood,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {complaint.location_reference}
                            </p>
                            {mapUrl && (
                                <div className="mt-3 overflow-hidden rounded-md border">
                                    <iframe
                                        title="Mapa"
                                        src={mapUrl}
                                        className="h-64 w-full"
                                    />
                                    <Dialog
                                        open={isMapModalOpen}
                                        onOpenChange={setIsMapModalOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex min-h-10 w-full items-center justify-center gap-2 border-t bg-background px-3 text-sm font-medium hover:bg-muted/60"
                                            >
                                                <Expand className="size-4" />
                                                Ver mapa en pantalla completa
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[calc(100vw-2rem)] gap-3 p-4 sm:max-w-5xl">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Ubicación del reclamo
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {complaint.public_code} ·{' '}
                                                    {complaint.locality.name}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <StaticLocationMap
                                                latitude={complaint.latitude}
                                                longitude={complaint.longitude}
                                                active={isMapModalOpen}
                                                className="h-[75vh] min-h-96"
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                            {complaint.latitude && complaint.longitude && (
                                <a
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300"
                                    href={`https://www.openstreetmap.org/directions?to=${complaint.latitude}%2C${complaint.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <MapPin className="size-4" /> Cómo llegar
                                </a>
                            )}
                        </Panel>
                    </section>

                    <Panel title="Historial">
                        <ol className="flex flex-col gap-3 border-l pl-4">
                            {complaint.status_histories.map((item: any) => (
                                <li key={item.id} className="text-sm">
                                    <strong>
                                        {formatDateTime(item.changed_at)}
                                    </strong>
                                    <p>
                                        {historyActionLabel(item.action)} ·{' '}
                                        {statusLabel(item.to_status)}
                                    </p>
                                    {item.observation && (
                                        <p className="text-muted-foreground">
                                            {item.observation}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </Panel>

                    <Panel title="Fotos">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {complaint.photos.map((photo: any) => (
                                <a
                                    key={photo.id}
                                    href={photo.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="overflow-hidden rounded-md border bg-background"
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.type_label}
                                        className="aspect-video w-full object-cover"
                                    />
                                    <span className="block px-2 py-1 text-xs text-muted-foreground">
                                        {photo.type_label}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Intervenciones">
                        <div className="grid gap-3">
                            {complaint.interventions.map(
                                (intervention: any) => (
                                    <div
                                        key={intervention.id}
                                        className="rounded-md border bg-background p-3 text-sm"
                                    >
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <strong>
                                                    {statusLabel(
                                                        intervention.status,
                                                    )}
                                                </strong>
                                                {intervention.user && (
                                                    <p className="text-muted-foreground">
                                                        Registrado por{' '}
                                                        {intervention.user.name}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-muted-foreground">
                                                {formatDateTime(
                                                    intervention.performed_at,
                                                )}
                                            </span>
                                        </div>
                                        {intervention.observations && (
                                            <p className="mt-2">
                                                {intervention.observations}
                                            </p>
                                        )}
                                        {intervention.internal_supplies_notes && (
                                            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                                                <p className="text-xs font-semibold">
                                                    Insumos utilizados /
                                                    informacion interna
                                                </p>
                                                <p className="mt-1">
                                                    {
                                                        intervention.internal_supplies_notes
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {intervention.materials?.length > 0 && (
                                            <div className="mt-2 rounded-md border bg-muted/30 p-2">
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                    Materiales cargados
                                                </p>
                                                <ul className="mt-1 space-y-1 text-sm">
                                                    {intervention.materials.map(
                                                        (material: any) => (
                                                            <li
                                                                key={
                                                                    material.id
                                                                }
                                                            >
                                                                {material.inventory_item_code ||
                                                                    material.description}{' '}
                                                                ·{' '}
                                                                {
                                                                    material.quantity
                                                                }{' '}
                                                                {material.unit}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                        {intervention.second_visit_reason && (
                                            <p className="mt-2 text-muted-foreground">
                                                Segunda visita:{' '}
                                                {
                                                    intervention.second_visit_reason
                                                }
                                            </p>
                                        )}
                                    </div>
                                ),
                            )}
                            {complaint.interventions.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Todavía no hay intervenciones registradas.
                                </p>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Notificaciones">
                        <div className="flex flex-col gap-2">
                            {complaint.notification_logs.map((log: any) => (
                                <div
                                    key={log.id}
                                    className="rounded-md border p-3 text-sm"
                                >
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <strong>
                                            WhatsApp ·{' '}
                                            {notificationTypeLabel(log.type)}
                                        </strong>
                                        <span className="text-muted-foreground">
                                            {formatDateTime(log.attempted_at)}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground">
                                        {notificationStatusLabel(log.status)} a{' '}
                                        {log.recipient}
                                    </p>
                                    {log.error && (
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                            Detalle: {log.error}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {complaint.notification_logs.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Todavía no hay notificaciones enviadas.
                                </p>
                            )}
                        </div>
                    </Panel>
                </main>

                <aside className="flex flex-col gap-4">
                    <Panel title="Gestión administrativa">
                        <form
                            onSubmit={submitStatus}
                            className="flex flex-col gap-3"
                        >
                            <select
                                className="input"
                                value={status.data.status}
                                onChange={(event) =>
                                    status.setData('status', event.target.value)
                                }
                            >
                                {[
                                    'new',
                                    'under_review',
                                    'closed',
                                    'cancelled',
                                ].map((item) => (
                                    <option key={item} value={item}>
                                        {statusLabel(item)}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="input"
                                value={status.data.priority}
                                onChange={(event) =>
                                    status.setData(
                                        'priority',
                                        event.target.value,
                                    )
                                }
                            >
                                {Object.entries(priorityLabels).map(
                                    ([item, label]) => (
                                        <option key={item} value={item}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={
                                        status.data.location_needs_verification
                                    }
                                    onChange={(event) =>
                                        status.setData(
                                            'location_needs_verification',
                                            event.target.checked,
                                        )
                                    }
                                />{' '}
                                Ubicación a verificar
                            </label>
                            <textarea
                                className="input min-h-24"
                                value={status.data.observation}
                                onChange={(event) =>
                                    status.setData(
                                        'observation',
                                        event.target.value,
                                    )
                                }
                            />
                            <WhatsappNotificationToggle
                                checked={status.data.send_whatsapp}
                                onChange={(checked) =>
                                    status.setData('send_whatsapp', checked)
                                }
                                title="Notificar al vecino"
                                description="Enviar WhatsApp con este cambio de estado."
                            />
                            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                                <MessageCircle className="size-4" /> Guardar
                                estado
                            </button>
                        </form>
                    </Panel>

                    {nearbyComplaints.length > 0 && (
                        <Panel title="Cercanos">
                            {nearbyComplaints.map((item) => (
                                <p key={item.id} className="text-sm">
                                    {item.public_code} · {item.distance} m
                                </p>
                            ))}
                        </Panel>
                    )}
                </aside>
            </div>
        </>
    );
}

function Panel({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function NeighborField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="grid gap-2 text-sm">
            <span className="text-xs text-muted-foreground">{label}</span>
            {children}
            {error && <span className="text-xs text-destructive">{error}</span>}
        </label>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

function notificationStatusLabel(value?: string | null) {
    const labels: Record<string, string> = {
        sent: 'Enviado',
        failed: 'Fallido',
        skipped: 'Omitido',
        pending: 'Pendiente',
    };

    return value ? (labels[value] ?? value) : 'Sin estado';
}

function notificationTypeLabel(value?: string | null) {
    const labels: Record<string, string> = {
        received: 'Reclamo recibido',
    };

    return value ? (labels[value] ?? statusLabel(value)) : 'Movimiento';
}
