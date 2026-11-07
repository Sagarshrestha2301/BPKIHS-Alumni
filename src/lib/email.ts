import 'server-only';

import { Brevo, BrevoClient } from '@getbrevo/brevo';

import { ApiError } from '@/lib/api/errors';
import { config } from '@/server/config';

import { sanitizeHeaderValue } from './email-sanitize';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  accepted: string[];
  rejected: string[];
  messageId?: string | null;
}

/** Keeps an address out of the logs while leaving enough to diagnose a failure. */
function maskAddress(address: string): string {
  const [local, domain] = address.split('@');
  if (!domain) return '***';
  return `${local?.slice(0, 1) ?? ''}***@${domain}`;
}

function transport(): 'brevo' | 'console' {
  const value = process.env.EMAIL_TRANSPORT?.trim().toLowerCase() || 'console';
  if (value !== 'brevo' && value !== 'console') {
    throw new ApiError('unavailable', 'Email is not configured correctly.');
  }
  return value;
}

function fromAddress(): { email: string; name: string } {
  const email = process.env.BREVO_SENDER_EMAIL?.trim();
  const name = (process.env.BREVO_SENDER_NAME?.trim() || config.appName).trim();
  if (!email) {
    throw new ApiError('unavailable', 'Email sender is not configured. Set BREVO_SENDER_EMAIL.');
  }
  return { email: sanitizeHeaderValue(email, 320), name: sanitizeHeaderValue(name, 998) };
}

let brevoClient: BrevoClient | null = null;

function getBrevoClient(): BrevoClient {
  if (!brevoClient) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new ApiError('unavailable', 'Email is not configured. Set BREVO_API_KEY.');
    }
    brevoClient = new BrevoClient({
      auth: {
        apiKey,
      },
      timeoutInSeconds: config.email.timeoutMs / 1000,
      maxRetries: 2,
    });
  }
  return brevoClient;
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

function toSmtpRequest(message: EmailMessage): Brevo.SendTransacEmailRequest {
  const { email: senderEmail, name: senderName } = fromAddress();
  return {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: sanitizeHeaderValue(message.to, 320), name: '' }],
    subject: sanitizeHeaderValue(message.subject),
    textContent: message.text,
    ...(message.html ? { htmlContent: message.html } : {}),
    ...(message.replyTo
      ? { replyTo: { email: sanitizeHeaderValue(message.replyTo, 320), name: '' } }
      : {}),
  };
}

/**
 * One send function for every message. Development uses the console, so receipts and
 * confirmations are visible without an email account. Production uses Brevo; the console
 * transport refuses to pretend a message was delivered there.
 *
 * Provider errors are logged server-side and never returned to the caller: a gateway or
 * provider response can contain account details. A Brevo 2xx means the message was accepted
 * for delivery, not that it reached the inbox — callers must not treat acceptance as
 * delivery confirmation.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const mode = transport();

  if (mode === 'console' && process.env.NODE_ENV === 'production') {
    throw new ApiError('unavailable', 'Email is not configured. Set EMAIL_TRANSPORT=brevo.');
  }

  if (mode === 'console') {
    logDevelopment(message);
    return;
  }

  try {
    const response = await getBrevoClient().transactionalEmails.sendTransacEmail(
      toSmtpRequest(message),
    );
    const body = (response as unknown as { body?: SendTransacEmailResponse })?.body;
    const messageId = body?.messageId ?? body?.messageIds?.[0] ?? null;
    console.info('[email] message accepted by Brevo', {
      to: maskAddress(message.to),
      messageId,
    });
  } catch (error) {
    const status =
      (error as { statusCode?: number; status?: number })?.statusCode ??
      (error as { status?: number })?.status;
    const providerMessage = error instanceof Error ? error.message : String(error);
    console.error('[email] provider rejected a message', {
      to: maskAddress(message.to),
      status,
      message: providerMessage,
    });
    throw new ApiError('server', 'The email provider rejected the message.');
  }
}

/**
 * Sends several messages, one provider request per recipient. Brevo's transactional endpoint
 * takes one `to` per call, so each recipient is tracked individually: a failure on one
 * address does not silently discard the rest. Development still prints each message.
 */
export async function sendEmailBatch(messages: EmailMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const mode = transport();

  if (mode === 'console') {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError('unavailable', 'Email is not configured. Set EMAIL_TRANSPORT=brevo.');
    }
    for (const message of messages) logDevelopment(message);
    return;
  }

  const failures: string[] = [];
  for (const message of messages) {
    try {
      const response = await getBrevoClient().transactionalEmails.sendTransacEmail(
        toSmtpRequest(message),
      );
      const body = (response as unknown as { body?: SendTransacEmailResponse })?.body;
      const messageId = body?.messageId ?? body?.messageIds?.[0] ?? null;
      console.info('[email] batch message accepted by Brevo', {
        to: maskAddress(message.to),
        messageId,
      });
    } catch (error) {
      failures.push(message.to);
      const status =
        (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      console.error('[email] batch message rejected by Brevo', {
        to: maskAddress(message.to),
        status,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failures.length > 0) {
    throw new ApiError('server', 'The email provider rejected some messages.');
  }
}

/**
 * Email is a notification, not part of the transaction. A rejected message (unverified
 * sending domain, provider outage, quota exhausted) is logged and the donation, RSVP or
 * ticket still stands. Returns whether Brevo accepted the message for delivery.
 *
 * OTP and verification emails use `sendEmail` directly so a provider failure is surfaced
 * rather than silently discarded — the caller must not pretend a code was sent when it was not.
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

interface SendTransacEmailResponse {
  messageId?: string | undefined;
  messageIds?: string[] | undefined;
}
