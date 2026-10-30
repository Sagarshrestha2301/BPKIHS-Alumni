import { expect, test } from '@playwright/test';

/**
 * The layouts most at risk of a sideways scroll: the home page, a directory profile (whose
 * contact tiles and sidebar stack at 360 px) and the 404 page.
 */
const paths = ['/', '/directory/alumnus-fixture-member', '/this-page-does-not-exist'];

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
