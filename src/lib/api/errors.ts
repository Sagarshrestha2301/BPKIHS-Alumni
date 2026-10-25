export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'unavailable'
  | 'network'
  | 'server'
  | 'not_implemented';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  validation: 422,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  unavailable: 503,
  network: 0,
  server: 500,
  not_implemented: 501,
};

interface ApiErrorOptions {
  /** Defaults to the usual HTTP status for the code. */
  status?: number;
  /** Field name to message, for validation errors. */
  fieldErrors?: Record<string, string>;
  /** Seconds until a rate-limited caller may retry; sent as `Retry-After`. */
  retryAfterSeconds?: number;
}

/** Every API call throws this, so the UI handles failures the same way. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;
  readonly retryAfterSeconds?: number;

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? STATUS_BY_CODE[code];
    this.fieldErrors = options.fieldErrors;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
