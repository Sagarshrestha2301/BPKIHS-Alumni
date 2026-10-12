import type { ZodType } from 'zod';

import { ApiError } from '../errors';

/** Validates form input with its Zod schema. Failures become an ApiError with field messages. */
export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join('.') || '_form';
    fieldErrors[key] ??= issue.message;
  }
  const first = result.error.issues[0]?.message ?? 'Please check the form and try again.';
  throw new ApiError('validation', first, { fieldErrors });
}
