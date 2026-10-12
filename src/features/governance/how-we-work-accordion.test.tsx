import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { howWeWork } from '@/content/about';
import { HowWeWorkAccordion } from '@/features/governance/how-we-work-accordion';

describe('HowWeWorkAccordion', () => {
  it('has one button per question, named by the question', () => {
    render(<HowWeWorkAccordion />);
    expect(screen.getAllByRole('button')).toHaveLength(howWeWork.items.length);
    for (const item of howWeWork.items) {
      expect(screen.getByRole('button', { name: item.question })).toBeTruthy();
    }
  });

  it('starts with every answer closed', () => {
    render(<HowWeWorkAccordion />);
    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('has an answer for every question', () => {
    for (const item of howWeWork.items) {
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });
});
