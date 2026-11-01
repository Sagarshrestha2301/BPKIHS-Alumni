'use client';

import { Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

/**
 * A password field with a show/hide toggle.
 *
 * The toggle is a real button inside the field: `type="button"` so it never submits the form,
 * a name that changes with its state for screen readers, and a 44 px target to match the
 * field height. Visibility is per field and per mount : reloading the page hides it again.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={cn('pr-11', className)} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={label}
        title={label}
        className="hover:text-primary-900 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-neutral-600 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
