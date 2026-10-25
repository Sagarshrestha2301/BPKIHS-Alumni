import { accountPage } from '@/content/account';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/constants/security';

import type { ApiClient } from '../contract';
import { ApiError } from '../errors';
import type { Session } from '../types';

/** Relative calls only: the browser talks to the origin it loaded the page from. */
const BASE_URL = '';

function csrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CSRF_COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string>;
  };
  /** Better Auth answers with a bare `{ code, message }`, not our envelope. */
  code?: string;
  message?: string;
}

/** Better Auth's one-time-code failures, in words a member can act on. */
const AUTH_CODE_MESSAGES: Record<string, string> = {
  INVALID_OTP: accountPage.verification.failed,
  OTP_EXPIRED: accountPage.verification.expired,
  TOO_MANY_ATTEMPTS: accountPage.verification.tooMany,
};

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const token = method === 'GET' || method === 'HEAD' ? undefined : csrfToken();
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('network', 'Could not reach the server. Check your connection.');
  }

  const body = (await response.json().catch(() => null)) as (T & ErrorEnvelope) | null;
  const error = body?.error;

  if (!response.ok || error) {
    const providerCode = error?.code ?? body?.code;
    const friendly = providerCode ? AUTH_CODE_MESSAGES[providerCode] : undefined;
    throw new ApiError(
      friendly ? 'validation' : ((error?.code as ApiError['code']) ?? 'server'),
      friendly ?? error?.message ?? body?.message ?? 'Something went wrong. Please try again.',
      {
        status: response.status,
        ...(error?.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    );
  }

  return body as T;
}

function body(data: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(data) };
}

function toSession(payload: { user?: { id?: string; name?: string; email?: string } }): Session {
  const user = payload.user;
  if (!user?.id || !user.email) {
    throw new ApiError('server', 'The sign-in response was incomplete.');
  }
  return { userId: user.id, name: user.name ?? '', email: user.email };
}

export const httpAdapter: ApiClient = {
  /* site */
  getSiteStats: () => request('/api/v1/site/stats'),
  getWelcomeMessage: () => request('/api/v1/site/welcome'),

  /* alumni */
  listAlumni: (params = {}) =>
    request(
      `/api/v1/alumni${query({
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        sort: params.sort,
        programme: params.programme,
        batchYear: params.batchYear,
        country: params.country,
        city: params.city,
        furtherStudies: params.furtherStudies,
      })}`,
    ),
  getAlumnus: (id) => request(`/api/v1/alumni/${encodeURIComponent(id)}`),
  getAlumniFilterOptions: () => request('/api/v1/alumni/filters'),
  submitRegistration: (input) => request('/api/v1/registrations', body(input)),
  verifyRegistration: async (input) => {
    const payload = await request<{ user?: { id?: string; name?: string; email?: string } }>(
      '/api/auth/email-otp/verify-email',
      body(input),
    );
    return toSession(payload);
  },
  resendRegistrationCode: (input) => request('/api/v1/registrations/resend', body(input)),

  /* donations */
  listGoals: () => request('/api/v1/goals'),
  getGoal: (id) => request(`/api/v1/goals/${encodeURIComponent(id)}`),
  createDonation: (input) => request('/api/v1/donations', body(input)),
  getFundsBreakdown: () => request('/api/v1/funds'),

  /* governance */
  listBoard: (params) => request(`/api/v1/board${query({ current: params.current })}`),

  /* events */
  listEvents: (params = {}) =>
    request(
      `/api/v1/events${query({
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        status: params.status,
        sort: params.sort,
      })}`,
    ),
  getEvent: (slug) => request(`/api/v1/events/${encodeURIComponent(slug)}`),
  submitRsvp: (eventId, input) =>
    request(`/api/v1/events/${encodeURIComponent(eventId)}/rsvp`, body(input)),

  /* community */
  listFeed: (params = {}) =>
    request(
      `/api/v1/feed${query({
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        type: params.type,
        tag: params.tag,
      })}`,
    ),
  submitPost: (input) => request('/api/v1/posts', body(input)),
  reportPost: (postId, input) =>
    request(`/api/v1/posts/${encodeURIComponent(postId)}/report`, body(input)),
  subscribeNewsletter: (input) => request('/api/v1/newsletter', body(input)),
  updateNewsletterPrefs: (input) =>
    request('/api/v1/newsletter', { method: 'PATCH', body: JSON.stringify(input) }),

  /* support */
  listFaq: () => request('/api/v1/faq'),
  submitSupportTicket: (input) => request('/api/v1/support', body(input)),

  /* auth */
  getSession: async () => {
    const payload = await request<{
      session?: { id?: string };
      user?: { id?: string; name?: string; email?: string };
    } | null>('/api/auth/get-session');
    if (!payload?.user?.id || !payload.user.email) return null;
    return { userId: payload.user.id, name: payload.user.name ?? '', email: payload.user.email };
  },
  login: async (input) => {
    const payload = await request<{ user?: { id?: string; name?: string; email?: string } }>(
      '/api/auth/sign-in/email',
      body(input),
    );
    return toSession(payload);
  },
  signup: async (input) => {
    const payload = await request<{ user?: { id?: string; name?: string; email?: string } }>(
      '/api/auth/sign-up/email',
      body({
        email: input.email,
        password: input.password,
        name: input.fullName,
        phone: input.phone,
      }),
    );
    return toSession(payload);
  },
  logout: async () => {
    await request<{ success?: boolean }>('/api/auth/sign-out', { method: 'POST', body: '{}' });
    return { ok: true };
  },
};
