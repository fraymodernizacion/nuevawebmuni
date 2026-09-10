import { CheckCircle2, MessageCircle } from 'lucide-react';

type Props = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    title?: string;
    description?: string;
};

export function WhatsappNotificationToggle({
    checked,
    onChange,
    title = 'Avisar por WhatsApp',
    description = 'Enviar una notificacion al vecino con esta actualizacion.',
}: Props) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition ${
                checked
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100'
                    : 'bg-card hover:bg-muted/50'
            }`}
        >
            <span
                className={`grid size-10 shrink-0 place-items-center rounded-md ${
                    checked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                }`}
            >
                <MessageCircle className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{title}</span>
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            checked
                                ? 'bg-emerald-600 text-white'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {checked ? 'Activado' : 'Desactivado'}
                    </span>
                </span>
                <span className="mt-1 block text-muted-foreground">
                    {description}
                </span>
                {checked && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        Se enviara al guardar
                    </span>
                )}
            </span>
        </button>
    );
}
