import {
  submitOwnVerification,
  VerificationInputError,
} from "@/features/alumni/verification.service";
import {
  apiError,
  internalServerError,
  privateJson,
} from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return apiError(401, "UNAUTHENTICATED", "Sign in to continue.");
    }

    if (!session.user.emailVerified) {
      return apiError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email before submitting an alumni claim.",
      );
    }

    try {
      const verification = await submitOwnVerification(session.user.id);
      return privateJson({ data: verification }, { status: 201 });
    } catch (error) {
      if (error instanceof VerificationInputError) {
        return apiError(409, "VERIFICATION_NOT_READY", error.message);
      }

      throw error;
    }
  } catch {
    return internalServerError();
  }
}
