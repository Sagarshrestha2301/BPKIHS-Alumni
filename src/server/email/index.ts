/**
 * Centralized email service. The Brevo implementation lives in `@/lib/email`; this module
 * re-exports it so every existing caller (`src/server/auth`, `src/server/services/*`,
 * `src/server/payments/*`, admin routes) keeps working without changes.
 *
 * Transport is controlled by `EMAIL_TRANSPORT`:
 * - `console` (development default): prints every message to the terminal.
 * - `brevo` (production): sends through the Brevo transactional API using `BREVO_API_KEY`.
 *
 * Provider errors are logged server-side and never returned to the caller. A Brevo 2xx means
 * the message was accepted for delivery, not that it reached the inbox.
 */
export type { EmailMessage, EmailSendResult } from '@/lib/email';
export { sendEmail, sendEmailBatch, sendEmailSafely } from '@/lib/email';
export { sanitizeHeaderValue } from '@/lib/email-sanitize';
