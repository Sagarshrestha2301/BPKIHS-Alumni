import {
  OTHER_COUNTRY,
  type RegisterFormValues,
  toRegistrationCandidate,
} from '@/features/register/register-form-values';
import {
  isRegisterField,
  REGISTER_STEPS,
  type RegisterFieldName,
} from '@/features/register/register-steps';
import { type RegistrationInput, registrationSchema } from '@/lib/api/schemas';

export type FieldErrors = Partial<Record<RegisterFieldName, string>>;

const PROGRAMME_MESSAGE = 'Choose your programme.';
const COUNTRY_MESSAGE = 'Choose your country.';

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Which form field an issue from the schema belongs to. */
function fieldFor(path: readonly PropertyKey[], values: RegisterFormValues) {
  const [head, tail] = path;
  if (typeof head !== 'string') return undefined;
  if (head === 'privacy' && typeof tail === 'string') {
    const name = 'privacy' + capitalise(tail);
    return isRegisterField(name) ? name : undefined;
  }
  if (head === 'country') return values.country === OTHER_COUNTRY ? 'countryOther' : 'country';
  return isRegisterField(head) ? head : undefined;
}

function messageFor(field: RegisterFieldName, schemaMessage: string, values: RegisterFormValues) {
  if (field === 'programme') return PROGRAMME_MESSAGE;
  if (field === 'country' && values.country === '') return COUNTRY_MESSAGE;
  return schemaMessage;
}

type Parsed = { success: true; data: RegistrationInput } | { success: false; errors: FieldErrors };

/** Runs the real registration schema over the whole form. One message per field (the first). */
export function parseRegistration(values: RegisterFormValues): Parsed {
  const result = registrationSchema.safeParse(toRegistrationCandidate(values));
  if (result.success) return { success: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = fieldFor(issue.path, values);
    if (field) errors[field] ??= messageFor(field, issue.message, values);
  }
  return { success: false, errors };
}

export function firstInvalidFieldIn(
  fields: readonly RegisterFieldName[],
  errors: FieldErrors,
): RegisterFieldName | undefined {
  return fields.find((field) => errors[field] !== undefined);
}

export type ValidateAllResult =
  | { ok: true; data: RegistrationInput }
  | {
      ok: false;
      errors: FieldErrors;
      firstInvalidStep: number;
      firstInvalidField: RegisterFieldName | undefined;
    };

/** The last check before submitting: every step, so a skipped step cannot slip through. */
export function validateAll(values: RegisterFormValues): ValidateAllResult {
  const parsed = parseRegistration(values);
  if (parsed.success) return { ok: true, data: parsed.data };

  const found = REGISTER_STEPS.findIndex((step) => firstInvalidFieldIn(step.fields, parsed.errors));
  const firstInvalidStep = Math.max(found, 0);
  const step = REGISTER_STEPS[firstInvalidStep];
  return {
    ok: false,
    errors: parsed.errors,
    firstInvalidStep,
    firstInvalidField: step ? firstInvalidFieldIn(step.fields, parsed.errors) : undefined,
  };
}
