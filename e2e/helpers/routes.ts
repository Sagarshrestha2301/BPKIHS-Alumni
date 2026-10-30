/**
 * Every public page a person can land on, in the order of the main navigation.
 *
 * Shared by the accessibility scan and the keyboard walk so the two cannot drift apart: a page
 * added to one is checked by the other.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/about/board',
  '/about/how-we-work',
  '/directory',
  /* The fixture member's public profile: the detail page gets the same two scans. */
  '/directory/alumnus-fixture-member',
  '/events',
  '/community',
  /* A fixture post: the detail page is public, so it gets the same two scans. */
  '/community/fixture-post-story',
  '/community/newsletter',
  /* Reached from the double opt-in email; without a token it shows the invalid-link state. */
  '/community/newsletter/confirm',
  '/donate',
  '/donate/transparency',
  '/donate/tribute',
  '/register',
  '/sign-in',
  '/support',
  '/support/faq',
  '/legal/privacy',
  '/legal/terms',
  '/legal/accessibility',
] as const;
