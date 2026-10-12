import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getInitials, InitialsAvatar } from '@/components/shared/initials-avatar';

describe('getInitials', () => {
  it('uses the first and last word and skips titles', () => {
    expect(getInitials('Dr. Sita Rai')).toBe('SR');
    expect(getInitials('Anil Kumar Sharma')).toBe('AS');
  });

  it('handles one-word and empty names', () => {
    expect(getInitials('Madonna')).toBe('M');
    expect(getInitials('')).toBe('');
  });
});

describe('InitialsAvatar', () => {
  it('shows the initials and is hidden from screen readers', () => {
    const { container } = render(<InitialsAvatar name="Dr. Sita Rai" />);
    const avatar = container.firstElementChild;
    expect(avatar?.textContent).toBe('SR');
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
  });
});
