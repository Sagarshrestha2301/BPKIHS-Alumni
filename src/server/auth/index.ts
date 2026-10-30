import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin, emailOTP, twoFactor } from 'better-auth/plugins';

import { emailCopy } from '@/content/email';

import { config } from '../config';
import { db } from '../db/client';
import { account, session, twoFactor as twoFactorTable, user, verification } from '../db/schema';
import { sendEmail } from '../email';
import { appUrl, usesHttps } from '../http/app-url';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is missing. Copy .env.example to .env.local and set it.');
}

const origin = appUrl();
const secureCookies = usesHttps();

/**
 * `npm run dev` binds port 3000, but a dev server can still end up elsewhere: a preview tool
 * that assigns a port, or `next dev -p 4000`. Better Auth validates the `Origin` header on
 * every request that carries a session cookie, so a mismatch stays invisible until a signed-in
 * member submits a form : sign-out then fails with "Invalid origin".
 *
 * Development therefore trusts loopback on any port. Production trusts exactly the configured
 * origin; a typo there still fails closed rather than accepting the request.
 */
const isProduction = process.env.NODE_ENV === 'production';
const trustedOrigins = isProduction
  ? [origin]
  : [origin, 'http://localhost:*', 'http://127.0.0.1:*', 'http://[::1]:*'];

/**
 * Accounts exist to give a person an identity:
 * - the donation gate (decision D3), so a receipt can be emailed;
 * - the alumni directory, community posting and reporting, and the helpdesk, which are
 *   members-only;
 * - the admin dashboard, which needs a role;
 * - self-registration, so a member can confirm their address and follow the review.
 *
 * Reading the public site : events, community posts, the about pages and the goals : needs
 * no account.
 *
 * Security decisions (ASVS 2.x and 3.x):
 * - 8-character minimum passwords, and TOTP two-factor available to every account so an
 *   administrator can protect the dashboard with something other than a password;
 * - an absolute session lifetime of one day and a rolling refresh, so a stolen cookie does
 *   not stay valid for a month;
 * - Secure, HttpOnly, SameSite=Lax cookies in production;
 * - provider-level rate limits on sign-in and sign-up, in addition to the route limiter.
 */
export const auth = betterAuth({
  appName: config.appName,
  baseURL: origin,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, twoFactor: twoFactorTable },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: config.passwords.minLength,
    maxPasswordLength: config.passwords.maxLength,
    /**
     * Sign-in stays open to unverified accounts on purpose: a donor who signs up at checkout
     * must be able to finish. Alumni self-registrations are gated where it matters, in the
     * approval step (see `approveAlumnus`), which refuses an unverified profile.
     */
    requireEmailVerification: false,
    autoSignIn: true,
    /** An emailed link, single use, and a successful reset signs every other device out. */
    resetPasswordTokenExpiresIn: config.passwords.resetTokenMinutes * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      const url = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: user.email,
        ...emailCopy.passwordReset({ url, minutes: config.passwords.resetTokenMinutes }),
      });
    },
  },
  emailVerification: {
    /** Verifying by code signs the member in, so the register page can continue to /account. */
    autoSignInAfterVerification: true,
  },
  session: {
    expiresIn: config.session.maxAgeSeconds,
    updateAge: config.session.updateAgeSeconds,
    cookieCache:
      config.session.cookieCacheSeconds > 0
        ? { enabled: true, maxAge: config.session.cookieCacheSeconds }
        : { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: config.auth.globalWindowSeconds,
    max: config.auth.globalMax,
    customRules: {
      // The header asks for this on every page load; the global limit would throttle it
      // under ordinary traffic and leave signed-in visitors with a signed-out header.
      '/get-session': {
        window: config.auth.sessionWindowSeconds,
        max: config.auth.sessionMax,
      },
      '/sign-in/email': {
        window: config.auth.signInWindowSeconds,
        max: config.auth.signInMax,
      },
      '/sign-up/email': {
        window: config.auth.signUpWindowSeconds,
        max: config.auth.signUpMax,
      },
      '/email-otp/send-verification-otp': {
        window: config.auth.otpWindowSeconds,
        max: config.auth.otpMax,
      },
      '/email-otp/verify-email': {
        window: config.auth.otpWindowSeconds,
        max: config.auth.otpMax,
      },
      '/request-password-reset': {
        window: config.auth.signInWindowSeconds,
        max: config.auth.signInMax,
      },
    },
  },
  advanced: {
    useSecureCookies: secureCookies,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      path: '/',
    },
  },
  user: {
    deleteUser: { enabled: false },
  },
  plugins: [
    /**
     * One-time codes confirm an alumni email address. The code itself never reaches the
     * database in the clear (`storeOTP: 'hashed'`), expires quickly, and dies after a few
     * wrong guesses.
     */
    emailOTP({
      otpLength: config.otp.length,
      expiresIn: config.otp.expiresInSeconds,
      allowedAttempts: config.otp.maxAttempts,
      storeOTP: 'hashed',
      sendVerificationOnSignUp: false,
      overrideDefaultEmailVerification: true,
      rateLimit: { window: config.auth.otpWindowSeconds, max: config.auth.otpMax },
      sendVerificationOTP: async ({ email, otp }) => {
        await sendEmail({
          to: email,
          ...emailCopy.registrationCode({
            otp,
            minutes: Math.round(config.otp.expiresInSeconds / 60),
          }),
        });
      },
    }),
    /**
     * TOTP for administrators. The secret never reaches the client after enrolment, backup
     * codes are hashed, and every sign-in asks for a code once the account turns it on.
     */
    twoFactor({
      issuer: config.appName,
      twoFactorTable: 'twoFactor',
    }),
    admin({
      defaultRole: 'donor',
      adminRoles: ['admin'],
    }),
    // Must stay last: it lets server actions set cookies.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
