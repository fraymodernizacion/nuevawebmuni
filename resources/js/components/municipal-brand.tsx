import { cn } from '@/lib/utils';

type MunicipalBrandProps = {
    compact?: boolean;
    className?: string;
    imageClassName?: string;
    textClassName?: string;
};

export function MunicipalBrand({
    compact = false,
    className,
    imageClassName,
    textClassName,
}: MunicipalBrandProps) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <img
                src="/assets/optimized/fme-04.png"
                alt="Municipalidad de Fray Mamerto Esquiú"
                className={cn('h-12 w-auto object-contain', imageClassName)}
            />
            {!compact && (
                <div className={cn('min-w-0 leading-tight', textClassName)}>
                    <p className="truncate text-sm font-semibold">
                        Municipalidad de
                    </p>
                    <p className="truncate text-base font-bold">
                        Fray Mamerto Esquiú
                    </p>
                </div>
            )}
        </div>
    );
}
