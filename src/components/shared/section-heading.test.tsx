import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionHeading } from '@/components/shared/section-heading';

describe('SectionHeading', () => {
  it('renders the eyebrow, an h2 title and the description', () => {
    render(
      <SectionHeading eyebrow="Give" title="Support BPKIHS" description="Every gift helps." />,
    );
    expect(screen.getByText('Give')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Support BPKIHS' })).toBeInTheDocument();
    expect(screen.getByText('Every gift helps.')).toBeInTheDocument();
  });
});
