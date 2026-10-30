/**
 * Checks the ConnectIPS (NCHL) integration against UAT before a person makes a sandbox donation.
 *
 * It signs a real login-page form locally, posts it to connectIPS, then calls the validation
 * endpoint with the same `TXNID`. A pass means NCHL accepted our merchant credentials, our
 * RSA-SHA256 token and the documented field set. It cannot prove the whole donation: the OTP,
 * the browser return, the callback and the receipt still need one human sandbox payment.
 *
 * Usage:
 *   npm run connectips:accept                 # sign, post initiation, validate (UAT)
 *   npm run connectips:accept -- --dry-run    # sign only, no network request
 *   npm run connectips:accept -- --skip-initiation -- --txn <TXNID> --amount 10000
 *   npm run connectips:accept -- --allow-live # post to the production host (real transaction)
 *
 * Exit codes: 0 all checks passed (warnings allowed), 1 a check failed, 2 not configured or
 * blocked before any network call.
 *
 * The script never writes to the database and never completes a donation. It prints no secret
 * values: only the generated TXNID, the amount, the gateway host and response statuses.
 */
import '../src/server/db/load-env';

import { randomBytes } from 'node:crypto';

const MIN_AMOUNT = 10_000;
const TIMEOUT_MS = 20_000;

type Status = 'pass' | 'warn' | 'fail';

interface Check {
  name: string;
  status: Status;
  detail: string;
}

const checks: Check[] = [];

function record(name: string, status: Status, detail: string): void {
  checks.push({ name, status, detail });
  const label = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL';
  console.log(`[${label}] ${name}: ${detail}`);
}

type AcceptanceStatus = 'passed' | 'failed' | 'blocked';

/**
 * Saves the outcome for Admin → Payments. A database problem must never change the acceptance
 * result itself, so a failure here is a warning only.
 */
async function persist(status: AcceptanceStatus, detail: string): Promise<void> {
  try {
    const { recordGatewayCheck } = await import('../src/server/services/gateway-checks');
    await recordGatewayCheck({
      gateway: 'connectips',
      status,
      mode: process.env.PAYMENT_MODE?.trim().toLowerCase() || 'unset',
      detail,
    });
  } catch (error) {
    console.warn(
      `[WARN] record result: could not save this run for the admin dashboard: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function summaryDetail(): string {
  return checks
    .map(
      (check) =>
        `${check.name}: ${check.status}${check.status === 'fail' ? ` : ${check.detail}` : ''}`,
    )
    .join('; ');
}

async function blocked(message: string): Promise<never> {
  await persist('blocked', message);
  console.error(`[BLOCKED] ${message}`);
  process.exit(2);
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function newReference(): string {
  // TXNID is capped at 20 characters; this is 6 + up to 9 + 4 = 19.
  return `ACCEPT-${Date.now().toString(36).toUpperCase()}${randomBytes(2)
    .toString('hex')
    .toUpperCase()}`.slice(0, 20);
}

function gatewayHost(base: string): string {
  try {
    return new URL(base).host;
  } catch {
    return '(unparseable CONNECTIPS_BASE_URL)';
  }
}

function missingConfiguration(): string[] {
  const names = [
    'CONNECTIPS_BASE_URL',
    'CONNECTIPS_MERCHANT_ID',
    'CONNECTIPS_APP_ID',
    'CONNECTIPS_APP_NAME',
    'CONNECTIPS_APP_PASSWORD',
  ];
  const missing = names.filter((name) => !process.env[name]?.trim());
  if (
    !process.env.CONNECTIPS_PRIVATE_KEY?.trim() &&
    !process.env.CONNECTIPS_PRIVATE_KEY_PATH?.trim()
  ) {
    missing.push('CONNECTIPS_PRIVATE_KEY or CONNECTIPS_PRIVATE_KEY_PATH');
  }
  return missing;
}

function snippet(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 300);
}

async function main(): Promise<void> {
  const dryRun = flag('dry-run');
  const allowLive = flag('allow-live');
  const skipInitiation = flag('skip-initiation');

  const missing = missingConfiguration();
  if (missing.length > 0) {
    return blocked(`ConnectIPS is not configured. Missing: ${missing.join(', ')}.`);
  }

  const { paymentMode } = await import('../src/server/payments/mode');
  const { buildConnectipsForm, callConnectipsValidation } =
    await import('../src/server/payments/connectips');

  let mode: string;
  try {
    mode = paymentMode();
  } catch {
    return blocked('PAYMENT_MODE must be "sandbox" or "live" before payments can be checked.');
  }

  const baseUrl = process.env.CONNECTIPS_BASE_URL as string;
  const amountMinor = Number(option('amount') ?? MIN_AMOUNT);
  if (!Number.isInteger(amountMinor) || amountMinor < MIN_AMOUNT) {
    return blocked(
      `--amount must be an integer of at least ${MIN_AMOUNT} paisa (NPR ${MIN_AMOUNT / 100}).`,
    );
  }

  const reference = (option('txn') ?? newReference()).trim();
  console.log('ConnectIPS acceptance check');
  console.log(`  mode:   ${mode}`);
  console.log(`  host:   ${gatewayHost(baseUrl)}`);
  console.log(`  txn:    ${reference}`);
  console.log(`  amount: ${amountMinor} paisa`);
  console.log('');

  // Phase 1: sign locally. This proves the key parses and every documented field is present.
  let form: Awaited<ReturnType<typeof buildConnectipsForm>>;
  try {
    form = buildConnectipsForm({
      reference,
      amountMinor,
      description: 'BPKIHS alumni ConnectIPS acceptance check',
    });
  } catch (error) {
    record('sign initiation form', 'fail', error instanceof Error ? error.message : String(error));
    await finish();
    return;
  }

  const fields = form.fields ?? {};
  record(
    'sign initiation form',
    'pass',
    `${form.method} ${form.url} with ${Object.keys(fields).length} fields, ` +
      `TXNDATE ${fields.TXNDATE ?? '(missing)'}, TXNAMT ${fields.TXNAMT ?? '(missing)'}`,
  );

  if (dryRun) {
    record('send requests', 'warn', '--dry-run: nothing was sent to NCHL.');
    await finish('blocked');
    return;
  }

  if (mode === 'live' && !allowLive) {
    record(
      'live guard',
      'fail',
      'PAYMENT_MODE=live: refusing to post a transaction to the production host without --allow-live.',
    );
    await finish();
    return;
  }

  // Phase 2: post the signed form. connectIPS answers with its login page or a redirect;
  // completing the OTP is a browser step and is not attempted here.
  if (skipInitiation) {
    record('post initiation form', 'warn', '--skip-initiation: not sent.');
  } else {
    try {
      const response = await fetch(form.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields as Record<string, string>).toString(),
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location') ?? '';
        let target = '(no Location header)';
        try {
          const url = new URL(location, baseUrl);
          target = `${url.origin}${url.pathname}`;
        } catch {
          // Keep the placeholder.
        }
        record(
          'post initiation form',
          'pass',
          `HTTP ${response.status} redirect to ${target}; the signed token was accepted.`,
        );
      } else if (response.ok) {
        const text = await response.text();
        record(
          'post initiation form',
          'warn',
          `HTTP ${response.status} with the connectIPS page; token acceptance cannot be confirmed ` +
            `from this response. Complete one payment in a browser. ${snippet(text).slice(0, 160)}`,
        );
      } else {
        const text = await response.text();
        record('post initiation form', 'fail', `HTTP ${response.status}: ${snippet(text)}`);
      }
    } catch (error) {
      record(
        'post initiation form',
        'fail',
        `No answer from the gateway: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Phase 3: validation. HTTP 200 proves Basic auth and the signed token were accepted; the
  // transaction itself should not be SUCCESS because no OTP has been entered.
  try {
    const reply = await callConnectipsValidation(reference, amountMinor);

    if (reply.httpStatus === 401 || reply.httpStatus === 403) {
      record(
        'validate transaction',
        'fail',
        `HTTP ${reply.httpStatus}: the gateway refused the app id, password or token.`,
      );
    } else if (reply.httpStatus >= 200 && reply.httpStatus < 300) {
      if (!reply.payload) {
        record('validate transaction', 'fail', `HTTP ${reply.httpStatus}: ${reply.bodySnippet}`);
      } else {
        const echoedApp = reply.payload.appId;
        const echoedMerchant = reply.payload.merchantId;
        const appMatches =
          echoedApp === undefined || String(echoedApp) === process.env.CONNECTIPS_APP_ID;
        const merchantMatches =
          echoedMerchant === undefined ||
          String(echoedMerchant) === process.env.CONNECTIPS_MERCHANT_ID;

        if (!appMatches || !merchantMatches) {
          record(
            'validate transaction',
            'fail',
            'The answer named another app or merchant; check the configured ids.',
          );
        } else {
          const status = String(reply.payload.status ?? '(no status)');
          const description = String(reply.payload.statusDesc ?? '');
          record(
            'validate transaction',
            'pass',
            `HTTP ${reply.httpStatus}, status ${status}${description ? `: ${description}` : ''}.`,
          );
          if (status === 'SUCCESS') {
            record(
              'validate transaction',
              'warn',
              'This reference already reports SUCCESS, which is unexpected for a fresh check.',
            );
          }
        }
      }
    } else {
      record(
        'validate transaction',
        'fail',
        `HTTP ${reply.httpStatus}: ${reply.bodySnippet || 'no body'}`,
      );
    }
  } catch (error) {
    record('validate transaction', 'fail', error instanceof Error ? error.message : String(error));
  }

  await finish();
}

async function finish(forcedStatus?: AcceptanceStatus): Promise<void> {
  const failures = checks.filter((check) => check.status === 'fail');
  const warnings = checks.filter((check) => check.status === 'warn');
  await persist(forcedStatus ?? (failures.length > 0 ? 'failed' : 'passed'), summaryDetail());
  console.log('');
  if (failures.length > 0) {
    console.log(
      `Result: failed: ${failures.length} of ${checks.length} checks did not pass. Fix these before a sandbox donation.`,
    );
    process.exitCode = 1;
    return;
  }
  if (warnings.length > 0) {
    console.log(
      `Result: passed with ${warnings.length} warning(s). The script cannot complete a payment; ` +
        'make one sandbox donation in a browser to finish acceptance.',
    );
    return;
  }
  console.log(
    'Result: passed. Merchant credentials, signing token and validation call were accepted. ' +
      'Next: complete one sandbox donation in a browser and confirm the receipt and goal total.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
