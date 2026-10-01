import { test, expect } from "@playwright/test";

import {
  collectCspConsoleMessages,
  installCspMonitor,
  readCspReports,
  reportCspViolations,
  type CspReport,
} from "./csp-monitor";

test("home page loads", async ({ page }) => {
  const reports: CspReport[] = [];
  await installCspMonitor(page);
  collectCspConsoleMessages(page, reports);
  await page.goto("/");

  await expect(page).toHaveTitle(/BPKIHS Alumni/i);
  const allReports = [...reports, ...(await readCspReports(page))];
  reportCspViolations(allReports);
  expect(allReports).toEqual([]);
});
