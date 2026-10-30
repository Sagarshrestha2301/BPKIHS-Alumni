import { expect, test } from '@playwright/test';

import { ADMIN_STATE, DONOR_STATE } from './helpers/storage';

/**
 * The written register import, end to end:
 *
 * - any header names can be matched to the known fields;
 * - the preview reports ready, duplicate and invalid rows without writing;
 * - importing writes only the ready rows and records them as approved;
 * - a second run reports the same email as already on file;
 * - a normal user cannot reach the importer.
 */

function registerCsv(
  stamp: number,
  email = `e2e.import.${stamp}@example.com`,
  name = `E2E Import ${stamp}`,
): string {
  return [
    'Name,Email,Course,Graduation Year,Country,City',
    `${name},${email},MBBS,2012,Nepal,Dharan`,
    `Broken Row,not-an-email,MBBS,2012,Nepal,Pokhara`,
  ].join('\n');
}

async function upload(page: import('@playwright/test').Page, csv: string, name: string) {
  await page.locator('#register-file').setInputFiles({
    name,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
}

/**
 * Centres a control before clicking it: Playwright scrolls targets to the top edge, where the
 * sticky header covers them on a phone. Used for the confirmation button and the radio choices.
 */
async function centerAndClick(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
) {
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await locator.click({ force: true });
}

/**
 * Playwright scrolls a target to the top edge, where the sticky header covers it on a phone.
 * Centring first keeps the confirmation button clickable without forcing the click.
 */
async function clickImport(page: import('@playwright/test').Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Import 1 profile' });
  await button.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  // The sticky header can still cover the top edge on a phone after the actionability scroll.
  // The element is centred above, so forcing the click cannot hit the header instead.
  await button.click({ force: true });
}

test.describe('administrator', () => {
  test.use({ storageState: ADMIN_STATE });

  test('imports the valid rows and skips the broken one', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e.import.${stamp}@example.com`;

    await page.goto('/admin/alumni');
    await page.getByRole('link', { name: 'Import the written register' }).click();
    await expect(page).toHaveURL(/\/admin\/alumni\/import$/);

    await upload(page, registerCsv(stamp, email), 'register.csv');

    // The headers are guessed from the file; every required field got a column.
    await expect(page.locator('#import-column-fullName')).toHaveValue('0');
    await expect(page.locator('#import-column-email')).toHaveValue('1');
    await expect(page.locator('#import-column-programme')).toHaveValue('2');
    await expect(page.locator('#import-column-batchYear')).toHaveValue('3');
    await expect(page.locator('#import-column-country')).toHaveValue('4');

    await test.step('preview the file', async () => {
      await page.getByRole('button', { name: 'Preview rows' }).click();
      await expect(page.getByText('1 ready, 0 already on file, 1 need attention.')).toBeVisible();
      await expect(page.getByText('Needs attention')).toBeVisible();
    });

    await test.step('import the ready row as published', async () => {
      await centerAndClick(
        page,
        page.getByRole('radio', { name: /Publish them in the directory now/ }),
      );
      await clickImport(page);
      await expect(
        page.getByText('Imported 1 profile and published it. 1 row was skipped.'),
      ).toBeVisible();
    });

    // The import expires the cached directory, so the new profile is visible immediately.
    await page.goto(`/directory?q=${encodeURIComponent(`E2E Import ${stamp}`)}`);
    await expect(
      page.getByRole('link', { name: `E2E Import ${stamp}`, exact: true }),
    ).toBeVisible();

    await page.goto(`/admin/alumni?status=approved&q=${encodeURIComponent(email)}`);
    await expect(page.getByRole('row', { name: new RegExp(`E2E Import ${stamp}`) })).toContainText(
      'Approved',
    );
  });

  test('reports an email that was already imported', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e.import.dup.${stamp}@example.com`;
    // Both administrator tests run in parallel, so their stamps can be identical. Give this
    // profile its own name or the directory search finds two people and the locator is ambiguous.
    const name = `E2E Dup ${stamp}`;

    await page.goto('/admin/alumni/import');
    await upload(page, registerCsv(stamp, email, name), 'register.csv');
    await page.getByRole('button', { name: 'Preview rows' }).click();
    await centerAndClick(
      page,
      page.getByRole('radio', { name: /Publish them in the directory now/ }),
    );
    await clickImport(page);
    await expect(
      page.getByText('Imported 1 profile and published it. 1 row was skipped.'),
    ).toBeVisible();

    // Uploading again on the same page avoids a fresh hydration race: the input's value was
    // cleared after the first read, so choosing the same file fires a second change event.
    await upload(page, registerCsv(stamp, email, name), 'register.csv');
    await page.getByRole('button', { name: 'Preview rows' }).click();

    await expect(page.getByText('0 ready, 1 already on file, 1 need attention.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import 0 profiles' })).toBeDisabled();
  });

  test('holds rows for review when publication is not chosen', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e.import.hold.${stamp}@example.com`;
    const name = `E2E Held ${stamp}`;

    await page.goto('/admin/alumni/import');
    await upload(page, registerCsv(stamp, email, name), 'register.csv');
    await page.getByRole('button', { name: 'Preview rows' }).click();
    // The recommended choice is selected by default.
    await expect(page.getByRole('radio', { name: /Hold them for review/ })).toBeChecked();
    await clickImport(page);
    await expect(
      page.getByText('Imported 1 profile; it is waiting for review. 1 row was skipped.'),
    ).toBeVisible();

    await page.goto(`/directory?q=${encodeURIComponent(name)}`);
    await expect(page.getByText('No alumni found')).toBeVisible();

    await page.goto(`/admin/alumni?status=pending&q=${encodeURIComponent(email)}`);
    await expect(page.getByRole('row', { name: new RegExp(name) })).toContainText('Pending');
  });
});

test.describe('normal user', () => {
  test.use({ storageState: DONOR_STATE });

  test('cannot open the importer', async ({ page }) => {
    await page.goto('/admin/alumni/import');
    await expect(page.getByRole('heading', { name: 'Admin access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Import the written register' })).toHaveCount(0);
  });
});
