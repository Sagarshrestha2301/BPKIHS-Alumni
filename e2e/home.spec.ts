import { expect, test } from '@playwright/test';

test('home page loads with the site title and hero heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BPKIHS Alumni Association/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Once BPKIHS, always BPKIHS' }),
  ).toBeVisible();
});

test('page does not scroll sideways', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('hero has three calls to action', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Once BPKIHS, always BPKIHS' });
  await expect(hero.getByRole('link', { name: 'Give now' })).toHaveAttribute('href', '/donate');
  await expect(hero.getByRole('link', { name: 'Find alumni' })).toHaveAttribute(
    'href',
    '/directory',
  );
  await expect(hero.getByRole('link', { name: 'Join the network' })).toHaveAttribute(
    'href',
    '/register',
  );
});

test('stats band is on the page', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Our community in numbers' }),
  ).toHaveCount(1);
});

test('three doors section is on the page', async ({ page }) => {
  await page.goto('/');
  const doors = page.getByRole('region', { name: 'Three ways to take part' });
  await expect(doors.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(doors.getByRole('link', { name: 'Browse the directory' })).toHaveAttribute(
    'href',
    '/directory',
  );
});
