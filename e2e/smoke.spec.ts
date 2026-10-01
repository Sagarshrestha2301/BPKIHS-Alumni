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
  const response = await page.goto("/");

  await expect(page).toHaveTitle(/BPKIHS Alumni/i);
  expect(response?.headers()["strict-transport-security"]).toBe(
    "max-age=31536000; includeSubDomains",
  );
  const csp = response?.headers()["content-security-policy-report-only"];
  expect(csp).toBeTruthy();
  expect(csp).not.toContain("'unsafe-eval'");
  const allReports = [...reports, ...(await readCspReports(page))];
  reportCspViolations(allReports);
  expect(allReports).toEqual([]);
});
