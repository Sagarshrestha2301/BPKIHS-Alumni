import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin, emailOTP } from 'better-auth/plugins';

import { emailCopy } from '@/content/email';

import { config } from '../config';
import { db } from '../db/client';
import { account, session, user, verification } from '../db/schema';
import { sendEmail } from '../email';
import { appUrl, usesHttps } from '../http/app-url';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is missing. Copy .env.example to .env.local and set it.');
}

const origin = appUrl();
const secureCookies = usesHttps();

/**
 * Accounts exist for three reasons:
 * - the donation gate (decision D3), so a receipt can be emailed;
 * - the admin dashboard, which needs a role;
 * - self-registration, so a member can confirm their address and follow the review.
 *
 * Browsing the public site never needs an account: the directory, events and community pages
 * stay anonymous.
 *
 * Security decisions (ASVS 2.x and 3.x):
 * - 12-character minimum passwords, longer than the old 8, because there is no MFA yet;
 * - an absolute session lifetime of one day and a rolling refresh, so a stolen cookie does
 *   not stay valid for a month;
 * - Secure, HttpOnly, SameSite=Lax cookies in production;
 * - provider-level rate limits on sign-in and sign-up, in addition to the route limiter.
 */
export const auth = betterAuth({
  appName: config.appName,
  baseURL: origin,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [origin],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
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
    admin({
      defaultRole: 'donor',
      adminRoles: ['admin'],
    }),
    // Must stay last: it lets server actions set cookies.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
