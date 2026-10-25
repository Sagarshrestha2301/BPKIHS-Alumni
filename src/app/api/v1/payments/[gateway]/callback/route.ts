import { NextResponse } from 'next/server';

import { appUrl } from '@/server/http/app-url';
import { completeDonation } from '@/server/payments/complete';
import { esewaGateway } from '@/server/payments/esewa';
import { khaltiGateway } from '@/server/payments/khalti';
import type { PaymentGateway } from '@/server/payments/types';

function thankYou(params: Record<string, string>): NextResponse {
  const url = new URL(`/donate/thank-you?${new URLSearchParams(params).toString()}`, appUrl());
  return NextResponse.redirect(url, 303);
}

async function handleGateway(gatewayName: string, request: Request): Promise<NextResponse> {
  const gateways: Record<string, PaymentGateway | undefined> = {
    esewa: esewaGateway,
    khalti: khaltiGateway,
  };
  const gateway = gateways[gatewayName];
  if (!gateway) {
    return thankYou({ status: 'failed' });
  }

  try {
    const verification = await gateway.verify(new URL(request.url).searchParams);
    const completed = await completeDonation(verification, gatewayName as 'esewa' | 'khalti');
    return thankYou({
      id: completed.donationId,
      status: completed.status,
      amount: String(completed.amountMinor),
      method: completed.method,
      ...(completed.goalTitle ? { goal: completed.goalTitle } : {}),
    });
  } catch (error) {
    console.error('[payments] callback failed', gatewayName, error);
    return thankYou({ status: 'failed' });
  }
}

export async function GET(request: Request, context: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await context.params;
  return handleGateway(gateway, request);
}

export async function POST(request: Request, context: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await context.params;
  return handleGateway(gateway, request);
}
