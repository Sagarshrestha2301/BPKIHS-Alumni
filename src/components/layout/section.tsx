import type { ComponentProps } from 'react';

import { Container } from '@/components/layout/container';
import { cn } from '@/lib/utils';

type SectionProps = ComponentProps<'section'> & {
  tone?: 'default' | 'tint' | 'muted';
};

const tones = {
  default: '',
  tint: 'bg-secondary',
  muted: 'bg-muted',
} as const;

/** Page section with the standard vertical rhythm: 48px on phones, 96px on desktop. */
export function Section({ tone = 'default', className, children, ...props }: SectionProps) {
  return (
    <section className={cn('py-section lg:py-section-lg', tones[tone], className)} {...props}>
      <Container>{children}</Container>
    </section>
  );
}
