import { describe, expect, it } from 'vitest';

import { createInitialRegisterValues } from '@/features/register/register-form-values';
import { REGISTER_STEPS } from '@/features/register/register-steps';
import { privacySchema, registrationSchema } from '@/lib/api/schemas';

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const owned: string[] = REGISTER_STEPS.flatMap((step) => [...step.fields]);

const schemaFields = Object.keys(registrationSchema.shape).flatMap((key) =>
  key === 'privacy'
    ? Object.keys(privacySchema.shape).map((name) => 'privacy' + capitalise(name))
    : [key],
);

describe('REGISTER_STEPS', () => {
  it('has three steps with unique ids and labels', () => {
    expect(REGISTER_STEPS).toHaveLength(3);
    expect(new Set(REGISTER_STEPS.map((step) => step.id)).size).toBe(3);
    expect(new Set(REGISTER_STEPS.map((step) => step.label)).size).toBe(3);
  });

  it('covers every field of the registration schema', () => {
    for (const field of schemaFields) expect(owned).toContain(field);
  });

  it('owns each form field exactly once', () => {
    expect([...owned].sort()).toEqual(Object.keys(createInitialRegisterValues()).sort());
  });
});
