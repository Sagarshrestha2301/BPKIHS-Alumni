import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient, getApiClient, resetApiClient, resolveApiMode } from './client';
import { API_METHOD_NAMES } from './contract';
import { httpAdapter } from './http';
import { mockAdapter } from './mock';

afterEach(() => {
  vi.unstubAllEnvs();
  resetApiClient();
});

describe('resolveApiMode', () => {
  it('defaults to mock when missing or blank', () => {
    expect(resolveApiMode(undefined)).toBe('mock');
    expect(resolveApiMode('')).toBe('mock');
    expect(resolveApiMode('   ')).toBe('mock');
  });

  it('accepts mock and http in any case', () => {
    expect(resolveApiMode('mock')).toBe('mock');
    expect(resolveApiMode(' HTTP ')).toBe('http');
  });

  it('throws on a typo instead of silently using sample data', () => {
    expect(() => resolveApiMode('htpp')).toThrow('Invalid NEXT_PUBLIC_API_MODE "htpp"');
  });
});

describe('createApiClient and getApiClient', () => {
  it('picks the adapter for the mode', () => {
    expect(createApiClient('mock')).toBe(mockAdapter);
    expect(createApiClient('http')).toBe(httpAdapter);
  });

  it('reads NEXT_PUBLIC_API_MODE and caches the result', () => {
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'http');
    expect(getApiClient()).toBe(httpAdapter);
    vi.stubEnv('NEXT_PUBLIC_API_MODE', 'mock');
    expect(getApiClient()).toBe(httpAdapter);
    resetApiClient();
    expect(getApiClient()).toBe(mockAdapter);
  });
});

describe('adapter shape', () => {
  it('lists 22 methods', () => {
    expect(API_METHOD_NAMES).toHaveLength(22);
    expect(new Set(API_METHOD_NAMES).size).toBe(22);
  });

  it.each([
    ['http', httpAdapter],
    ['mock', mockAdapter],
  ] as const)('%s adapter has exactly the contract methods', (_name, adapter) => {
    expect(Object.keys(adapter).sort()).toEqual([...API_METHOD_NAMES].sort());
  });

  it.each(API_METHOD_NAMES)('http.%s rejects with not_implemented', async (name) => {
    const call = httpAdapter[name] as () => Promise<unknown>;
    await expect(call()).rejects.toMatchObject({ code: 'not_implemented', status: 501 });
  });
});
