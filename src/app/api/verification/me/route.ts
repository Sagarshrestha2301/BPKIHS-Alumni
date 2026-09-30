import { getOwnVerification } from "@/features/alumni/verification.service";
import {
  apiError,
  internalServerError,
  privateJson,
} from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return apiError(401, "UNAUTHENTICATED", "Sign in to continue.");
    }

    const verification = await getOwnVerification(session.user.id);
    return privateJson({ data: verification });
  } catch {
    return internalServerError();
  }
}
