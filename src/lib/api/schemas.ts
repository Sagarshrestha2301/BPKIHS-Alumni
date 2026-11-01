/**
 * Zod schemas for every form. They are the validation spec the backend must also enforce.
 * Input types are inferred from them, so the form, the API client and the contract never drift.
 *
 * Optional text fields accept '' ("not provided") because form inputs submit empty strings.
 */
import { z } from 'zod';

import {
  EMAIL_PATTERN,
  EXPERTISE_ITEM_MAX_LENGTH,
  EXPERTISE_MAX_ITEMS,
  HELPDESK_TOPICS,
  MAX_DONATION_MINOR,
  MAX_EVENT_PARTY_SIZE,
  MEMBER_POST_TYPES,
  MIN_BATCH_YEAR,
  MIN_DONATION_MINOR,
  NEWSLETTER_INTERESTS,
  PASSWORD_MIN_LENGTH,
  PAYMENT_METHODS,
  PHONE_PATTERN,
  PROGRAMMES,
  RECIPIENT_KINDS,
  REPORT_REASONS,
  TRIBUTE_TYPES,
  VISIBILITIES,
} from '@/lib/constants/domain';

/* ---------- building blocks ---------- */

const TOO_LONG = 'That is too long. Please shorten it.';
const EMAIL_MESSAGE = 'Enter a valid email address, for example name@example.com.';
const PHONE_MESSAGE = 'Enter a valid phone number, for example +977 98XXXXXXXX.';

const requiredText = (message: string, max = 120) =>
  z.string().trim().min(1, message).max(max, TOO_LONG);

const optionalText = (max = 120) => z.string().trim().max(max, TOO_LONG).optional();

const emailField = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .regex(EMAIL_PATTERN, EMAIL_MESSAGE);

const optionalEmail = z
  .string()
  .trim()
  .regex(EMAIL_PATTERN, EMAIL_MESSAGE)
  .or(z.literal(''))
  .optional();

const optionalPhone = z
  .string()
  .trim()
  .regex(PHONE_PATTERN, PHONE_MESSAGE)
  .or(z.literal(''))
  .optional();

const consentField = (message: string) => z.boolean().refine((value) => value === true, message);

const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(128, 'That password is too long.');

/* ---------- alumni registration ---------- */

export const privacySchema = z.object({
  email: z.enum(VISIBILITIES),
  phone: z.enum(VISIBILITIES),
  profile: z.enum(VISIBILITIES),
});

/**
 * Expertise tags. Entries are trimmed, collapsed and de-duplicated case-insensitively, and
 * blanks are dropped, so "Public  health" and "public health" cannot both be stored.
 */
export const expertiseSchema = z
  .array(z.string().trim().max(EXPERTISE_ITEM_MAX_LENGTH, TOO_LONG))
  .max(EXPERTISE_MAX_ITEMS, `Choose up to ${EXPERTISE_MAX_ITEMS} areas.`)
  .transform((items) => {
    const seen = new Set<string>();
    const clean: string[] = [];
    for (const item of items) {
      const value = item.replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push(value);
    }
    return clean;
  });

export const registrationSchema = z
  .object({
    fullName: requiredText('Enter your full name.', 100),
    email: emailField,
    phone: optionalPhone,
    programme: z.enum(PROGRAMMES),
    batchYear: z
      .number('Enter your batch year, for example 2012.')
      .int('Enter your batch year, for example 2012.')
      .min(MIN_BATCH_YEAR, `Enter a year from ${MIN_BATCH_YEAR} onwards.`)
      .refine(
        (year) => year <= new Date().getFullYear() + 1,
        'That year is too far in the future.',
      ),
    furtherStudies: optionalText(150),
    currentPosition: optionalText(120),
    organisation: optionalText(120),
    city: optionalText(80),
    country: requiredText('Enter your country.', 80),
    note: optionalText(500),
    privacy: privacySchema,
    consent: consentField('Please agree to the terms to register.'),
    /** The account that will own this profile. Signing in later uses this password. */
    password: passwordField,
    confirmPassword: z.string().min(1, 'Repeat your password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  });
export type RegistrationInput = z.infer<typeof registrationSchema>;

/** The code emailed after registering. */
export const verifyRegistrationSchema = z.object({
  email: emailField,
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, 'Enter the code from the email. Digits only.'),
});
export type VerifyRegistrationInput = z.infer<typeof verifyRegistrationSchema>;

export const resendRegistrationCodeSchema = z.object({ email: emailField });
export type ResendRegistrationCodeInput = z.infer<typeof resendRegistrationCodeSchema>;

/**
 * What a signed-in member may change about their own profile. Programme, batch year, email
 * and the review status are deliberately absent: only the office changes those.
 */
export const profileUpdateSchema = z.object({
  fullName: requiredText('Enter your full name.', 100),
  phone: optionalPhone,
  furtherStudies: optionalText(150),
  currentPosition: optionalText(120),
  organisation: optionalText(120),
  city: optionalText(80),
  country: requiredText('Enter your country.', 80),
  note: optionalText(500),
  expertise: expertiseSchema,
  privacy: privacySchema,
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/* ---------- account security ---------- */

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(128),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Repeat the new password.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Always answered with the same success message, so it cannot reveal registered addresses. */
export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'That reset link is not valid.'),
    password: passwordField,
    confirmPassword: z.string().min(1, 'Repeat the new password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* ---------- donations ---------- */

export const tributeSchema = z.object({
  type: z.enum(TRIBUTE_TYPES),
  recipientKind: z.enum(RECIPIENT_KINDS),
  name: requiredText('Enter the name this gift honours.', 100),
  message: optionalText(500),
  notifyEmail: optionalEmail,
});
export type TributeInput = z.infer<typeof tributeSchema>;

export const donationSchema = z.object({
  /** Undefined means the general fund. */
  goalId: z.string().min(1).optional(),
  amountMinor: z
    .number('Enter an amount.')
    .int('Enter a whole amount.')
    .min(MIN_DONATION_MINOR, `The smallest gift is NPR ${MIN_DONATION_MINOR / 100}.`)
    .max(MAX_DONATION_MINOR, 'For gifts this large, please contact us.'),
  currency: z.literal('NPR'),
  method: z.enum(PAYMENT_METHODS),
  anonymous: z.boolean(),
  tribute: tributeSchema.optional(),
  /** Event-linked donation drive. */
  eventId: z.string().min(1).optional(),
});
export type DonationInput = z.infer<typeof donationSchema>;

/* ---------- events ---------- */

export const rsvpSchema = z.object({
  name: requiredText('Enter your full name.', 100),
  email: emailField,
  phone: optionalPhone,
  /** Everyone attending, including the person registering. */
  partySize: z
    .number('Enter how many people are coming.')
    .int('Enter a whole number.')
    .min(1, 'At least one person must attend.')
    .max(MAX_EVENT_PARTY_SIZE, `You can register up to ${MAX_EVENT_PARTY_SIZE} people at once.`),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;

/* ---------- support ---------- */

export const helpdeskSchema = z.object({
  topic: z.enum(HELPDESK_TOPICS),
  name: requiredText('Enter your name.', 100),
  email: emailField,
  subject: requiredText('Enter a short subject.', 120),
  message: z
    .string()
    .trim()
    .min(10, 'Please give us a little more detail (at least 10 characters).')
    .max(2000, TOO_LONG),
});
export type HelpdeskInput = z.infer<typeof helpdeskSchema>;

/* ---------- newsletter ---------- */

export const newsletterSubscribeSchema = z.object({
  email: emailField,
  interests: z.array(z.enum(NEWSLETTER_INTERESTS)).max(NEWSLETTER_INTERESTS.length),
});
export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

export const newsletterPrefsSchema = z.object({
  email: emailField,
  optIn: z.boolean(),
  /**
   * The subscriber's token, taken from a newsletter email. An address alone is public
   * knowledge, so a preference change needs this proof of ownership; without it the API
   * only emails a confirmation link and changes nothing.
   */
  token: z.string().trim().min(1).max(200).optional(),
});
export type NewsletterPrefsInput = z.infer<typeof newsletterPrefsSchema>;

/* ---------- community ---------- */

export const memberPostSchema = z.object({
  type: z.enum(MEMBER_POST_TYPES),
  title: z.string().trim().min(5, 'Enter a title of at least 5 characters.').max(120, TOO_LONG),
  body: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters.')
    .max(3000, 'Please keep it under 3,000 characters.'),
  /** An optional photo or video still, shown with the post once it is approved. */
  imageUrl: z
    .string()
    .trim()
    .max(500, TOO_LONG)
    .refine(
      (value) =>
        value === '' ||
        (value.startsWith('/') && !value.startsWith('//')) ||
        value.startsWith('https://'),
      'Use an https:// URL or a path beginning with /.',
    )
    .optional(),
  authorName: requiredText('Enter your name.', 100),
  /** Not shown publicly; used by moderators to reach the author. */
  authorEmail: emailField,
});
export type MemberPostInput = z.infer<typeof memberPostSchema>;

export const postReportSchema = z
  .object({
    reason: z.enum(REPORT_REASONS),
    details: optionalText(500),
  })
  .refine((value) => value.reason !== 'other' || (value.details?.length ?? 0) >= 5, {
    message: 'Tell us a little more about the problem.',
    path: ['details'],
  });
export type PostReportInput = z.infer<typeof postReportSchema>;

/* ---------- sign in ---------- */

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password.').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: requiredText('Enter your full name.', 100),
  email: emailField,
  phone: optionalPhone,
  password: passwordField,
});
export type SignupInput = z.infer<typeof signupSchema>;
