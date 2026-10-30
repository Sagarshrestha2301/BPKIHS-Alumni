import { db } from '../db/client';
import { gatewayChecks } from '../db/schema';
import type { PaymentGatewayId } from '../payments/types';

export type GatewayCheckStatus = 'passed' | 'failed' | 'blocked';

export interface GatewayCheck {
  gateway: PaymentGatewayId;
  status: GatewayCheckStatus;
  /** Payment mode when the check ran, or `unset` when it stopped before reading one. */
  mode: string;
  detail: string;
  checkedAt: string;
}

/** The last recorded check for every gateway that has one. */
export async function listGatewayChecks(): Promise<GatewayCheck[]> {
  const rows = await db.select().from(gatewayChecks);
  return rows.map((row) => ({
    gateway: row.gateway as PaymentGatewayId,
    status: row.status,
    mode: row.mode,
    detail: row.detail,
    checkedAt: row.checkedAt.toISOString(),
  }));
}

/**
 * Records the outcome of an acceptance run. One row per gateway: a later run replaces the
 * previous result, because the dashboard shows the current state, not a history.
 */
export async function recordGatewayCheck(input: {
  gateway: PaymentGatewayId;
  status: GatewayCheckStatus;
  mode: string;
  detail: string;
}): Promise<void> {
  const checkedAt = new Date();
  const values = {
    gateway: input.gateway,
    status: input.status,
    mode: input.mode.slice(0, 20),
    detail: input.detail.slice(0, 1000),
    checkedAt,
  };

  await db
    .insert(gatewayChecks)
    .values(values)
    .onConflictDoUpdate({
      target: gatewayChecks.gateway,
      set: {
        status: values.status,
        mode: values.mode,
        detail: values.detail,
        checkedAt: values.checkedAt,
      },
    });
}
