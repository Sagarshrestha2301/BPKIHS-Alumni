import { expect, test } from '@playwright/test';

const paths = ['/', '/styleguide', '/this-page-does-not-exist'];

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
