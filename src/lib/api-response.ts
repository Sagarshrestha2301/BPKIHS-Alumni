import { NextResponse } from "next/server";

const privateApiHeaders = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export function privateJson<T>(body: T, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);

  for (const [name, value] of Object.entries(privateApiHeaders)) {
    headers.set(name, value);
  }

  return NextResponse.json(body, { ...init, headers });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string[] | undefined>,
) {
  return privateJson(
    {
      error: {
        code,
        message,
        ...(fields === undefined ? {} : { fields }),
      },
    },
    { status },
  );
}

export function internalServerError() {
  return apiError(
    500,
    "INTERNAL_ERROR",
    "We could not process your request. Please try again later.",
  );
}
