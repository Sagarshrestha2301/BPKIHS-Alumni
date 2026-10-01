import type { Page } from "@playwright/test";

export type CspReport = {
  page: string;
  violatedDirective: string;
  blockedUri: string;
};

export async function installCspMonitor(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (event) => {
      const reports = (window as typeof window & { __cspReports?: CspReport[] })
        .__cspReports ?? [];

      reports.push({
        page: window.location.pathname,
        violatedDirective: event.violatedDirective,
        blockedUri: event.blockedURI,
      });
      (window as typeof window & { __cspReports?: CspReport[] }).__cspReports =
        reports;
    });
  });
}

export function collectCspConsoleMessages(page: Page, reports: CspReport[]) {
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy|\bCSP\b/i.test(message.text())) {
      reports.push({
        page: new URL(page.url()).pathname,
        violatedDirective: "console message",
        blockedUri: "unknown",
      });
    }
  });
}

export async function readCspReports(page: Page) {
  return page.evaluate(() =>
    (window as typeof window & { __cspReports?: CspReport[] }).__cspReports ?? [],
  );
}

export function reportCspViolations(reports: CspReport[]) {
  for (const report of reports) {
    console.log(
      `[CSP] page=${report.page} violatedDirective=${report.violatedDirective} blockedUri=${report.blockedUri}`,
    );
  }
}