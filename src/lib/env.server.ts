import "server-only";

import { z } from "zod";

const authEnvironmentSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

const emailEnvironmentSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.email(),
});

const resendDefaultBaseUrl = "https://api.resend.com";

function assertEmailEnvironmentConfiguration(environment = process.env) {
  const baseUrl = environment.RESEND_BASE_URL;
  const isE2e = environment.E2E === "1";

  if (
    environment.NODE_ENV === "production" &&
    baseUrl !== undefined &&
    baseUrl !== resendDefaultBaseUrl &&
    !isE2e
  ) {
    throw new Error(
      "RESEND_BASE_URL may only override Resend in a production E2E process.",
    );
  }

  if (isE2e) {
    const databaseUrl = environment.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required when E2E is enabled.");
    }

    let databaseName: string;

    try {
      databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
    } catch {
      throw new Error("DATABASE_URL must be a valid URL when E2E is enabled.");
    }

    if (!/(e2e|test)/i.test(databaseName)) {
      throw new Error(
        'E2E requires DATABASE_URL to target a database whose name contains "e2e" or "test".',
      );
    }
  }
}

assertEmailEnvironmentConfiguration();

function formatMissingEnvironment(error: z.ZodError) {
  return error.issues.map((issue) => issue.path.join(".")).join(", ");
}

export function getAuthEnvironment() {
  const parsed = authEnvironmentSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Missing or invalid authentication environment variables: ${formatMissingEnvironment(parsed.error)}.`,
    );
  }

  return parsed.data;
}

export function getEmailEnvironment() {
  const parsed = emailEnvironmentSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Missing or invalid email environment variables: ${formatMissingEnvironment(parsed.error)}.`,
    );
  }

  return parsed.data;
}
