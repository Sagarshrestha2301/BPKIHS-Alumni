import type { RegisterFormValues } from '@/features/register/register-form-values';

export type RegisterFieldName = keyof RegisterFormValues;

export type RegisterStep = {
  id: string;
  label: string;
  fields: readonly RegisterFieldName[];
};

/** Every form field belongs to exactly one step (a test enforces this). */
export const REGISTER_STEPS = [
  {
    id: 'about',
    label: 'About you',
    fields: ['fullName', 'programme', 'batchYear', 'country', 'countryOther', 'city'],
  },
  {
    id: 'career',
    label: 'Career',
    fields: ['currentPosition', 'organisation', 'furtherStudies', 'note'],
  },
  {
    id: 'privacy',
    label: 'Privacy and consent',
    fields: ['email', 'phone', 'privacyEmail', 'privacyPhone', 'privacyProfile', 'consent'],
  },
] as const satisfies readonly RegisterStep[];

const ALL_FIELDS = new Set<string>(REGISTER_STEPS.flatMap((step) => step.fields));

export function isRegisterField(name: string): name is RegisterFieldName {
  return ALL_FIELDS.has(name);
}
