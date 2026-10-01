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
  const csp = response?.headers()["content-security-policy"];
  expect(csp).toBeTruthy();
  expect(csp).not.toContain("'unsafe-eval'");
  expect(response?.headers()["content-security-policy-report-only"]).toBeUndefined();

  const headerNonce = csp?.match(/'nonce-([^']+)'/)?.[1];
  expect(headerNonce).toBeTruthy();
  const scriptNonces = await page.locator("script[nonce]").evaluateAll((scripts) =>
    scripts.map((script) => (script as HTMLScriptElement).nonce),
  );
  expect(scriptNonces.length).toBeGreaterThan(0);
  expect(scriptNonces.every((nonce) => nonce === headerNonce)).toBe(true);
  const allReports = [...reports, ...(await readCspReports(page))];
  reportCspViolations(allReports);
  expect(allReports).toEqual([]);
});
