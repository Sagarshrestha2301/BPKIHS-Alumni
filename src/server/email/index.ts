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

function transport(): 'resend' | 'console' {
  const value = process.env.EMAIL_TRANSPORT?.trim().toLowerCase() || 'console';
  if (value !== 'resend' && value !== 'console') {
    throw new ApiError('unavailable', 'Email is not configured correctly.');
  }
  return value;
}

function payloadFor(message: EmailMessage) {
  return {
    from: fromAddress(),
    to: [message.to],
    subject: message.subject,
    text: message.text,
    ...(message.html ? { html: message.html } : {}),
    ...(message.replyTo ? { reply_to: message.replyTo } : {}),
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
 */
export async function sendEmailSafely(message: EmailMessage): Promise<void> {
  try {
    await sendEmail(message);
  } catch (error) {
    console.error('[email] delivery failed', message.to, error);
  }
}
