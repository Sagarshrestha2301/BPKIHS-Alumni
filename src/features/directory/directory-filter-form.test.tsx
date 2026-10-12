import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DirectoryFilterForm } from '@/features/directory/directory-filter-form';

const options = { countries: ['Nepal', 'India'], batchYears: [2020, 2015] };

function hidden(container: HTMLElement, name: string) {
  return container.querySelector<HTMLInputElement>('input[type="hidden"][name="' + name + '"]');
}

describe('DirectoryFilterForm', () => {
  it('shows the current filters as selected and carries the search and sort along', () => {
    const { container } = render(
      <DirectoryFilterForm
        idPrefix="t"
        options={options}
        params={{
          q: 'rai',
          sort: 'batch_newest',
          page: 3,
          programme: 'BMIT',
          batchYear: 2015,
          country: 'India',
          city: 'Pune',
          furtherStudies: true,
        }}
      />,
    );
    expect((screen.getByLabelText('Programme') as HTMLSelectElement).value).toBe('BMIT');
    expect((screen.getByLabelText('Batch year') as HTMLSelectElement).value).toBe('2015');
    expect((screen.getByLabelText('Country') as HTMLSelectElement).value).toBe('India');
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('Pune');
    expect((screen.getByLabelText('Has further studies') as HTMLInputElement).checked).toBe(true);
    expect(hidden(container, 'q')?.value).toBe('rai');
    expect(hidden(container, 'sort')?.value).toBe('batch_newest');
    expect(hidden(container, 'page')).toBeNull();
  });

  it('starts on "any" and sends no hidden fields for the defaults', () => {
    const { container } = render(
      <DirectoryFilterForm idPrefix="t" options={options} params={{ sort: 'name', page: 1 }} />,
    );
    expect((screen.getByLabelText('Programme') as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText('Has further studies') as HTMLInputElement).checked).toBe(false);
    expect(hidden(container, 'q')).toBeNull();
    expect(hidden(container, 'sort')).toBeNull();
  });

  it('keeps a country from the URL even when the menu does not list it', () => {
    render(
      <DirectoryFilterForm
        idPrefix="t"
        options={options}
        params={{ sort: 'name', page: 1, country: 'Japan' }}
      />,
    );
    expect((screen.getByLabelText('Country') as HTMLSelectElement).value).toBe('Japan');
  });

  it('lists every programme, including BMIT', () => {
    render(
      <DirectoryFilterForm idPrefix="t" options={options} params={{ sort: 'name', page: 1 }} />,
    );
    expect(screen.getByRole('option', { name: 'BMIT' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Any programme' })).toBeTruthy();
  });
});
