/**
 * Production configuration checks.
 *
 * The site must never fall back to demo behaviour, a simulator or a localhost origin
 * because a variable was forgotten. `assertRuntimeEnv()` runs once when the server starts
 * (see `src/instrumentation.ts`); `npm run check:env` runs the same checks before a deploy.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isLocalhost(value: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function productionEnvProblems(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const problems: string[] = [];
  const value = (name: string) => env[name]?.trim();

  if (!value('DATABASE_URL')) {
    problems.push('DATABASE_URL is required.');
  } else if (!/^postgres(ql)?:\/\//.test(value('DATABASE_URL') as string)) {
    problems.push('DATABASE_URL must be a postgres:// or postgresql:// connection string.');
  }

  const secret = value('BETTER_AUTH_SECRET');
  if (!secret || secret.length < 32) {
    problems.push('BETTER_AUTH_SECRET must be at least 32 characters.');
  } else if (/^(replace-me|change-me|your-secret|example)/i.test(secret)) {
    problems.push('BETTER_AUTH_SECRET still looks like the example value; generate a random one.');
  }

  const appUrl = value('APP_URL');
  if (!appUrl) {
    problems.push('APP_URL is required (the public origin, e.g. https://alumni.example.org).');
  } else {
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol !== 'https:' && !LOCAL_HOSTS.has(parsed.hostname)) {
        problems.push('APP_URL must use https outside localhost.');
      }
      if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
        problems.push('APP_URL must be an origin only, with no path, query or hash.');
      }
    } catch {
      problems.push('APP_URL must be a valid absolute URL.');
    }
  }

  const siteUrl = value('NEXT_PUBLIC_SITE_URL');
  if (!siteUrl) {
    problems.push('NEXT_PUBLIC_SITE_URL is required at build time (canonical links and metadata).');
  } else if (!isHttpUrl(siteUrl)) {
    problems.push('NEXT_PUBLIC_SITE_URL must be a valid absolute URL.');
  } else if (appUrl && isHttpUrl(appUrl) && !isLocalhost(appUrl)) {
    try {
      if (new URL(siteUrl).origin !== new URL(appUrl).origin) {
        problems.push('NEXT_PUBLIC_SITE_URL must use the same origin as APP_URL.');
      }
    } catch {
      problems.push('NEXT_PUBLIC_SITE_URL must be a valid absolute URL.');
    }
  }

  const paymentMode = value('PAYMENT_MODE');
  if (paymentMode !== 'sandbox' && paymentMode !== 'live') {
    problems.push('PAYMENT_MODE must be "sandbox" or "live". There is no simulator.');
  }
  if (paymentMode === 'sandbox') {
    console.warn('[env] PAYMENT_MODE=sandbox: payments will not take real money.');
  }

  const esewa = Boolean(value('ESEWA_PRODUCT_CODE') && value('ESEWA_SECRET_KEY'));
  const khalti = Boolean(value('KHALTI_SECRET_KEY'));

  // ConnectIPS is optional, but half a configuration must never look like a working gateway.
  const connectipsBase = value('CONNECTIPS_BASE_URL');
  const connectipsMerchant = value('CONNECTIPS_MERCHANT_ID');
  const connectipsAppId = value('CONNECTIPS_APP_ID');
  const connectipsAppName = value('CONNECTIPS_APP_NAME');
  const connectipsPassword = value('CONNECTIPS_APP_PASSWORD');
  const connectipsPem = value('CONNECTIPS_PRIVATE_KEY');
  const connectipsPemPath = value('CONNECTIPS_PRIVATE_KEY_PATH');
  const connectipsAny = Boolean(
    connectipsBase ||
    connectipsMerchant ||
    connectipsAppId ||
    connectipsAppName ||
    connectipsPassword ||
    connectipsPem ||
    connectipsPemPath,
  );
  const connectipsSigning = Boolean(connectipsPem || connectipsPemPath);
  const connectips = Boolean(
    connectipsBase &&
    connectipsMerchant &&
    connectipsAppId &&
    connectipsAppName &&
    connectipsPassword &&
    connectipsSigning,
  );
  if (connectipsAny && !connectips) {
    problems.push(
      'ConnectIPS is partly configured: set CONNECTIPS_BASE_URL, CONNECTIPS_MERCHANT_ID, CONNECTIPS_APP_ID, CONNECTIPS_APP_NAME, CONNECTIPS_APP_PASSWORD and the PEM signing key (CONNECTIPS_PRIVATE_KEY or CONNECTIPS_PRIVATE_KEY_PATH).',
    );
  }
  if (connectips) {
    if (!/^https:\/\//.test(connectipsBase as string) && !isLocalhost(connectipsBase as string)) {
      problems.push('CONNECTIPS_BASE_URL must be an HTTPS URL outside localhost.');
    }
    if (!/^[0-9]{1,15}$/.test(connectipsMerchant as string)) {
      problems.push('CONNECTIPS_MERCHANT_ID must be a numeric id of at most 15 digits.');
    }
    if ((connectipsAppId as string).length > 15) {
      problems.push('CONNECTIPS_APP_ID must be at most 15 characters.');
    }
    if ((connectipsAppName as string).length > 30) {
      problems.push('CONNECTIPS_APP_NAME must be at most 30 characters.');
    }
  }

  if (!esewa && !khalti && !connectips) {
    problems.push('Configure at least one payment gateway: eSewa, Khalti or ConnectIPS.');
  }

  const esewaUrl = value('ESEWA_GATEWAY_URL');
  if (esewa && paymentMode === 'live' && !esewaUrl) {
    problems.push('ESEWA_GATEWAY_URL is required for live eSewa payments.');
  }
  if (
    esewaUrl &&
    (!isHttpUrl(esewaUrl) || (!esewaUrl.startsWith('https://') && !isLocalhost(esewaUrl)))
  ) {
    problems.push('ESEWA_GATEWAY_URL must be an HTTPS URL outside localhost.');
  }

  const khaltiUrl = value('KHALTI_BASE_URL');
  if (khalti && paymentMode === 'live' && !khaltiUrl) {
    problems.push('KHALTI_BASE_URL is required for live Khalti payments.');
  }
  if (
    khaltiUrl &&
    (!isHttpUrl(khaltiUrl) || (!khaltiUrl.startsWith('https://') && !isLocalhost(khaltiUrl)))
  ) {
    problems.push('KHALTI_BASE_URL must be an HTTPS URL outside localhost.');
  }

  // Public forms are scriptable without this, so production refuses to start without it.
  if (!value('TURNSTILE_SECRET_KEY')) {
    problems.push('TURNSTILE_SECRET_KEY is required to protect the public forms from bots.');
  }
  if (!value('NEXT_PUBLIC_TURNSTILE_SITE_KEY')) {
    problems.push(
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY is required at build time (the Turnstile widget cannot render without it).',
    );
  }

  if (value('EMAIL_TRANSPORT') !== 'resend') {
    problems.push('EMAIL_TRANSPORT must be "resend" in production.');
  }
  if (!value('RESEND_API_KEY')) {
    problems.push('RESEND_API_KEY is required to send receipts and notifications.');
  }
  const from = value('EMAIL_FROM');
  if (!from) {
    problems.push('EMAIL_FROM is required (a verified sender, e.g. "Alumni <no-reply@domain>").');
  } else if (/\.local\b|\.example\b/i.test(from)) {
    problems.push('EMAIL_FROM must use a real verified domain, not .local or .example.');
  } else if (!/^[^<]*<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/.test(from)) {
    problems.push('EMAIL_FROM must look like "Name <no-reply@your-domain>".');
  }

  const contact = value('CONTACT_EMAIL');
  if (!contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    problems.push('CONTACT_EMAIL must be a valid public office address.');
  }

  const trustProxy = value('TRUST_PROXY')?.toLowerCase();
  if (trustProxy && !['1', '0', 'true', 'false', 'yes', 'no', 'on', 'off'].includes(trustProxy)) {
    problems.push('TRUST_PROXY must be true or false.');
  }

  return problems;
}

export function assertRuntimeEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const problems = productionEnvProblems();
  if (problems.length === 0) return;
  throw new Error(
    [
      'Refusing to start with an incomplete production configuration:',
      ...problems.map((p) => `  - ${p}`),
    ].join('\n'),
  );
}
