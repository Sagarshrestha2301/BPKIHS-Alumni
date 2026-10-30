import { createPrivateKey, type KeyObject, sign as rsaSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { and, eq } from 'drizzle-orm';

import { ApiError } from '@/lib/api/errors';

import { config } from '../config';
import { donations } from '../db/schema';
import { paymentMode } from './mode';
import type { PaymentGateway, PaymentRedirect, PaymentRequest, PaymentVerification } from './types';

/**
 * ConnectIPS (NCHL).
 *
 * Required environment:
 *   CONNECTIPS_BASE_URL, CONNECTIPS_MERCHANT_ID, CONNECTIPS_APP_ID,
 *   CONNECTIPS_APP_NAME, CONNECTIPS_APP_PASSWORD
 *   plus the signing key as PEM, either CONNECTIPS_PRIVATE_KEY (inline, \n escapes
 *   accepted) or CONNECTIPS_PRIVATE_KEY_PATH (a file). NCHL issues a CREDITOR.pfx;
 *   convert it once with openssl (see HANDOVER.md section 2) : Node cannot read PKCS#12.
 *
 * The browser is sent to `{base_url}/connectipswebgw/loginpage` with a form whose TOKEN is an
 * RSA-SHA256 signature over the documented field string. connectIPS returns the donor with only
 * `?TXNID=` appended to a registered success or failure URL, which proves nothing: every return
 * calls `/connectipswebws/api/creditor/validatetxn` with Basic auth and a separately signed
 * token, and only that answer decides whether the donation is paid.
 *
 * `TXNID` is at most 20 characters, so the 36-character donation id is not sent. The donation
 * stores a short `gatewayOrderRef`; the adapter resolves it on return. That lookup also supplies
 * the amount the validation token must cover.
 */

const TXN_ID_PATTERN = /^[A-Za-z0-9-]{1,20}$/;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ApiError('unavailable', `ConnectIPS is not configured: ${name} is missing.`);
  }
  return value;
}

function signingPem(): string {
  const inline = process.env.CONNECTIPS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (inline) return inline;

  const path = process.env.CONNECTIPS_PRIVATE_KEY_PATH?.trim();
  if (!path) {
    throw new ApiError(
      'unavailable',
      'ConnectIPS signing key is missing: set CONNECTIPS_PRIVATE_KEY or CONNECTIPS_PRIVATE_KEY_PATH.',
    );
  }
  try {
    return readFileSync(path, 'utf8');
  } catch {
    throw new ApiError(
      'unavailable',
      'The ConnectIPS signing key file could not be read. Check CONNECTIPS_PRIVATE_KEY_PATH.',
    );
  }
}

function signingKey(): KeyObject {
  try {
    return createPrivateKey(signingPem());
  } catch {
    throw new ApiError(
      'unavailable',
      'The ConnectIPS signing key is not a valid PEM private key. Convert CREDITOR.pfx as described in HANDOVER.md section 2.',
    );
  }
}

function hasSigningKey(): boolean {
  return Boolean(
    process.env.CONNECTIPS_PRIVATE_KEY?.trim() || process.env.CONNECTIPS_PRIVATE_KEY_PATH?.trim(),
  );
}

function baseUrl(): string {
  const value = required('CONNECTIPS_BASE_URL').replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ApiError('unavailable', 'CONNECTIPS_BASE_URL must be an absolute URL.');
  }
  if (paymentMode() === 'live' && parsed.protocol !== 'https:') {
    throw new ApiError('unavailable', 'CONNECTIPS_BASE_URL must use https in live mode.');
  }
  return value;
}

function token(message: string): string {
  return rsaSign('RSA-SHA256', Buffer.from(message, 'utf8'), signingKey()).toString('base64');
}

/** `DD-MM-YYYY`, the only date format connectIPS accepts, in the Association's time zone. */
function transactionDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('day')}-${value('month')}-${value('year')}`;
}

function clamp(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export interface ConnectipsReference {
  /** Short reference stored on the donation and sent as both TXNID and REFERENCEID. */
  reference: string;
  amountMinor: number;
  description: string;
  /** Injectable for tests; the initiation date is the only time-dependent field. */
  now?: Date;
}

/**
 * Builds the signed login-page form. Exported separately from the gateway so the token can be
 * verified with the matching public key in a unit test, without a database or a network call.
 */
export function buildConnectipsForm(request: ConnectipsReference): PaymentRedirect {
  if (!TXN_ID_PATTERN.test(request.reference)) {
    throw new ApiError(
      'validation',
      'The ConnectIPS transaction reference must be 1–20 letters, digits or hyphens.',
    );
  }

  const merchantId = required('CONNECTIPS_MERCHANT_ID');
  const appId = required('CONNECTIPS_APP_ID');
  const appName = required('CONNECTIPS_APP_NAME');
  const txndate = transactionDate(request.now ?? new Date());
  const remarks = clamp(request.description, 50);
  const particulars = clamp(request.description, 100);
  const amount = String(request.amountMinor);

  const message = [
    `MERCHANTID=${merchantId}`,
    `APPID=${appId}`,
    `APPNAME=${appName}`,
    `TXNID=${request.reference}`,
    `TXNDATE=${txndate}`,
    `TXNCRNCY=NPR`,
    `TXNAMT=${amount}`,
    `REFERENCEID=${request.reference}`,
    `REMARKS=${remarks}`,
    `PARTICULARS=${particulars}`,
    'TOKEN=TOKEN',
  ].join(',');

  return {
    url: `${baseUrl()}/connectipswebgw/loginpage`,
    method: 'POST',
    fields: {
      MERCHANTID: merchantId,
      APPID: appId,
      APPNAME: appName,
      TXNID: request.reference,
      TXNDATE: txndate,
      TXNCRNCY: 'NPR',
      TXNAMT: amount,
      REFERENCEID: request.reference,
      REMARKS: remarks,
      PARTICULARS: particulars,
      TOKEN: token(message),
    },
  };
}

export interface ConnectipsValidationReply {
  /** HTTP status of the validation answer; 401/403 means the credentials or token were refused. */
  httpStatus: number;
  /** Parsed JSON body, when connectIPS returned one. */
  payload: Record<string, unknown> | null;
  /** First characters of a non-JSON body, for diagnostics. Never contains our token. */
  bodySnippet: string;
}

/**
 * Sends the signed validation request and returns the answer as it arrived. Shared with the
 * acceptance script, which needs to distinguish "gateway refused our credentials" (HTTP 401)
 * from "the gateway answered, and this transaction is not paid" (HTTP 200 with a status).
 */
export async function callConnectipsValidation(
  txnId: string,
  amountMinor: number,
): Promise<ConnectipsValidationReply> {
  if (!TXN_ID_PATTERN.test(txnId)) {
    throw new ApiError('validation', 'ConnectIPS returned an invalid transaction id.');
  }

  const merchantId = required('CONNECTIPS_MERCHANT_ID');
  const appId = required('CONNECTIPS_APP_ID');
  const appPassword = required('CONNECTIPS_APP_PASSWORD');

  const message = [
    `MERCHANTID=${merchantId}`,
    `APPID=${appId}`,
    `REFERENCEID=${txnId}`,
    `TXNAMT=${amountMinor}`,
  ].join(',');

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/connectipswebws/api/creditor/validatetxn`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${appId}:${appPassword}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: Number(merchantId),
        appId,
        referenceId: txnId,
        txnAmt: amountMinor,
        token: token(message),
      }),
      signal: AbortSignal.timeout(config.payments.timeoutMs),
    });
  } catch {
    throw new ApiError(
      'unavailable',
      'ConnectIPS did not answer the validation request. Try again in a moment.',
    );
  }

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    // A non-JSON answer is reported through bodySnippet.
  }

  return {
    httpStatus: response.status,
    payload,
    bodySnippet: payload ? '' : text.replace(/\s+/g, ' ').trim().slice(0, 300),
  };
}

/**
 * Calls the validation endpoint. This is the only trusted statement that a transaction was
 * paid: the amount comes from our own pending donation, never from the return URL.
 */
export async function validateConnectipsTransaction(
  txnId: string,
  amountMinor: number,
): Promise<Omit<PaymentVerification, 'donationId'>> {
  const reply = await callConnectipsValidation(txnId, amountMinor);

  if (reply.httpStatus < 200 || reply.httpStatus >= 300) {
    throw new ApiError(
      'server',
      `ConnectIPS rejected the validation request (HTTP ${reply.httpStatus}). Check the merchant credentials.`,
    );
  }

  const { payload } = reply;
  if (!payload) {
    throw new ApiError('server', 'ConnectIPS returned an empty validation response.');
  }

  const appId = required('CONNECTIPS_APP_ID');
  const merchantId = required('CONNECTIPS_MERCHANT_ID');

  // The answer is authenticated, but it must still describe our merchant and application.
  if (payload.appId !== undefined && String(payload.appId) !== appId) {
    throw new ApiError(
      'validation',
      'The ConnectIPS validation answer is for another application.',
    );
  }
  if (payload.merchantId !== undefined && String(payload.merchantId) !== merchantId) {
    throw new ApiError('validation', 'The ConnectIPS validation answer is for another merchant.');
  }

  const paid = Number(payload.txnAmt);
  return {
    reference: String(payload.referenceId ?? txnId),
    status: payload.status === 'SUCCESS' ? 'succeeded' : 'failed',
    ...(Number.isFinite(paid) ? { amountMinor: Math.round(paid) } : {}),
    payload,
  };
}

export const connectipsGateway: PaymentGateway = {
  id: 'connectips',

  missingEnvironment() {
    const missing: string[] = [];
    for (const name of [
      'CONNECTIPS_BASE_URL',
      'CONNECTIPS_MERCHANT_ID',
      'CONNECTIPS_APP_ID',
      'CONNECTIPS_APP_NAME',
      'CONNECTIPS_APP_PASSWORD',
    ] as const) {
      if (!process.env[name]?.trim()) missing.push(name);
    }
    if (!hasSigningKey()) missing.push('CONNECTIPS_PRIVATE_KEY or CONNECTIPS_PRIVATE_KEY_PATH');
    return missing;
  },

  isConfigured() {
    return this.missingEnvironment().length === 0;
  },

  async start(request: PaymentRequest): Promise<PaymentRedirect> {
    if (!this.isConfigured()) {
      throw new ApiError('unavailable', 'ConnectIPS is not configured.');
    }
    if (!request.reference) {
      throw new ApiError('server', 'ConnectIPS needs a short transaction reference.');
    }
    return buildConnectipsForm({
      reference: request.reference,
      amountMinor: request.amountMinor,
      description: request.description,
    });
  },

  async verify(query: URLSearchParams): Promise<PaymentVerification> {
    if (!this.isConfigured()) {
      throw new ApiError('unavailable', 'ConnectIPS is not configured.');
    }

    const txnId = query.get('TXNID')?.trim() ?? '';
    if (!TXN_ID_PATTERN.test(txnId)) {
      throw new ApiError('validation', 'ConnectIPS did not return a valid transaction id.');
    }

    // Loaded lazily so the signing and validation helpers stay importable without a database
    // connection, which is what the unit tests exercise.
    const { db } = await import('../db/client');
    const [donation] = await db
      .select({ id: donations.id, amountMinor: donations.amountMinor })
      .from(donations)
      .where(and(eq(donations.gateway, 'connectips'), eq(donations.gatewayOrderRef, txnId)));
    if (!donation) {
      throw new ApiError('not_found', 'That ConnectIPS transaction was not found.');
    }

    const verification = await validateConnectipsTransaction(txnId, Number(donation.amountMinor));
    return { donationId: donation.id, ...verification };
  },
};
