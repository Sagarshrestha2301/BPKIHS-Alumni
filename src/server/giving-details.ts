import 'server-only';

export interface ReceiptDetail {
  key: 'registration' | 'pan';
  value: string;
}

export interface OfflineGiving {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  /** Someone to tell when a gift has been made by bank or cheque. */
  contactEmail?: string;
}

/**
 * The Association's legal identifiers, printed on receipts and inside the checkout. Like
 * [`contact.ts`](./contact.ts), every value comes from the environment; a missing value is
 * simply not rendered, and production keeps no placeholder numbers in the markup.
 *
 * Set `ASSOCIATION_REGISTRATION_NUMBER` and `ASSOCIATION_PAN` once the office provides them.
 */
export function receiptDetails(): ReceiptDetail[] {
  const registration = process.env.ASSOCIATION_REGISTRATION_NUMBER?.trim();
  const pan = process.env.ASSOCIATION_PAN?.trim();

  const details: ReceiptDetail[] = [];
  if (registration) details.push({ key: 'registration', value: registration });
  if (pan) details.push({ key: 'pan', value: pan });
  return details;
}

/**
 * How a donor can give from their bank instead of a wallet, shown on /donate only when the
 * office has configured an account. Blank section is better than a fake account number.
 */
export function offlineGiving(): OfflineGiving {
  return {
    bankName: process.env.BANK_NAME?.trim() || undefined,
    accountName: process.env.BANK_ACCOUNT_NAME?.trim() || undefined,
    accountNumber: process.env.BANK_ACCOUNT_NUMBER?.trim() || undefined,
    contactEmail: process.env.CONTACT_EMAIL?.trim() || undefined,
  };
}
