import type { Programme, Visibility } from '@/lib/constants/domain';

/** The country menu offers these. "Other" reveals a text box, so filter values stay consistent. */
export const OTHER_COUNTRY = 'Other';
export const COUNTRY_OPTIONS = [
  'Nepal',
  'India',
  'United States',
  'United Kingdom',
  'Australia',
  'Canada',
  'Germany',
  'Japan',
  'Qatar',
  'United Arab Emirates',
  OTHER_COUNTRY,
] as const;

/** What the inputs hold: strings and booleans, exactly as the browser gives them. */
export type RegisterFormValues = {
  fullName: string;
  /** Empty until the person chooses one. */
  programme: '' | Programme;
  batchYear: string;
  /** Empty until chosen, one of COUNTRY_OPTIONS otherwise. */
  country: string;
  /** Used only when country is "Other". */
  countryOther: string;
  city: string;
  currentPosition: string;
  organisation: string;
  furtherStudies: string;
  note: string;
  email: string;
  phone: string;
  privacyEmail: Visibility;
  privacyPhone: Visibility;
  privacyProfile: Visibility;
  consent: boolean;
};

/** Nothing is exposed unless the person opts in. A hidden profile is not listed at all. */
export function createInitialRegisterValues(): RegisterFormValues {
  return {
    fullName: '',
    programme: '',
    batchYear: '',
    country: '',
    countryOther: '',
    city: '',
    currentPosition: '',
    organisation: '',
    furtherStudies: '',
    note: '',
    email: '',
    phone: '',
    privacyEmail: 'hidden',
    privacyPhone: 'hidden',
    privacyProfile: 'alumni_only',
    consent: false,
  };
}

/** Whole years only. Empty gives undefined; anything else that is not digits gives NaN. */
export function parseBatchYear(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/**
 * The form values shaped like the registration schema's input. It is not typed as
 * RegistrationInput on purpose: it may still be invalid. validateAll returns the parsed,
 * typed result once it passes.
 */
export function toRegistrationCandidate(values: RegisterFormValues): Record<string, unknown> {
  return {
    fullName: values.fullName,
    email: values.email,
    phone: values.phone,
    programme: values.programme,
    batchYear: parseBatchYear(values.batchYear),
    furtherStudies: values.furtherStudies,
    currentPosition: values.currentPosition,
    organisation: values.organisation,
    city: values.city,
    country: values.country === OTHER_COUNTRY ? values.countryOther : values.country,
    note: values.note,
    privacy: {
      email: values.privacyEmail,
      phone: values.privacyPhone,
      profile: values.privacyProfile,
    },
    consent: values.consent,
  };
}
