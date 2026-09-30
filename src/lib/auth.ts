import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { sendAuthenticationOtp } from "@/lib/email";
import { prisma } from "@/lib/db";
import { getAuthEnvironment } from "@/lib/env.server";

const { BETTER_AUTH_SECRET, BETTER_AUTH_URL } = getAuthEnvironment();

export const authRateLimit = {
  enabled: true,
  storage: "database",
  window: 60,
  max: 100,
  customRules: {
    "/sign-up/email": { window: 60, max: 3 },
    "/sign-in/email": { window: 60, max: 5 },
  },
} as const;

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  rateLimit: authRateLimit,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      expiresIn: 300,
      allowedAttempts: 3,
      storeOTP: "hashed",
      sendVerificationOTP: sendAuthenticationOtp,
    }),
    // This must remain last so server actions can apply Better Auth cookies.
    nextCookies(),
  ],
});
