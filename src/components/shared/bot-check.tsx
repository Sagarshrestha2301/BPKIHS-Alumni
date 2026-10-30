'use client';

import { useEffect, useRef, useState } from 'react';

import { botCheck } from '@/content/bot';
import { TURNSTILE_SCRIPT_URL } from '@/lib/constants/bot';

/**
 * The Cloudflare Turnstile widget for the public forms.
 *
 * The script is loaded on demand, once per page, and only when a site key was compiled in.
 * With no key (a fresh clone, the browser suite) the component renders nothing and the server
 * skips the check outside production; the production gate lives in `src/server/bot/turnstile.ts`.
 *
 * `resetKey` lets a form ask for a fresh token after a failed submission: Turnstile tokens are
 * single-use, so a retry needs a new one.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

interface TurnstileApi {
  render: (target: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<void> | null = null;

function loadWidget(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile did not load')), {
      once: true,
    });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // Allow a later mount to try again after a network failure.
    loader = null;
    throw error;
  });

  return loader;
}

export function BotCheck({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string) => void;
  resetKey?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // The widget is rendered once; the parent's latest callback is read through a ref so a
  // re-render never tears the iframe down and loses the visitor's answer.
  useEffect(() => {
    callback.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadWidget()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !container.current || widget.current) return;
    const api = window.turnstile;
    if (!api) return;

    widget.current = api.render(container.current, {
      sitekey: SITE_KEY,
      theme: 'light',
      size: 'flexible',
      callback: (token: string) => callback.current(token),
      'expired-callback': () => callback.current(''),
      'error-callback': () => callback.current(''),
    });

    return () => {
      if (widget.current) api.remove(widget.current);
      widget.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (!resetKey) return;
    callback.current('');
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  if (failed) return <p className="text-danger-600 text-sm">{botCheck.loadFailed}</p>;

  return (
    <div ref={container} className="min-h-[65px] w-full" role="group" aria-label={botCheck.label} />
  );
}
