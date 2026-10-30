import { describe, expect, it } from 'vitest';

import { detectMapping, normaliseProgramme, parseCsv } from './alumni-import';

describe('parseCsv', () => {
  it('reads a plain file with CRLF and a BOM', () => {
    const parsed = parseCsv(
      '\uFEFFName,Email\r\nAsha,asha@example.com\r\nBikash,bikash@example.com\r\n',
    );

    expect(parsed.headers).toEqual(['Name', 'Email']);
    expect(parsed.rows).toEqual([
      { row: 2, cells: ['Asha', 'asha@example.com'] },
      { row: 3, cells: ['Bikash', 'bikash@example.com'] },
    ]);
  });

  it('keeps commas, quotes and newlines inside a quoted field', () => {
    const parsed = parseCsv('Name,Note\r\n"Dahal, Asha","Said ""hello""\nand left"\r\n');

    expect(parsed.rows[0]?.cells).toEqual(['Dahal, Asha', 'Said "hello"\nand left']);
  });

  it('skips empty rows but keeps the real row number', () => {
    const parsed = parseCsv('Name,Email\n\nAsha,asha@example.com\n,\nBikash,bikash@example.com\n');

    expect(parsed.rows.map((row) => row.row)).toEqual([3, 5]);
  });

  it('handles a file with only a header', () => {
    const parsed = parseCsv('Name,Email\n');

    expect(parsed.headers).toEqual(['Name', 'Email']);
    expect(parsed.rows).toEqual([]);
  });
});

describe('detectMapping', () => {
  it('matches common register headings', () => {
    const mapping = detectMapping([
      'Alumnus Name',
      'Email Address',
      'Course',
      'Graduation Year',
      'Country of Residence',
      'Mobile',
      'Current Position',
      'Organization',
    ]);

    expect(mapping).toEqual({
      fullName: 0,
      email: 1,
      programme: 2,
      batchYear: 3,
      country: 4,
      phone: 5,
      city: null,
      currentPosition: 6,
      organisation: 7,
      furtherStudies: null,
      note: null,
    });
  });

  it('does not reuse one column for two fields', () => {
    const mapping = detectMapping(['Name', 'Name']);

    expect(mapping.fullName).toBe(0);
    expect(mapping.email).toBeNull();
  });

  it('leaves unknown headings unmapped', () => {
    const mapping = detectMapping(['Something', 'Else']);

    expect(Object.values(mapping).every((value) => value === null)).toBe(true);
  });
});

describe('normaliseProgramme', () => {
  it('accepts the enum values and common register spellings', () => {
    expect(normaliseProgramme('MBBS')).toBe('MBBS');
    expect(normaliseProgramme('B.Sc. Nursing')).toBe('BSc Nursing');
    expect(normaliseProgramme('MD')).toBe('MD/MS');
    expect(normaliseProgramme('M.Ch')).toBe('DM/MCh');
    expect(normaliseProgramme(' bds ')).toBe('BDS');
  });

  it('refuses a value it cannot identify', () => {
    expect(normaliseProgramme('Diploma in something')).toBeNull();
    expect(normaliseProgramme('')).toBeNull();
  });
});
