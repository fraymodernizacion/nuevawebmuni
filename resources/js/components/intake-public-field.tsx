import { cloneElement, useId } from 'react';
import type { AriaAttributes, ReactElement } from 'react';

export type IntakeFieldAria = Pick<
    AriaAttributes,
    'aria-required' | 'aria-invalid' | 'aria-describedby'
> & { id?: string };

export function IntakePublicField({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactElement<IntakeFieldAria>;
}) {
    const fieldId = useId();
    const errorId = `${fieldId}-error`;

    return (
        <div className="flex min-w-0 flex-col gap-2 text-base font-semibold">
            <label htmlFor={fieldId}>
                {label}
                {required && <span aria-hidden="true"> *</span>}
            </label>
            {cloneElement(children, {
                id: fieldId,
                'aria-required': required || undefined,
                'aria-invalid': Boolean(error) || undefined,
                'aria-describedby': error ? errorId : undefined,
            })}
            {error && (
                <span
                    id={errorId}
                    className="text-base font-medium text-red-800 dark:text-red-300"
                >
                    {error}
                </span>
            )}
        </div>
    );
}
