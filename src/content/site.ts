export type NavItem = { label: string; href: string };

export const site = {
  name: 'BPKIHS Alumni Association',
  /** One sentence for places that take a single line: the manifest and the default meta description. */
  tagline:
    'The lifelong network of B.P. Koirala Institute of Health Sciences alumni. Find fellow alumni, give back and join events.',
  instituteName: 'B.P. Koirala Institute of Health Sciences',
  instituteUrl: 'https://bpkihs.edu',
  copyrightYear: 2026,
  logo: { src: '/bp-koirala_logo.png', width: 335, height: 335 },
  /** The Association is based in Nepal, so events default to it in structured data. */
  country: 'Nepal',
  countryCode: 'NP',
} as const;

export const mainNav: readonly NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Directory', href: '/directory' },
  { label: 'Events', href: '/events' },
  { label: 'Community', href: '/community' },
  { label: 'Support', href: '/support' },
];

export const utilityNav: readonly NavItem[] = [
  { label: 'Contact', href: '/support' },
  { label: 'FAQ', href: '/support/faq' },
];

/** Where the utility bar sends a visitor who is not signed in. */
export const signInHref = '/sign-in';
export const signInLabel = 'Sign in';
