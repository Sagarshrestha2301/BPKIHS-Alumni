import { expect, test } from '@playwright/test';

import { PUBLIC_ROUTES } from './helpers/routes';
import { settle } from './helpers/settle';

/**
 * The mechanical half of a keyboard walkthrough.
 *
 * It proves two things axe cannot: that every early Tab stop draws a visible focus ring, and
 * that nothing hidden is still reachable. It does not judge whether the ring is where a person
 * would expect it, which is why the manual pass in `docs/TRACKER.md` D4 stays open.
 *
 * Both checks inspect the served markup, so they run once, on the desktop project.
 */
const MAX_STOPS = 12;

test.describe('keyboard', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} draws a focus ring on every early Tab stop`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the served markup is the same on both');
      await page.goto(path);
      await settle(page);

      const stops: { tag: string; label: string; outline: string }[] = [];

      for (let index = 0; index < MAX_STOPS; index += 1) {
        await page.keyboard.press('Tab');

        const stop = await page.evaluate(() => {
          const element = document.activeElement as HTMLElement | null;
          if (!element || element === document.body) return null;

          const style = getComputedStyle(element);
          const outlined =
            style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
          const shadowed = style.boxShadow !== 'none' && style.boxShadow !== '';

          return {
            label: (element.getAttribute('aria-label') ?? element.textContent ?? '')
              .trim()
              .replace(/\s+/g, ' ')
              .slice(0, 40),
            tag: element.tagName.toLowerCase(),
            visible: outlined || shadowed,
            outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
          };
        });

        // A short page runs out of focusable elements before the limit; that is fine.
        if (!stop) break;
        stops.push({
          tag: stop.tag,
          label: stop.label,
          outline: stop.visible ? stop.outline : `none (${stop.tag} "${stop.label}")`,
        });
      }

      expect(stops.length, `${path} has focusable elements`).toBeGreaterThan(0);
      expect(
        stops.filter((stop) => stop.outline.includes('none (')),
        `tab stops without a visible focus ring on ${path}`,
      ).toEqual([]);
    });

    test(`${path} keeps hidden content out of the tab order`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the served markup is the same on both');
      await page.goto(path);
      await settle(page);

      const reachable = await page.evaluate(() => {
        const focusable =
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
        return [...document.querySelectorAll<HTMLElement>(focusable)]
          .filter((element) => element.offsetParent !== null)
          .filter(
            (element) =>
              element.closest('[aria-hidden="true"]') !== null || element.hasAttribute('inert'),
          )
          .map((element) => `${element.tagName.toLowerCase()}: ${element.outerHTML.slice(0, 60)}`);
      });

      expect(reachable).toEqual([]);
    });
  }
});
