import type { RegisterFormValues } from '@/features/register/register-form-values';
import { REGISTER_STEPS, type RegisterFieldName } from '@/features/register/register-steps';
import {
  type FieldErrors,
  firstInvalidFieldIn,
  parseRegistration,
} from '@/features/register/validate-all';

export type StepValidation =
  | { ok: true }
  | { ok: false; errors: FieldErrors; firstInvalidField: RegisterFieldName | undefined };

/** Only the fields that belong to this step count, so later steps do not block Next. */
export function validateStep(stepIndex: number, values: RegisterFormValues): StepValidation {
  const step = REGISTER_STEPS[stepIndex];
  if (!step) throw new RangeError('There is no registration step ' + stepIndex + '.');

  const parsed = parseRegistration(values);
  if (parsed.success) return { ok: true };

  const errors: FieldErrors = {};
  for (const field of step.fields) {
    const message = parsed.errors[field];
    if (message !== undefined) errors[field] = message;
  }
  if (Object.keys(errors).length === 0) return { ok: true };
  return { ok: false, errors, firstInvalidField: firstInvalidFieldIn(step.fields, errors) };
}
