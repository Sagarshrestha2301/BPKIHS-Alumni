import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Resend } from "resend";

import { getEmailEnvironment } from "@/lib/env.server";

type AuthenticationEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

const emailContent: Record<AuthenticationEmailType, { subject: string; action: string }> = {
  "sign-in": {
    subject: "Your BPKIHS Alumni sign-in code",
    action: "sign in to your account",
  },
  "email-verification": {
    subject: "Verify your BPKIHS Alumni email",
    action: "verify your email address",
  },
  "forget-password": {
    subject: "Reset your BPKIHS Alumni password",
    action: "reset your password",
  },
  "change-email": {
    subject: "Confirm your new BPKIHS Alumni email",
    action: "confirm your new email address",
  },
};

async function writeE2eOtp({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: AuthenticationEmailType;
}) {
  const otpFile = process.env.E2E_OTP_FILE;

  if (!otpFile) {
    throw new Error("E2E_OTP_FILE must be configured when E2E is enabled.");
  }

  await mkdir(path.dirname(otpFile), { recursive: true });
  await writeFile(
    otpFile,
    JSON.stringify({ email, otp, type, createdAt: new Date().toISOString() }),
    "utf8",
  );
}

export function isE2eOtpCaptureEnabled(environment = process.env) {
  return (
    Reflect.get(environment, "E2E") === "1" &&
    Reflect.get(environment, "NODE_ENV") !== "production"
  );
}

export async function sendAuthenticationOtp({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: AuthenticationEmailType;
}) {
  if (isE2eOtpCaptureEnabled()) {
    await writeE2eOtp({ email, otp, type });
    return;
  }

  const { EMAIL_FROM, RESEND_API_KEY } = getEmailEnvironment();
  const content = emailContent[type];
  const resend = new Resend(RESEND_API_KEY);
  const result = await resend.emails.send({
  from: EMAIL_FROM,
  to: [email],
  subject: content.subject,
  text: `Your one-time code to ${content.action} is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`,
});
if (result.error) {
  throw new Error("Unable to deliver the authentication email.");
}
}
