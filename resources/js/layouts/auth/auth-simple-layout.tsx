import { Link } from '@inertiajs/react';
import { MunicipalBrand } from '@/components/municipal-brand';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh bg-zinc-50 text-zinc-950 lg:grid-cols-[minmax(0,1fr)_460px] dark:bg-zinc-950 dark:text-zinc-50">
            <section className="relative hidden overflow-hidden lg:block">
                <img
                    src="/assets/optimized/fme-10.jpg"
                    alt="Municipalidad de Fray Mamerto Esquiú"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-900/65 to-transparent" />
                <div className="relative flex h-full max-w-2xl flex-col justify-end gap-4 p-12 text-white">
                    <MunicipalBrand
                        imageClassName="h-16 brightness-0 invert"
                        textClassName="text-white"
                    />
                    <div className="max-w-xl">
                        <p className="text-sm font-semibold text-emerald-100 uppercase">
                            Sistema municipal
                        </p>
                        <h2 className="mt-3 text-4xl font-bold tracking-normal">
                            Gestión cercana, información clara.
                        </h2>
                        <p className="mt-3 text-base text-emerald-50/90">
                            Acceso interno para operar reclamos, mesa de entrada
                            y servicios municipales.
                        </p>
                    </div>
                </div>
            </section>
            <section className="flex min-h-svh items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <MunicipalBrand
                                    compact
                                    imageClassName="h-16"
                                    className="justify-center"
                                />
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </section>
        </div>
    );
}
