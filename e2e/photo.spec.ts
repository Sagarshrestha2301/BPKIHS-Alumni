import { expect, test } from '@playwright/test';
import sharp from 'sharp';

import { mutationHeaders } from './helpers/requests';
import { MEMBER_STATE } from './helpers/storage';

/**
 * The member fixture is shared by every project, so this file runs desktop-only and serially:
 * one upload would otherwise race the other project's removal.
 */
test.describe.configure({ mode: 'serial' });

test.describe('profile photo', () => {
  test.use({ storageState: MEMBER_STATE });
  test.skip(({ isMobile }) => isMobile, 'desktop only: the fixture profile is shared');

  test('uploads a real image, serves it through the privacy check and deletes it', async ({
    page,
    baseURL,
  }) => {
    const png = await sharp({
      create: {
        width: 640,
        height: 640,
        channels: 3,
        background: { r: 23, g: 92, b: 140 },
      },
    })
      .png()
      .toBuffer();

    let source: string | null = null;

    try {
      await page.goto('/account/profile');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Choose a photo').setInputFiles({
        name: 'profile.png',
        mimeType: 'image/png',
        buffer: png,
      });
      await page.getByRole('checkbox', { name: /I agree to my photo/i }).click();
      await page.getByRole('button', { name: 'Upload photo' }).click();

      await expect(page.getByRole('status').filter({ hasText: 'saved' })).toBeVisible();

      const image = page.getByRole('img', { name: 'Photo of E2E Member' });
      await expect(image).toBeVisible();
      source = await image.getAttribute('src');
      expect(source).toMatch(/^\/api\/v1\/alumni\/alumnus-fixture-member\/photo\?v=/);

      const delivered = await page.request.get(source as string);
      expect(delivered.status()).toBe(200);
      expect(delivered.headers()['content-type']).toBe('image/webp');
      expect(Number(delivered.headers()['content-length'])).toBeLessThan(5 * 1024 * 1024);

      await page.getByRole('button', { name: 'Remove photo' }).click();
      await page.getByRole('button', { name: 'Yes, remove photo' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'removed' })).toBeVisible();

      expect((await page.request.get(source as string)).status()).toBe(404);
      source = null;
    } finally {
      if (source) {
        const headers = await mutationHeaders(page, baseURL as string);
        await page.request.delete('/api/v1/account/photo', { headers });
      }
    }
  });

  test('rejects a file that only claims to be an image', async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Choose a photo').setInputFiles({
      name: 'not-an-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('this is not a png'),
    });
    await page.getByRole('checkbox', { name: /I agree to my photo/i }).click();
    await page.getByRole('button', { name: 'Upload photo' }).click();

    await expect(page.getByText(/We could not read that image/)).toBeVisible();
    expect((await page.request.get('/api/v1/alumni/alumnus-fixture-member/photo')).status()).toBe(
      404,
    );
  });
});
