export const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    under_review: 'En revisión',
    assigned: 'Asignado',
    in_progress: 'En relevamiento',
    needs_second_visit: 'Necesita segunda visita',
    resolved: 'Resuelto',
    closed: 'Cerrado',
    cancelled: 'Cancelado',
};

export const statusBadgeClasses: Record<string, string> = {
    new: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
    under_review:
        'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
    assigned:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    in_progress:
        'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200',
    needs_second_visit:
        'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200',
    resolved:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    closed: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
    cancelled:
        'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

export const priorityLabels: Record<string, string> = {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente',
};

export const historyActionLabels: Record<string, string> = {
    created: 'Reclamo recibido',
    assigned: 'Asignado a cuadrilla',
    reassigned: 'Reasignado a cuadrilla',
    status_changed: 'Cambio de estado',
    intervention: 'Intervención de cuadrilla',
    photo_uploaded: 'Foto cargada',
};

export const workRouteStatusLabels: Record<string, string> = {
    planned: 'Planificado',
    in_progress: 'En relevamiento',
    finished: 'Finalizado',
};

export function statusLabel(value?: string | null) {
    return value ? (statusLabels[value] ?? value) : 'Sin estado';
}

export function statusBadgeClass(value?: string | null) {
    return value
        ? (statusBadgeClasses[value] ??
              'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200')
        : 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200';
}

export function priorityLabel(value?: string | null) {
    return value ? (priorityLabels[value] ?? value) : 'Sin prioridad';
}

export function historyActionLabel(value?: string | null) {
    return value ? (historyActionLabels[value] ?? value) : 'Movimiento';
}

export function workRouteStatusLabel(value?: string | null) {
    return value ? (workRouteStatusLabels[value] ?? value) : 'Sin estado';
}

export function formatDateTime(value?: string | null) {
    if (!value) {
        return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
