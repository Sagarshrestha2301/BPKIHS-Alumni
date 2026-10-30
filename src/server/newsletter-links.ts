import { appUrl } from './http/app-url';

/**
 * The tokenised links that make a newsletter subscription provable.
 *
 * The token is a random UUID stored beside the subscriber; it is the only thing that lets a
 * link change that subscription, which is why an email address can never be enough on its own.
 * Both links are built in one place so the services and the emails cannot drift apart.
 */
export function unsubscribeUrl(token: string): string {
  return `${appUrl()}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * The confirmation link in the double opt-in email. It lands on a page with a button rather
 * than confirming on GET, so an email client that pre-fetches links cannot subscribe anyone.
 */
export function confirmUrl(token: string): string {
  return `${appUrl()}/community/newsletter/confirm?token=${encodeURIComponent(token)}`;
}
