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
