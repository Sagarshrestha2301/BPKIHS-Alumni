import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { PUBLIC_ROUTES } from './helpers/routes';
import { settle } from './helpers/settle';

/**
 * Automated accessibility scan of every public page.
 *
 * This catches the mechanical half of an audit : contrast, names, landmark structure, heading
 * order. It does not replace a person with a screen reader: keyboard order and how an
 * announcement actually sounds still need the manual pass in `docs/TRACKER.md` D4.
 */
test.describe('accessibility', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} has no WCAG AA violations`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the desktop project scans the served markup');
      await page.goto(path);
      await settle(page);

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
