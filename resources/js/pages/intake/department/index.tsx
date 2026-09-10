import { Head, Link } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import {
    formatIntakeDate,
    intakeDerivationStatusClass,
} from '@/lib/intake-labels';
import { index, show } from '@/routes/intake/department';

type Department = {
    id: number;
    name: string;
    color: string;
};

type Derivation = {
    id: number;
    status: string;
    status_label: string;
    department: Department;
    assistance_type?: { name: string; color: string } | null;
    request: {
        public_code: string;
        subject: string;
        summary: string;
        applicant_name: string;
        applicant_phone: string;
        created_at: string;
    };
};

export default function IntakeDepartmentIndex({
    department,
    derivations,
}: {
    department?: Department | null;
    derivations: {
        data: Derivation[];
    };
}) {
    return (
        <>
            <Head title="Mis derivaciones" />
            <div className="flex flex-col gap-4 p-4">
                <header className="rounded-lg border bg-card p-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        Mesa de Entrada
                    </p>
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Mis derivaciones
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {department?.name ?? 'Solicitudes derivadas a tu area.'}
                    </p>
                </header>

                <section className="grid gap-3">
                    {derivations.data.map((derivation) => (
                        <Link
                            key={derivation.id}
                            href={show.url(derivation.id)}
                            className="grid gap-3 rounded-lg border bg-card p-4 hover:bg-muted/60"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span
                                    className="grid size-10 shrink-0 place-items-center rounded-md text-white"
                                    style={{
                                        backgroundColor:
                                            derivation.assistance_type?.color ??
                                            derivation.department.color,
                                    }}
                                >
                                    <Inbox className="size-5" />
                                </span>
                                <span
                                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${intakeDerivationStatusClass(derivation.status)}`}
                                >
                                    {derivation.status_label}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    {derivation.assistance_type?.name ??
                                        derivation.department.name}
                                </p>
                                <h2 className="text-lg font-semibold tracking-normal">
                                    {derivation.request.subject}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {derivation.request.public_code} ·{' '}
                                    {formatIntakeDate(
                                        derivation.request.created_at,
                                    )}
                                </p>
                            </div>
                            <p className="line-clamp-3 text-sm">
                                {derivation.request.summary}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {derivation.request.applicant_name} ·{' '}
                                {derivation.request.applicant_phone}
                            </p>
                        </Link>
                    ))}
                    {derivations.data.length === 0 && (
                        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                            Todavia no hay derivaciones para tu area.
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

IntakeDepartmentIndex.layout = {
    breadcrumbs: [{ title: 'Mis derivaciones', href: index() }],
};
