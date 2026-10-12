import { describe, expect, it } from 'vitest';

import { ApiError, isApiError } from './errors';

describe('ApiError', () => {
  it('maps codes to the usual HTTP status', () => {
    expect(new ApiError('not_found', 'Missing').status).toBe(404);
    expect(new ApiError('validation', 'Bad input').status).toBe(422);
    expect(new ApiError('not_implemented', 'Later').status).toBe(501);
  });

  it('carries field errors and is recognised by isApiError', () => {
    const error = new ApiError('validation', 'Bad input', { fieldErrors: { email: 'Required' } });
    expect(isApiError(error)).toBe(true);
    expect(error.fieldErrors?.email).toBe('Required');
    expect(isApiError(new Error('plain'))).toBe(false);
  });
});
