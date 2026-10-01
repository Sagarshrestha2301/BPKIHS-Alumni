import { expect, test } from "@playwright/test";

import {
  collectCspConsoleMessages,
  installCspMonitor,
  readCspReports,
  reportCspViolations,
  type CspReport,
} from "./csp-monitor";

test("CSP monitor detects canary script and network violations", async ({
  page,
}) => {
  const consoleReports: CspReport[] = [];
  await installCspMonitor(page);
  collectCspConsoleMessages(page, consoleReports);

  await page.goto("/csp-canary", { waitUntil: "domcontentloaded" });

  await expect
    .poll(() =>
      page.evaluate(() => {
        const browserWindow = window as typeof window & {
          __cspCanaryInlineScript?: boolean;
          __cspCanaryFetchFailed?: boolean;
          __cspCanaryServerImageFailed?: boolean;
          __cspCanaryDynamicImageFailed?: boolean;
        };

        return {
          inlineScriptExecuted: Boolean(browserWindow.__cspCanaryInlineScript),
          fetchFailed: Boolean(browserWindow.__cspCanaryFetchFailed),
          dynamicImageFailed: Boolean(browserWindow.__cspCanaryDynamicImageFailed),
        };
      }),
    )
    .toEqual({
      inlineScriptExecuted: false,
      fetchFailed: true,
      dynamicImageFailed: true,
    });

  const response = await page.request.get("/csp-canary");
  const csp = response.headers()["content-security-policy"];
  expect(csp).toBeTruthy();
  expect(response.headers()["content-security-policy-report-only"]).toBeUndefined();

  await expect
    .poll(async () => readCspReports(page), { timeout: 10_000 })
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({ violatedDirective: "script-src-elem" }),
        expect.objectContaining({ violatedDirective: "connect-src" }),
        expect.objectContaining({ violatedDirective: "img-src" }),
      ]),
    );

  const reports = [...consoleReports, ...(await readCspReports(page))];
  reportCspViolations(reports);
  expect(reports).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        violatedDirective: expect.stringMatching(/script-src/),
        blockedUri: expect.stringMatching(/inline|blocked/),
      }),
      expect.objectContaining({
        violatedDirective: "connect-src",
        blockedUri: "https://csp-canary.invalid/blocked",
      }),
      expect.objectContaining({
        violatedDirective: "img-src",
        blockedUri: "https://csp-canary.invalid/blocked.png",
      }),
      expect.objectContaining({
        violatedDirective: "img-src",
        blockedUri: "https://csp-canary.invalid/server-rendered.png",
      }),
    ]),
  );
});