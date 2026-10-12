import { describe, expect, it, vi } from 'vitest';

import { isApiError } from '../errors';
import {
  getSimulationOptions,
  NO_SIMULATION,
  parseErrorRate,
  type SimulationOptions,
  withSimulation,
} from './simulate';

/** Returns the given numbers in order, then repeats the last one. */
function sequence(...values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)] ?? 0;
}

const base: SimulationOptions = { minLatencyMs: 300, maxLatencyMs: 800, errorRate: 0 };

describe('withSimulation', () => {
  it('waits a latency inside the range, then returns the result', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await withSimulation(() => 'done', { ...base, random: sequence(0.5), sleep });
    expect(result).toBe('done');
    expect(sleep).toHaveBeenCalledWith(550);
  });

  it('does not wait when latency is zero', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    await withSimulation(() => 1, { ...NO_SIMULATION, sleep });
    expect(sleep).not.toHaveBeenCalled();
  });

  it('never fails when the error rate is 0', async () => {
    const options = { ...NO_SIMULATION, random: () => 0 };
    await expect(withSimulation(() => 'ok', options)).resolves.toBe('ok');
  });

  it('fails with a server error when the roll is under the rate, before running the action', async () => {
    const run = vi.fn(() => 'saved');
    const options = { ...NO_SIMULATION, errorRate: 0.5, random: sequence(0, 0, 0.9) };
    const error = await withSimulation(run, options).catch((caught: unknown) => caught);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ code: 'server' });
    expect(run).not.toHaveBeenCalled();
  });

  it('can fail as a network error', async () => {
    const options = { ...NO_SIMULATION, errorRate: 0.5, random: sequence(0, 0, 0.1) };
    await expect(withSimulation(() => 1, options)).rejects.toMatchObject({ code: 'network' });
  });

  it('succeeds when the roll is over the rate', async () => {
    const options = { ...NO_SIMULATION, errorRate: 0.5, random: sequence(0, 0.9) };
    await expect(withSimulation(() => 'ok', options)).resolves.toBe('ok');
  });

  it('passes on errors thrown by the action itself', async () => {
    await expect(
      withSimulation(() => {
        throw new Error('boom');
      }, NO_SIMULATION),
    ).rejects.toThrow('boom');
  });
});

describe('parseErrorRate', () => {
  it('reads a rate and clamps it to 0..1', () => {
    expect(parseErrorRate('0.3')).toBe(0.3);
    expect(parseErrorRate('5')).toBe(1);
    expect(parseErrorRate('-1')).toBe(0);
  });

  it('treats missing or invalid values as 0', () => {
    expect(parseErrorRate(undefined)).toBe(0);
    expect(parseErrorRate('')).toBe(0);
    expect(parseErrorRate('lots')).toBe(0);
  });
});

describe('getSimulationOptions', () => {
  it('is off in tests, whatever the error rate says', () => {
    expect(getSimulationOptions({ NODE_ENV: 'test', NEXT_PUBLIC_MOCK_ERROR_RATE: '1' })).toEqual(
      NO_SIMULATION,
    );
  });

  it('uses 300 to 800 ms and no errors by default in development', () => {
    expect(getSimulationOptions({ NODE_ENV: 'development' })).toEqual({
      minLatencyMs: 300,
      maxLatencyMs: 800,
      errorRate: 0,
    });
  });

  it('turns errors on only when the env variable asks for it', () => {
    const options = getSimulationOptions({
      NODE_ENV: 'development',
      NEXT_PUBLIC_MOCK_ERROR_RATE: '0.25',
    });
    expect(options.errorRate).toBe(0.25);
  });
});
