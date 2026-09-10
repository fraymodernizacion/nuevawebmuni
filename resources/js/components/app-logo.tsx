export default function AppLogo() {
    return (
        <>
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 ring-1 ring-sidebar-border group-data-[collapsible=icon]:size-8">
                <img
                    src="/assets/optimized/fme-04.png"
                    alt="Municipalidad de Fray Mamerto Esquiú"
                    className="max-h-full max-w-full object-contain"
                />
            </div>
            <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-medium text-sidebar-foreground/70">
                    Municipalidad de
                </span>
                <span className="truncate text-sm font-bold text-sidebar-foreground">
                    Fray Mamerto Esquiú
                </span>
            </div>
        </>
    );
}
