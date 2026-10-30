import { ApiError } from '@/lib/api/errors';

import { config } from '../config';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || `${config.appName} <no-reply@localhost>`;
}

/**
 * Header values are single-line by definition. A tribute name, a post title or a campaign
 * subject can reach a Subject line, and a `\r\n` in one of them is header injection: an extra
 * `Bcc:` or `Reply-To:` added to our own message. Providers usually reject that, but this is
 * the layer we control, so every header is flattened before it leaves the process.
 */
export function sanitizeHeaderValue(value: string, maxLength = 998): string {
  return value
    .replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Keeps an address out of the logs while leaving enough to diagnose a failure. */
function maskAddress(address: string): string {
  const [local, domain] = address.split('@');
  if (!domain) return '***';
  return `${local?.slice(0, 1) ?? ''}***@${domain}`;
}

function transport(): 'resend' | 'console' {
  const value = process.env.EMAIL_TRANSPORT?.trim().toLowerCase() || 'console';
  if (value !== 'resend' && value !== 'console') {
    throw new ApiError('unavailable', 'Email is not configured correctly.');
  }
  return value;
}

function payloadFor(message: EmailMessage) {
  return {
    from: sanitizeHeaderValue(fromAddress(), 320),
    to: [sanitizeHeaderValue(message.to, 320)],
    subject: sanitizeHeaderValue(message.subject),
    text: message.text,
    ...(message.html ? { html: message.html } : {}),
    ...(message.replyTo ? { reply_to: sanitizeHeaderValue(message.replyTo, 320) } : {}),
  };
}

function logDevelopment(message: EmailMessage): void {
  console.info(
    [
      '',
      '── email (development) ─────────────────────────────',
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      '',
      message.text,
      '────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );
}

/**
 * One send function for every message. Development uses the console, so receipts and
 * confirmations are visible without an email account. Production always uses Resend;
 * the console transport refuses to pretend a message was delivered there.
 *
 * Provider errors are logged server-side and never returned to the caller: a gateway or
 * provider response can contain account details.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const mode = transport();

  if (mode === 'console' && process.env.NODE_ENV === 'production') {
    throw new ApiError('unavailable', 'Email is not configured. Set EMAIL_TRANSPORT=resend.');
  }

  if (mode === 'console') {
    logDevelopment(message);
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new ApiError('unavailable', 'Email is not configured. Set RESEND_API_KEY.');
  }

  const response = await fetch(config.email.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloadFor(message)),
    signal: AbortSignal.timeout(config.email.timeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => 'no detail');
    console.error('[email] provider rejected a message', response.status, detail);
    throw new ApiError('server', 'The email provider rejected the message.');
  }
}

/**
 * Sends several messages in one provider request. Resend accepts up to 100; callers pass
 * chunks sized by `config.newsletter.batchSize`. Development still prints each message.
 */
export async function sendEmailBatch(messages: EmailMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const mode = transport();

  if (mode === 'console') {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError('unavailable', 'Email is not configured. Set EMAIL_TRANSPORT=resend.');
    }
    for (const message of messages) logDevelopment(message);
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new ApiError('unavailable', 'Email is not configured. Set RESEND_API_KEY.');
  }

  const response = await fetch(config.email.batchApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages.map(payloadFor)),
    signal: AbortSignal.timeout(config.email.timeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => 'no detail');
    console.error('[email] provider rejected a batch', response.status, detail);
    throw new ApiError('server', 'The email provider rejected the messages.');
  }
}

/**
 * Email is a notification, not part of the transaction. A rejected message (unverified
 * sending domain, provider outage) is logged and the donation, RSVP or ticket still stands.
 *
 * Returns whether the message left the server. Most callers ignore it; the newsletter
 * confirmation form uses it to say so, because a visitor waiting for a link that was never
 * sent has no way to find out.
 */
export async function sendEmailSafely(message: EmailMessage): Promise<boolean> {
  try {
    await sendEmail(message);
    return true;
  } catch (error) {
    // The address is personal data; mask it in logs that may be shipped off the host.
    console.error('[email] delivery failed', maskAddress(message.to), error);
    return false;
  }
}
