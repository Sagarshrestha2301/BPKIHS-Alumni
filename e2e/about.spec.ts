import { expect, test } from '@playwright/test';

test.describe('/about', () => {
  test('has the heading, breadcrumbs and the sections', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About us \| BPKIHS Alumni Association/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'About the Association' }),
    ).toBeVisible();
    const crumbs = page.getByRole('navigation', { name: 'breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('About');
    await expect(page.getByRole('heading', { level: 2, name: 'Our mission' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Our vision' })).toBeVisible();
  });

  test('shows the timeline as a list of four events', async ({ page }) => {
    await page.goto('/about');
    const story = page.getByRole('region', { name: 'Our story' });
    await expect(story.getByRole('listitem')).toHaveCount(4);
  });

  test('links on to the institute, the board and how we work', async ({ page }) => {
    await page.goto('/about');
    const institute = page.getByRole('region', { name: 'Our home institute' });
    await expect(institute.getByRole('link', { name: /Visit bpkihs.edu/ })).toHaveAttribute(
      'href',
      'https://bpkihs.edu',
    );
    await expect(institute.getByRole('link', { name: 'Meet the board' })).toHaveAttribute(
      'href',
      '/about/board',
    );
  });
});

test.describe('/about/how-we-work', () => {
  test('has the heading and breadcrumbs', async ({ page }) => {
    await page.goto('/about/how-we-work');
    await expect(
      page.getByRole('heading', { level: 1, name: 'How we work with BPKIHS' }),
    ).toBeVisible();
    const crumbs = page.getByRole('navigation', { name: 'breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  test('opens and closes an answer', async ({ page }) => {
    await page.goto('/about/how-we-work');
    const trigger = page.getByRole('button', { name: 'How are donated funds handled?' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Every donation is tied to a named goal')).toBeVisible();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('can be used with the keyboard', async ({ page }) => {
    await page.goto('/about/how-we-work');
    const trigger = page.getByRole('button', { name: 'How are decisions made?' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

for (const route of ['/about', '/about/how-we-work']) {
  test(`${route} does not scroll sideways`, async ({ page }) => {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
