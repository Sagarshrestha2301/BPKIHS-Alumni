import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated accessibility scan of every public page.
 *
 * This catches the mechanical half of an audit — contrast, names, landmark structure, heading
 * order. It does not replace a person with a screen reader: keyboard order and how an
 * announcement actually sounds still need the manual pass in `docs/TRACKER.md` D4.
 */
const PAGES = [
  '/',
  '/about',
  '/about/board',
  '/about/how-we-work',
  '/directory',
  '/events',
  '/community',
  '/community/newsletter',
  '/donate',
  '/donate/transparency',
  '/donate/tribute',
  '/register',
  '/sign-in',
  '/support',
  '/support/faq',
  '/legal/privacy',
  '/legal/terms',
  '/legal/accessibility',
];

test.describe('accessibility', () => {
  for (const path of PAGES) {
    test(`${path} has no WCAG AA violations`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the desktop project scans the served markup');
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(
        violations.map((violation) => ({
          rule: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => node.target.join(' ')),
        })),
      ).toEqual([]);
    });
  }
});
