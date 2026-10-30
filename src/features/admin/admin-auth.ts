'use client';

/**
 * Administrator authentication helpers.
 *
 * These call Better Auth directly because the two-factor handshake has a step the public
 * ApiClient deliberately hides: a password sign-in can return `twoFactorRedirect` instead of
 * a session. Only the admin sign-in and security screens use this module; a member's sign-in
 * still goes through the typed client.
 */

const GENERIC_ERROR = 'That did not work. Please try again.';

/** A message safe to show next to the form. Provider details stay out of the UI. */
export class AdminAuthError extends Error {
  constructor(message: string = GENERIC_ERROR) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

interface AuthErrorBody {
  code?: string;
  message?: string;
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Check your email and password and try again.',
  INVALID_CODE: 'That code was not accepted. Check the time on your device and try again.',
  INVALID_BACKUP_CODE: 'That backup code was not accepted. It may already have been used.',
  TOO_MANY_ATTEMPTS: 'Too many wrong codes. Wait a few minutes before trying again.',
  ACCOUNT_TEMPORARILY_LOCKED: 'Too many wrong codes. Wait a few minutes before trying again.',
  INVALID_PASSWORD: 'That is not your password.',
  TWO_FACTOR_NOT_ENABLED: 'Two-factor authentication is not enabled for this account.',
};

async function post<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AdminAuthError('Could not reach the server. Check your connection and try again.');
  }

  const body = (await response.json().catch(() => null)) as (T & AuthErrorBody) | null;

  if (!response.ok) {
    const code = body?.code;
    throw new AdminAuthError(code ? MESSAGES[code] : GENERIC_ERROR);
  }

  return body as T;
}

export type AdminSignInResult = { twoFactorRequired: false } | { twoFactorRequired: true };

/** Starts a password sign-in. A 2FA account gets a challenge instead of a session. */
export async function adminSignIn(input: {
  email: string;
  password: string;
}): Promise<AdminSignInResult> {
  const payload = await post<{ twoFactorRedirect?: boolean }>('/api/auth/sign-in/email', input);
  return payload.twoFactorRedirect ? { twoFactorRequired: true } : { twoFactorRequired: false };
}

/** Completes a sign-in challenge with a six-digit authenticator code. */
export async function verifyAdminTotp(code: string): Promise<void> {
  await post('/api/auth/two-factor/verify-totp', { code });
}

/** Completes a sign-in challenge with one of the single-use backup codes. */
export async function verifyAdminBackupCode(code: string): Promise<void> {
  await post('/api/auth/two-factor/verify-backup-code', { code });
}

export interface TwoFactorEnrolment {
  /** `otpauth://` URI for the authenticator app. */
  totpURI: string;
  /** Single-use recovery codes. Shown exactly once. */
  backupCodes: string[];
}

/** Starts enrolment. The account is not protected until `confirmTwoFactor` succeeds. */
export async function enableTwoFactor(password: string): Promise<TwoFactorEnrolment> {
  return post<TwoFactorEnrolment>('/api/auth/two-factor/enable', { password, method: 'totp' });
}

/** Confirms the authenticator code and turns two-factor on for the account. */
export async function confirmTwoFactor(code: string): Promise<void> {
  await post('/api/auth/two-factor/verify-totp', { code });
}

/** Turns two-factor off. Required before enrolling a replacement device. */
export async function disableTwoFactor(password: string): Promise<void> {
  await post('/api/auth/two-factor/disable', { password });
}

/** Extracts the base32 secret from an otpauth URI for manual entry. */
export function totpSecret(uri: string): string {
  try {
    return new URL(uri).searchParams.get('secret') ?? '';
  } catch {
    return '';
  }
}

/** The name an authenticator app should show, for the manual-entry hint. */
export function totpAccount(uri: string): string {
  try {
    return decodeURIComponent(new URL(uri).pathname.replace(/^\//, ''));
  } catch {
    return '';
  }
}
