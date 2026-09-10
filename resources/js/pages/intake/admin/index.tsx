import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, FileText, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { formatIntakeDate, intakeStatusClass } from '@/lib/intake-labels';
import { index, show } from '@/routes/admin/intake';
import { index as complaintsIndex } from '@/routes/admin/complaints';

type IntakeRequest = {
    id: number;
    public_code: string;
    created_at: string;
    status: string;
    applicant_name: string;
    applicant_phone: string;
    subject: string;
    summary: string;
    area?: string | null;
    type: {
        name: string;
        category: string;
        color: string;
    };
};

type Props = {
    requests: {
        data: IntakeRequest[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Record<string, string>;
    statuses: { value: string; label: string }[];
    complaintSummary: { pending: number; new: number };
};

export default function AdminIntakeIndex({
    requests,
    filters,
    statuses,
    complaintSummary,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(index.url(), { search, status }, { preserveState: true });
    }

    return (
        <>
            <Head title="Mesa de Entrada" />
            <div className="flex flex-col gap-4 p-4">
                <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            Mesa de Entrada
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Bandeja de solicitudes virtuales y derivacion
                            interna.
                        </p>
                    </div>
                    <Link
                        href={complaintsIndex()}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold"
                    >
                        <ClipboardList className="size-4" />
                        Reclamos pendientes: {complaintSummary.pending}
                    </Link>
                </header>

                <section className="grid gap-3 sm:grid-cols-3">
                    <Metric
                        label="Solicitudes"
                        value={requests.data.length.toString()}
                    />
                    <Metric
                        label="Reclamos nuevos"
                        value={complaintSummary.new.toString()}
                    />
                    <Metric label="Canal" value="Web" />
                </section>

                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_220px_auto]"
                >
                    <label className="relative">
                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <input
                            className="input pl-9"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Numero, vecino, telefono o resumen"
                        />
                    </label>
                    <select
                        className="input"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        {statuses.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <button className="min-h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground">
                        Filtrar
                    </button>
                </form>

                <section className="grid gap-3">
                    {requests.data.map((request) => (
                        <Link
                            key={request.id}
                            href={show.url(request.id)}
                            className="grid gap-3 rounded-lg border bg-card p-4 text-sm hover:bg-muted/60 md:grid-cols-[1fr_180px_160px]"
                        >
                            <div className="flex gap-3">
                                <span
                                    className="mt-1 grid size-10 shrink-0 place-items-center rounded-md text-white"
                                    style={{
                                        backgroundColor: request.type.color,
                                    }}
                                >
                                    <FileText className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                        {request.type.category}
                                    </p>
                                    <h2 className="text-lg font-semibold tracking-normal">
                                        {request.subject}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {request.public_code} ·{' '}
                                        {request.applicant_name} ·{' '}
                                        {request.applicant_phone}
                                    </p>
                                    <p className="mt-2 line-clamp-2">
                                        {request.summary}
                                    </p>
                                </div>
                            </div>
                            <span className="text-muted-foreground">
                                {formatIntakeDate(request.created_at)}
                            </span>
                            <span
                                className={`h-fit rounded-md border px-3 py-1 text-center text-xs font-semibold ${intakeStatusClass(request.status)}`}
                            >
                                {
                                    statuses.find(
                                        (item) => item.value === request.status,
                                    )?.label
                                }
                            </span>
                        </Link>
                    ))}
                    {requests.data.length === 0 && (
                        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                            No hay solicitudes para estos filtros.
                        </div>
                    )}
                </section>
            </div>
        </>
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

AdminIntakeIndex.layout = {
    breadcrumbs: [{ title: 'Mesa de Entrada', href: index() }],
};
