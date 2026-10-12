import { describe, expect, it } from 'vitest';

import { PROGRAMMES } from '@/lib/constants/domain';

import { alumnusSchema } from '../../record-schemas';
import { alumniSeed } from './alumni';

describe('alumni seed data', () => {
  it('has about 60 records', () => {
    expect(alumniSeed.length).toBeGreaterThanOrEqual(55);
    expect(alumniSeed.length).toBeLessThanOrEqual(65);
  });

  it('passes the alumnus schema, record by record', () => {
    for (const person of alumniSeed) {
      const result = alumnusSchema.safeParse(person);
      expect(result.success, `${person.id} (${person.fullName})`).toBe(true);
    }
  });

  it('has unique ids and unique names', () => {
    expect(new Set(alumniSeed.map((p) => p.id)).size).toBe(alumniSeed.length);
    expect(new Set(alumniSeed.map((p) => p.fullName)).size).toBe(alumniSeed.length);
  });

  it('flags every record as a placeholder', () => {
    expect(alumniSeed.every((p) => p.placeholder === true)).toBe(true);
  });

  it('covers every programme, including BMIT', () => {
    const used = new Set(alumniSeed.map((p) => p.programme));
    for (const programme of PROGRAMMES) expect(used.has(programme), programme).toBe(true);
  });

  it('spans several countries and many batches', () => {
    expect(new Set(alumniSeed.map((p) => p.country)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(alumniSeed.map((p) => p.batchYear)).size).toBeGreaterThanOrEqual(15);
    expect(alumniSeed.filter((p) => p.country === 'Nepal').length).toBeGreaterThan(
      alumniSeed.length / 2,
    );
  });

  it('includes every status, so privacy and approval rules have something to catch', () => {
    const statuses = new Set(alumniSeed.map((p) => p.status));
    expect(statuses).toEqual(new Set(['approved', 'pending', 'rejected']));
    expect(alumniSeed.filter((p) => p.status === 'approved').length).toBeGreaterThan(50);
  });

  it('includes hidden profiles and each visibility level', () => {
    expect(alumniSeed.some((p) => p.privacy.profile === 'hidden')).toBe(true);
    expect(alumniSeed.some((p) => p.privacy.email === 'public')).toBe(true);
    expect(alumniSeed.some((p) => p.privacy.email === 'alumni_only')).toBe(true);
    expect(alumniSeed.some((p) => p.privacy.phone === 'alumni_only')).toBe(true);
  });

  it('includes both sources, and some records with further studies', () => {
    expect(alumniSeed.some((p) => p.source === 'csv_import')).toBe(true);
    expect(alumniSeed.some((p) => p.source === 'self_registered')).toBe(true);
    expect(alumniSeed.some((p) => p.furtherStudies)).toBe(true);
    expect(alumniSeed.some((p) => !p.furtherStudies)).toBe(true);
  });

  it('uses only obviously fake contact details', () => {
    for (const person of alumniSeed) {
      expect(person.email, person.id).toMatch(/@example\.com$/);
      expect(person.phone, person.id).toMatch(/^\+977 9800000\d{3}$/);
    }
  });
});
