import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

type RequestState = 'idle' | 'loading' | 'saving';

export function GlobalRequestIndicator() {
    const [state, setState] = useState<RequestState>('idle');
    const delayRef = useRef<number | null>(null);

    useEffect(() => {
        const start = router.on('start', (event) => {
            const method = (event as CustomEvent).detail?.visit?.method;
            const nextState = method === 'get' ? 'loading' : 'saving';

            delayRef.current = window.setTimeout(() => {
                setState(nextState);
            }, 150);
        });

        const finish = router.on('finish', () => {
            if (delayRef.current !== null) {
                window.clearTimeout(delayRef.current);
                delayRef.current = null;
            }

            setState('idle');
        });

        return () => {
            start();
            finish();
        };
    }, []);

    if (state === 'idle') {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed right-4 bottom-4 z-50 flex min-h-12 items-center gap-3 rounded-md border bg-popover px-4 py-3 text-sm font-semibold text-popover-foreground shadow-lg"
        >
            <Spinner className="size-5 text-primary" />
            {state === 'saving' ? 'Guardando...' : 'Cargando...'}
        </div>
    );
}
