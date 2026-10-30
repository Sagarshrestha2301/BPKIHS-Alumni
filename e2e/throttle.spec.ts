import { expect, test } from '@playwright/test';

/**
 * The common visitor is on a mid-range Android phone on a congested mobile network, which is
 * the case this suite is least likely to be written for. Chrome DevTools Protocol can shape
 * both the network and the CPU, so the check runs the real page under those conditions.
 *
 * This measures the development server, so the budget is a regression guard rather than the
 * production target: `docs/TRACKER.md` D5 records the Lighthouse numbers taken from a
 * production build.
 */
/**
 * Measured at about 0.9 s on a warm dev server (4x CPU, slow 4G); the budget leaves room for a
 * slow machine while still failing if the first screen grows by a second or more.
 */
const LCP_BUDGET_MS = 3_000;

/** Slow 4G, close to the FCC "mobile broadband" profile Lighthouse uses. */
const SLOW_4G = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};

test.describe('slow phone, slow network', () => {
  test('the home page paints its heading and content in time', async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Network and CPU throttling need the Chrome DevTools Protocol.',
    );

    // Warm the route first: on the dev server the first request also compiles it, and that
    // build time is not something a visitor experiences.
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', SLOW_4G);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.reload({ waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // LCP is only delivered to a PerformanceObserver, not to getEntriesByType. Chrome keeps
    // the earlier entries for a late observer when `buffered` is set.
    const lcp = await page.evaluate(
      () =>
        new Promise<number | null>((resolve) => {
          let settled = false;
          const finish = (value: number | null) => {
            if (settled) return;
            settled = true;
            observer.disconnect();
            resolve(value);
          };
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) finish(entries[entries.length - 1]?.startTime ?? null);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => finish(null), 3_000);
        }),
    );

    expect(lcp, 'Largest Contentful Paint was not reported').not.toBeNull();
    expect(lcp ?? Infinity, `LCP ${Math.round(lcp ?? 0)}ms on a throttled 4G phone`).toBeLessThan(
      LCP_BUDGET_MS,
    );
  });
});
