import 'server-only';

import { footerAddress } from '@/content/footer';

export type ContactKey = 'email' | 'phone' | 'address' | 'hours';

export interface ContactDetail {
  key: ContactKey;
  value: string;
  href?: string;
}

/**
 * Office contact details come from the environment so the deployed site never shows a
 * placeholder address or phone number. A missing value is simply not rendered; production
 * startup requires an email address (see `src/server/env.ts`).
 */
export function contactDetails(): ContactDetail[] {
  const email = process.env.CONTACT_EMAIL?.trim();
  const phone = process.env.CONTACT_PHONE?.trim();
  const hours = process.env.CONTACT_HOURS?.trim();
  const address = process.env.CONTACT_ADDRESS?.trim() || footerAddress;

  const details: ContactDetail[] = [];
  if (email) details.push({ key: 'email', value: email, href: `mailto:${email}` });
  if (phone) {
    details.push({
      key: 'phone',
      value: phone,
      href: `tel:${phone.replace(/[^\d+]/g, '')}`,
    });
  }
  details.push({ key: 'address', value: address });
  if (hours) details.push({ key: 'hours', value: hours });
  return details;
}
