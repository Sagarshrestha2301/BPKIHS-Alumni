import { ApiError } from '../errors';

export interface SimulationOptions {
  minLatencyMs: number;
  maxLatencyMs: number;
  /** 0 to 1. Chance that a call fails before doing anything. */
  errorRate: number;
  /** Injectable for tests. Defaults to Math.random. */
  random?: () => number;
  /** Injectable for tests. Defaults to setTimeout. */
  sleep?: (ms: number) => Promise<void>;
}

export const DEFAULT_SIMULATION: SimulationOptions = {
  minLatencyMs: 300,
  maxLatencyMs: 800,
  errorRate: 0,
};

export const NO_SIMULATION: SimulationOptions = { minLatencyMs: 0, maxLatencyMs: 0, errorRate: 0 };

/** Missing, invalid or out-of-range values become 0 or 1. */
export function parseErrorRate(value: string | undefined): number {
  if (!value) return 0;
  const rate = Number(value);
  if (!Number.isFinite(rate)) return 0;
  return Math.min(1, Math.max(0, rate));
}

/**
 * Tests (NODE_ENV=test) get no delay and no errors, so they never flake.
 * Otherwise: 300 to 800 ms latency, and errors only if NEXT_PUBLIC_MOCK_ERROR_RATE is set.
 */
export function getSimulationOptions(
  env: Record<string, string | undefined> = process.env,
): SimulationOptions {
  if (env.NODE_ENV === 'test') return NO_SIMULATION;
  return { ...DEFAULT_SIMULATION, errorRate: parseErrorRate(env.NEXT_PUBLIC_MOCK_ERROR_RATE) };
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wraps one mock call: wait, maybe fail, then run. The failure happens before `run`,
 * so a failed write never changes the in-memory data.
 */
export async function withSimulation<T>(
  run: () => T | Promise<T>,
  options: SimulationOptions = getSimulationOptions(),
): Promise<T> {
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;

  const span = Math.max(0, options.maxLatencyMs - options.minLatencyMs);
  const delay = Math.round(options.minLatencyMs + random() * span);
  if (delay > 0) await sleep(delay);

  if (options.errorRate > 0 && random() < options.errorRate) {
    if (random() < 0.5) {
      throw new ApiError('network', 'Could not reach the server. Check your connection and retry.');
    }
    throw new ApiError('server', 'Something went wrong on our side. Please try again.');
  }
  return run();
}
