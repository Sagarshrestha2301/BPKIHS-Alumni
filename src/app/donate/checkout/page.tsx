import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { donateCheckoutPage } from '@/content/donate';
import { CheckoutExperience } from '@/features/donations/checkout-experience';
import { getGoalById } from '@/features/donations/get-donate-data';
import type { TributeInput } from '@/lib/api/schemas';
import {
  MAX_DONATION_MINOR,
  MIN_DONATION_MINOR,
  RECIPIENT_KINDS,
  TRIBUTE_TYPES,
} from '@/lib/constants/domain';
import { availablePaymentMethods } from '@/server/payments';

export const metadata: Metadata = {
  title: donateCheckoutPage.title,
  description: donateCheckoutPage.description,
  alternates: { canonical: '/donate/checkout' },
  robots: { index: false, follow: false },
};

/**
 * The goal, amount and tribute all arrive in the query string; there is no meaningful shell to
 * show before they are read. Blocking is deliberate, not an unoptimised page.
 */
export const instant = false;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseAmount(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 500_000;
  const minor = Math.round(parsed * 100);
  return minor >= MIN_DONATION_MINOR && minor <= MAX_DONATION_MINOR ? minor : 500_000;
}

function parseTribute(params: SearchParams): TributeInput | undefined {
  const type = first(params.tributeType);
  const recipientKind = first(params.tributeKind);
  const name = first(params.tributeName)?.trim();
  if (!type || !recipientKind || !name) return undefined;
  if (!TRIBUTE_TYPES.includes(type as (typeof TRIBUTE_TYPES)[number])) return undefined;
  if (!RECIPIENT_KINDS.includes(recipientKind as (typeof RECIPIENT_KINDS)[number]))
    return undefined;

  const message = first(params.tributeMessage)?.trim();
  const notifyEmail = first(params.tributeNotify)?.trim();
  return {
    type: type as TributeInput['type'],
    recipientKind: recipientKind as TributeInput['recipientKind'],
    name,
    ...(message ? { message } : {}),
    ...(notifyEmail ? { notifyEmail } : {}),
  };
}

export default async function DonateCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const goal = await getGoalById(first(params.goal));
  if (!goal) notFound();

  // Only gateways whose adapter exists and whose credentials are configured are offered; the
  // list is computed on the server so a missing key never becomes a dead option in the browser.
  const methods = availablePaymentMethods();

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Donate', href: '/donate' }, { label: donateCheckoutPage.title }]}
        title={donateCheckoutPage.title}
        description={donateCheckoutPage.description}
      />
      <Section>
        <CheckoutExperience
          goal={goal}
          initialAmountMinor={parseAmount(first(params.amount))}
          tribute={parseTribute(params)}
          methods={methods}
        />
      </Section>
    </>
  );
}
