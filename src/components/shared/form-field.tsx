import { CircleAlert } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Props to spread onto the control inside a FormField, so label, hint and error are linked to it. */
export type FormFieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
};

type FormFieldProps = {
  label: string;
  /** Render the control and spread the given props onto it. */
  children: (control: FormFieldControlProps) => ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

/** Label above, helper text, and an inline error with an icon. Never uses colour alone for errors. */
export function FormField({ label, children, hint, error, required, className }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger-600 ml-0.5">
            *
          </span>
        ) : null}
      </Label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-sm text-neutral-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-danger-600 flex items-start gap-1.5 text-sm font-medium"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
