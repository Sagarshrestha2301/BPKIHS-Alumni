import { expect, test } from '@playwright/test';

// '/demo' is the temporary page; remove it from this list when Step 14c replaces it with /styleguide.
const paths = ['/', '/demo', '/this-page-does-not-exist'];

for (const path of paths) {
  test(`${path} does not scroll sideways`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
