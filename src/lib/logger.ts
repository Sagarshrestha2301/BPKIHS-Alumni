type LogValue = unknown;

const sensitiveKeyPattern = /password|otp|token|authorization|cookie|email/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function redact(value: LogValue, key?: string): LogValue {
  if (key !== undefined && sensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value.replace(emailPattern, "[REDACTED_EMAIL]");
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redact(value.message),
      stack: value.stack === undefined ? undefined : redact(value.stack),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

export function logRequestError({
  error,
  requestId,
  route,
  status,
  startedAt,
}: {
  error: unknown;
  requestId: string;
  route: string;
  status: number;
  startedAt: number;
}) {
  console.error(
    JSON.stringify(
      redact({
        level: "error",
        requestId,
        route,
        status,
        durationMs: Date.now() - startedAt,
        error,
      }),
    ),
  );
}