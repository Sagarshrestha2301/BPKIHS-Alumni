import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileView } from '@/features/directory/profile-view';
import type { Alumnus } from '@/lib/api/types';

const base: Alumnus = {
  id: 'alumnus-test',
  fullName: 'Asha Rai',
  programme: 'MBBS',
  batchYear: 2012,
  country: 'Nepal',
  privacy: { email: 'hidden', phone: 'hidden', profile: 'public' },
  status: 'approved',
  source: 'self_registered',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfileView', () => {
  it('shows programme, batch, work, place, further studies and the note', () => {
    render(
      <ProfileView
        person={{
          ...base,
          currentPosition: 'Consultant',
          organisation: 'Valley Hospital',
          city: 'Kathmandu',
          furtherStudies: 'MD in Medicine',
          note: 'Happy to mentor juniors.',
        }}
      />,
    );
    expect(screen.getByText('MBBS, batch 2012')).toBeTruthy();
    expect(screen.getByText('Consultant, Valley Hospital')).toBeTruthy();
    expect(screen.getByText('Kathmandu, Nepal')).toBeTruthy();
    expect(screen.getByText('MD in Medicine')).toBeTruthy();
    expect(screen.getByText('Happy to mentor juniors.')).toBeTruthy();
  });

  it('shows email and phone as links when the API sent them', () => {
    render(
      <ProfileView person={{ ...base, email: 'asha@example.com', phone: '+977 9800000000' }} />,
    );
    expect(screen.getByRole('link', { name: 'asha@example.com' }).getAttribute('href')).toBe(
      'mailto:asha@example.com',
    );
    expect(screen.getByRole('link', { name: '+977 9800000000' }).getAttribute('href')).toBe(
      'tel:+9779800000000',
    );
  });

  it('shows nothing about contact details when the API did not send them', () => {
    render(<ProfileView person={base} />);
    expect(screen.queryByText('Email')).toBeNull();
    expect(screen.queryByText('Phone')).toBeNull();
    expect(screen.queryByText('Work')).toBeNull();
    expect(screen.queryByText('Further studies')).toBeNull();
  });

  it('has a Donate link and a link back to the directory', () => {
    render(<ProfileView person={base} />);
    expect(screen.getByRole('link', { name: 'Donate' }).getAttribute('href')).toBe('/donate');
    expect(screen.getByRole('link', { name: 'Back to directory' }).getAttribute('href')).toBe(
      '/directory',
    );
  });
});
