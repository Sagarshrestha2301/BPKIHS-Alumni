import { describe, expect, it } from 'vitest';

import type { ApiClient } from './contract';
import { httpAdapter } from './http';
import { mockAdapter } from './mock';

// If either adapter stops matching the contract, this file stops compiling.
const adapters: Record<'http' | 'mock', ApiClient> = { http: httpAdapter, mock: mockAdapter };

describe('adapter swap', () => {
  it('has the same methods on both adapters', () => {
    expect(Object.keys(adapters.http).sort()).toEqual(Object.keys(adapters.mock).sort());
  });
});
