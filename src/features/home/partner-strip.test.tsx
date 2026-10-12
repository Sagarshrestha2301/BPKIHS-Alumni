import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { partnerStrip } from '@/content/home';
import { site } from '@/content/site';
import { PartnerStrip } from '@/features/home/partner-strip';

describe('PartnerStrip', () => {
  it('is a named section', () => {
    render(<PartnerStrip />);
    expect(screen.getByRole('region', { name: partnerStrip.title })).toBeTruthy();
  });

  it('links the institute in a new tab', () => {
    render(<PartnerStrip />);
    const link = screen.getByRole('link', { name: new RegExp(site.instituteName) });
    expect(link.getAttribute('href')).toBe(site.instituteUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
