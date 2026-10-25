export type AuthErrorCode = 'unauthenticated' | 'forbidden';

/**
 * Authentication and authorisation failure. Kept separate from `session.ts` so the response
 * layer can recognise it without importing the database or Better Auth.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
