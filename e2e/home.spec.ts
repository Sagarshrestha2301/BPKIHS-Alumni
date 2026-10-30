import { expect, test } from '@playwright/test';

test('home page loads with the site title and hero heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BPKIHS Alumni Association/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Connected by BPKIHS. Wherever life takes us.',
    }),
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
  const hero = page.getByRole('region', {
    name: 'Connected by BPKIHS. Wherever life takes us.',
  });
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
  const doors = page.getByRole('region', { name: 'A network that travels with you' });
  await expect(doors.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(doors.getByRole('link', { name: 'Browse the directory' })).toHaveAttribute(
    'href',
    '/directory',
  );
});

test('featured giving shows goals with progress', async ({ page }) => {
  await page.goto('/');
  const goals = page.getByRole('region', { name: 'Where your gift goes' });
  await expect(goals.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(goals.getByRole('progressbar')).toHaveCount(3);
  await expect(goals.getByRole('link', { name: 'See all goals' })).toHaveAttribute(
    'href',
    '/donate',
  );
});

test('upcoming events lists three events with RSVP links', async ({ page }) => {
  await page.goto('/');
  const events = page.getByRole('region', { name: 'Upcoming events' });
  await expect(events.getByRole('heading', { level: 3 })).toHaveCount(3);
  await expect(events.getByRole('link', { name: /^RSVP and details/ })).toHaveCount(3);
});

test('community section lists three posts', async ({ page }) => {
  await page.goto('/');
  const posts = page.getByRole('region', { name: 'What classmates are up to' });
  await expect(posts.getByRole('heading', { level: 3 })).toHaveCount(3);
});

test('board preview shows members and links to the full board', async ({ page }) => {
  await page.goto('/');
  const board = page.getByRole('region', { name: 'Meet the board' });
  await expect(board.getByRole('heading', { level: 3 }).first()).toBeVisible();
  await expect(board.getByRole('link', { name: 'Meet the full board' })).toHaveAttribute(
    'href',
    '/about/board',
  );
});

test('welcome message from the leadership closes the page', async ({ page }) => {
  await page.goto('/');
  const welcome = page.getByRole('region', { name: 'A message from the Association' });
  await expect(welcome).toBeVisible();
  await expect(welcome.getByText('Dr. Rukmini Basnyat')).toBeVisible();
  await expect(welcome.getByText('President, BPKIHS Alumni Association')).toBeVisible();
});

test('home page has Open Graph tags and a canonical link', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'BPKIHS Alumni Association',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
});

test('newsletter signup is available at the bottom of the home page', async ({ page }) => {
  await page.goto('/');
  const signup = page.getByRole('region', { name: 'Stay in touch' });
  await expect(signup.getByLabel('Email address')).toBeVisible();
  await expect(signup.getByRole('button', { name: 'Subscribe' })).toBeVisible();
});
