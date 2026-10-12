export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'not_found'
  | 'rate_limited'
  | 'network'
  | 'server'
  | 'not_implemented';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  validation: 422,
  unauthorized: 401,
  not_found: 404,
  rate_limited: 429,
  network: 0,
  server: 500,
  not_implemented: 501,
};

interface ApiErrorOptions {
  /** Defaults to the usual HTTP status for the code. */
  status?: number;
  /** Field name to message, for validation errors. */
  fieldErrors?: Record<string, string>;
}

/** Every adapter throws this, so the UI handles mock and real errors the same way. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? STATUS_BY_CODE[code];
    this.fieldErrors = options.fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
