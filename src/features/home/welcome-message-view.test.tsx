import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { welcomeSection } from '@/content/home';
import { WelcomeMessageView } from '@/features/home/welcome-message-view';

const message = {
  author: 'Dr. Sita Rai',
  role: 'President',
  text: 'First paragraph.\n\nSecond paragraph.',
};

describe('WelcomeMessageView', () => {
  it('is a named section with one paragraph per block of text', () => {
    render(<WelcomeMessageView message={message} />);
    expect(screen.getByRole('region', { name: welcomeSection.title })).toBeTruthy();
    expect(screen.getByText('First paragraph.')).toBeTruthy();
    expect(screen.getByText('Second paragraph.')).toBeTruthy();
  });

  it('names the author and role', () => {
    render(<WelcomeMessageView message={message} />);
    expect(screen.getByText('Dr. Sita Rai')).toBeTruthy();
    expect(screen.getByText('President')).toBeTruthy();
  });

  it('renders nothing when there is no text', () => {
    const { container } = render(<WelcomeMessageView message={{ ...message, text: '  ' }} />);
    expect(container.firstChild).toBeNull();
  });
});
