import { afterEach, describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import { config } from '../config';
import { limit, resetRateLimits } from './rate-limit';

function request(ip = '203.0.113.10'): Request {
  return new Request('https://alumni.example.org/api/v1/registrations', {
    headers: { 'x-forwarded-for': ip, 'x-real-ip': ip },
  });
}

afterEach(() => {
  resetRateLimits();
});

describe('limit', () => {
  it('allows the configured number of requests and then rejects', () => {
    const max = config.rateLimits.newsletter.max;

    for (let index = 0; index < max; index += 1) {
      expect(() => limit(request(), 'newsletter')).not.toThrow();
    }

    try {
      limit(request(), 'newsletter');
      throw new Error('expected the limiter to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.code).toBe('rate_limited');
      expect(apiError.status).toBe(429);
      expect(apiError.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('keeps buckets separate', () => {
    const max = config.rateLimits.support.max;
    for (let index = 0; index < max; index += 1) limit(request(), 'support');
    expect(() => limit(request(), 'support')).toThrow(ApiError);
    expect(() => limit(request(), 'report')).not.toThrow();
  });

  it('starts again after a reset', () => {
    const max = config.rateLimits.report.max;
    for (let index = 0; index < max; index += 1) limit(request(), 'report');
    resetRateLimits();
    expect(() => limit(request(), 'report')).not.toThrow();
  });
});
