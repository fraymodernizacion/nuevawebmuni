import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type Props = {
    fallbackHref?: InertiaLinkProps['href'];
};

export function BackButton({ fallbackHref }: Props) {
    function goBack() {
        if (window.history.length > 1) {
            window.history.back();

            return;
        }

        if (fallbackHref) {
            router.visit(fallbackHref);
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goBack}
            aria-label="Volver a la pantalla anterior"
            className="shrink-0"
        >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Volver</span>
        </Button>
    );
}
