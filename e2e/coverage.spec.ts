import { expect, test } from "@playwright/test";

import {
  collectCspConsoleMessages,
  installCspMonitor,
  readCspReports,
  reportCspViolations,
  type CspReport,
} from "./csp-monitor";

async function expectNoCspViolations(page: Parameters<typeof installCspMonitor>[0], reports: CspReport[]) {
  const allReports = [...reports, ...(await readCspReports(page))];
  reportCspViolations(allReports);
  expect(allReports).toEqual([]);
}

test("404 page has no report-only CSP violations", async ({ page }) => {
  const reports: CspReport[] = [];
  await installCspMonitor(page);
  collectCspConsoleMessages(page, reports);

  const response = await page.goto("/route-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expectNoCspViolations(page, reports);
});

test("failed sign-in page has no report-only CSP violations", async ({ page }) => {
  const reports: CspReport[] = [];
  await installCspMonitor(page);
  collectCspConsoleMessages(page, reports);

  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("missing-user@example.com");
  await page.getByLabel("Password").fill("Wrong-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expectNoCspViolations(page, reports);
});