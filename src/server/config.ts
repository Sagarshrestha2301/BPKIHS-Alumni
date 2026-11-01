/**
 * Operational configuration.
 *
 * Every limit, timeout, origin and address the application reasons about lives here and can
 * be overridden with an environment variable. Components and services never embed a magic
 * number or a host of their own. Product copy stays in `src/content`.
 *
 * This module must stay runtime-neutral: the edge proxy imports it too (no Node APIs).
 */

import {
  PASSWORD_MIN_LENGTH,
  REGISTRATION_CODE_LENGTH,
  REGISTRATION_CODE_RESEND_SECONDS,
} from '../lib/constants/domain';
import {
  ADMIN_PAGE_SIZE,
  AUDIT_LOG_LIMIT,
  DEFAULT_PAGE_SIZE,
  DONATION_PAGE_SIZE,
  DONOR_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../lib/constants/pagination';
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_DIMENSION,
  PHOTO_MIN_DIMENSION,
  PHOTO_OUTPUT_QUALITY,
  PHOTO_OUTPUT_SIZE,
} from '../lib/constants/photo';
import { DEVELOPMENT_ORIGIN, SITE_TIME_ZONE } from '../lib/constants/site';

const isProduction = process.env.NODE_ENV === 'production';

function text(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function integer(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

function boolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  throw new Error(`${name} must be true or false.`);
}

export interface RateLimitRule {
  /** Requests allowed inside one window. */
  max: number;
  windowMs: number;
}

export type RateLimitBucket =
  | 'registration'
  | 'registrationOtp'
  | 'donation'
  | 'rsvp'
  | 'post'
  | 'report'
  | 'newsletter'
  | 'support'
  | 'profile'
  | 'photo'
  | 'admin'
  | 'adminRead'
  | 'csrf';

export const config = {
  appName: text('APP_NAME', 'BPKIHS Alumni Association'),
  timeZone: text('SITE_TIME_ZONE', SITE_TIME_ZONE),

  /** Only used for local development when no origin variable is set. */
  developmentOrigin: DEVELOPMENT_ORIGIN,

  http: {
    /**
     * Read the client address from the proxy headers. Enable only when a reverse proxy you
     * control overwrites them; otherwise a client can choose its own rate-limit bucket.
     */
    trustProxy: boolean('TRUST_PROXY', isProduction),
    maxBodyBytes: integer('MAX_REQUEST_BYTES', 128 * 1024, 1024, 4 * 1024 * 1024),
    hstsMaxAgeSeconds: integer('HSTS_MAX_AGE_SECONDS', 15_552_000, 0, 63_072_000),
  },

  session: {
    /** Absolute lifetime of a signed-in session. */
    maxAgeSeconds: integer('SESSION_MAX_AGE_HOURS', 24, 1, 24 * 30) * 60 * 60,
    /** Rolling refresh interval; also the idle timeout for admin work. */
    updateAgeSeconds: integer('SESSION_UPDATE_AGE_MINUTES', 15, 1, 24 * 60) * 60,
    cookieCacheSeconds: integer('SESSION_COOKIE_CACHE_MINUTES', 5, 0, 60) * 60,
  },

  passwords: {
    minLength: integer('PASSWORD_MIN_LENGTH', PASSWORD_MIN_LENGTH, 8, 64),
    maxLength: integer('PASSWORD_MAX_LENGTH', 128, 64, 256),
    /** Lifetime of an emailed password-reset link. */
    resetTokenMinutes: integer('PASSWORD_RESET_TOKEN_MINUTES', 30, 5, 120),
    /**
     * tracker E2: breached-password check. When a password a member is choosing has already
     * appeared in a public data leak, refuse it. Never invoked on sign-in itself, only on
     * sign-up, change-password and reset-password. Defaults near the HaveIBeenPwned guidance.
     */
    breachedPasswordLookup: {
      /** Set PASSWORD_BREACH_LOOKUP=false only for an offline or air-gapped deployment. */
      enabled: boolean('PASSWORD_BREACH_LOOKUP', true),
      /** Refuse at or above this many occurrences in known public leaks. */
      minimumAppearances: integer('PASSWORD_BREACH_MIN_OCCURRENCES', 1, 1, 1000),
      /**
       * The lookup is an outbound call per password chosen; cap it per process per hour so a
       * script cannot spend the server's bandwidth. When the budget is empty, the lookup fails
       * open and lets the form continue.
       */
      lookupsPerHour: integer('PASSWORD_BREACH_LOOKUPS_PER_HOUR', 60, 1, 100_000),
      /** Cap round-trip latency risk against slow reachability from Nepal. */
      timeoutMs: integer('PASSWORD_BREACH_TIMEOUT_MS', 2_000, 250, 15_000),
    },
  },

  auth: {
    /** Better Auth's own limiter, in addition to the route limiter. */
    globalMax: 100,
    globalWindowSeconds: 60,
    /**
     * Every page load asks who is signed in, so that one read needs a far wider window than
     * a credential check. It compares a cookie (and its cache) rather than doing work, and a
     * throttled answer would silently sign the header out for a real visitor.
     */
    sessionMax: integer('AUTH_SESSION_MAX', 1000, 60, 100_000),
    sessionWindowSeconds: integer('AUTH_SESSION_WINDOW_SECONDS', 60, 10, 3600),
    signInMax: integer('AUTH_SIGN_IN_MAX', 5, 1, 100),
    signInWindowSeconds: integer('AUTH_SIGN_IN_WINDOW_SECONDS', 60, 10, 3600),
    signUpMax: integer('AUTH_SIGN_UP_MAX', 5, 1, 100),
    signUpWindowSeconds: integer('AUTH_SIGN_UP_WINDOW_SECONDS', 3600, 60, 86_400),
    /** Emailed one-time codes: how fast one address may ask for a new code, and how many
     *  wrong guesses the verifier accepts before the code is burned. */
    otpMax: integer('AUTH_OTP_MAX', 3, 1, 20),
    otpWindowSeconds: integer('AUTH_OTP_WINDOW_SECONDS', 60, 10, 3600),
  },

  otp: {
    /** Digits in a registration code. */
    length: integer('OTP_LENGTH', REGISTRATION_CODE_LENGTH, 4, 8),
    /** How long a code stays valid. */
    expiresInSeconds: integer('OTP_EXPIRES_MINUTES', 15, 1, 60) * 60,
    /** Wrong guesses allowed before the code must be resent. */
    maxAttempts: integer('OTP_MAX_ATTEMPTS', 5, 1, 10),
    /** Seconds the browser waits before offering "send a new code" again. */
    resendCooldownSeconds: integer(
      'OTP_RESEND_COOLDOWN_SECONDS',
      REGISTRATION_CODE_RESEND_SECONDS,
      10,
      600,
    ),
  },

  csrf: {
    cookieMaxAgeSeconds: integer('CSRF_COOKIE_MAX_AGE_MINUTES', 60 * 12, 60, 60 * 24 * 7),
  },

  rateLimits: {
    registration: { max: 5, windowMs: 60_000 },
    registrationOtp: { max: 10, windowMs: 60_000 },
    donation: { max: 10, windowMs: 60_000 },
    rsvp: { max: 5, windowMs: 60_000 },
    post: { max: 3, windowMs: 60_000 },
    report: { max: 5, windowMs: 60_000 },
    newsletter: { max: 5, windowMs: 60_000 },
    support: { max: 5, windowMs: 60_000 },
    profile: { max: 20, windowMs: 60_000 },
    photo: { max: 6, windowMs: 60_000 },
    admin: { max: 60, windowMs: 60_000 },
    adminRead: { max: 240, windowMs: 60_000 },
    csrf: { max: 60, windowMs: 60_000 },
  } satisfies Record<RateLimitBucket, RateLimitRule>,

  photos: {
    /**
     * Directory for resized profile photos. Relative paths resolve from the process working
     * directory; use an absolute path on a VPS so a deploy cannot replace the directory.
     * The files are never served directly: `/api/v1/alumni/[id]/photo` checks access first.
     */
    directory: text('PHOTO_UPLOAD_DIR', '.uploads/photos'),
    /** Shared with the browser; see `src/lib/constants/photo.ts`. */
    maxBytes: PHOTO_MAX_BYTES,
    minDimension: integer('PHOTO_MIN_DIMENSION', PHOTO_MIN_DIMENSION, 1, 2000),
    maxDimension: integer('PHOTO_MAX_DIMENSION', PHOTO_MAX_DIMENSION, 500, 12_000),
    outputSize: integer('PHOTO_OUTPUT_SIZE', PHOTO_OUTPUT_SIZE, 128, 1600),
    quality: integer('PHOTO_QUALITY', PHOTO_OUTPUT_QUALITY, 40, 100),
    /** Files are written with owner-only-write permissions; group read is enough for nginx. */
    fileMode: 0o640,
    directoryMode: 0o750,
  },

  pagination: {
    /** Shared with the browser helpers; see `src/lib/constants/pagination.ts`. */
    defaultPageSize: DEFAULT_PAGE_SIZE,
    maxPageSize: MAX_PAGE_SIZE,
    adminPageSize: ADMIN_PAGE_SIZE,
    donationPageSize: DONATION_PAGE_SIZE,
    donorPageSize: DONOR_PAGE_SIZE,
    auditLimit: AUDIT_LOG_LIMIT,
    /** Hard cap on rows in one CSV export, so a click cannot stream an unbounded table. */
    exportLimit: integer('EXPORT_MAX_ROWS', 5000, 1, 100_000),
  },

  newsletter: {
    /** Messages per provider request. Resend accepts up to 100. */
    batchSize: integer('NEWSLETTER_BATCH_SIZE', 50, 1, 100),
    /** Hard stop so one browser request cannot try to mail an unbounded list. */
    maxRecipients: integer('NEWSLETTER_MAX_RECIPIENTS', 2000, 1, 10_000),
  },

  bot: {
    /** How long a Turnstile verification may take before the form answers "try again". */
    timeoutMs: integer('BOT_VERIFY_TIMEOUT_MS', 5_000, 1_000, 30_000),
  },

  email: {
    timeoutMs: integer('EMAIL_TIMEOUT_MS', 15_000, 1_000, 60_000),
    apiUrl: 'https://api.resend.com/emails',
    batchApiUrl: 'https://api.resend.com/emails/batch',
  },

  payments: {
    /** Milliseconds before a payment gateway call times out. */
    timeoutMs: integer('PAYMENT_TIMEOUT_MS', 15_000, 1_000, 60_000),
    /** eSewa sandbox form post URL (set to production URL in live mode). */
    esewaSandboxUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    /** Khalti sandbox API base URL (set to production in live mode). */
    khaltiSandboxBaseUrl: 'https://dev.khalti.com/api/v2',
    /** Description shown when a donor gives to a specific goal. */
    goalGiftDescription: 'BPKIHS Alumni Association gift',
    /** Description shown for anonymous or general donations. */
    generalGiftDescription: 'General fund gift',
  },

  support: {
    referencePrefix: text('SUPPORT_REFERENCE_PREFIX', 'BPK'),
    replyWindowDays: integer('SUPPORT_REPLY_WINDOW_DAYS', 2, 1, 30),
  },

  admin: {
    /** Idle time after which the dashboard asks for the password again. */
    reauthAfterSeconds: integer('ADMIN_REAUTH_AFTER_MINUTES', 30, 5, 24 * 60) * 60,
  },
} as const;

export type AppConfig = typeof config;
