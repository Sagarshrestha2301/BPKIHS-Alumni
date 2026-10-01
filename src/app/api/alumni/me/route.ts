import { updateAlumniProfileSchema } from "@/features/alumni/profile.schema";
import {
  AlumniProfileInputError,
  getOwnAlumniProfile,
  updateOwnAlumniProfile,
} from "@/features/alumni/profile.service";
import {
  apiError,
  internalServerError,
  privateJson,
} from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth-session";

export const runtime = "nodejs";

const route = "alumni.me";

function unauthenticatedResponse() {
  return apiError(401, "UNAUTHENTICATED", "Sign in to continue.");
}

export async function GET() {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const session = await getCurrentSession();

    if (!session) {
      return unauthenticatedResponse();
    }

    const profile = await getOwnAlumniProfile(session.user.id);
    return privateJson({ data: profile });
  } catch (error) {
    return internalServerError(error, { requestId, route, startedAt });
  }
}

export async function PATCH(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const session = await getCurrentSession();

    if (!session) {
      return unauthenticatedResponse();
    }

    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return apiError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Submit the profile as JSON.",
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError(400, "VALIDATION_ERROR", "Submit valid JSON.");
    }

    const parsed = updateAlumniProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "The submitted profile is invalid.",
        parsed.error.flatten().fieldErrors,
      );
    }

    try {
      const profile = await updateOwnAlumniProfile(session.user.id, parsed.data);
      return privateJson({ data: profile });
    } catch (error) {
      if (error instanceof AlumniProfileInputError) {
        return apiError(400, "VALIDATION_ERROR", error.message);
      }

      throw error;
    }
  } catch (error) {
    return internalServerError(error, { requestId, route, startedAt });
  }
}
