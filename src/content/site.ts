export type NavItem = { label: string; href: string };

export const site = {
  name: 'BPKIHS Alumni Association',
  instituteName: 'B.P. Koirala Institute of Health Sciences',
  instituteUrl: 'https://bpkihs.edu',
  copyrightYear: 2026,
  logo: { src: '/bp-koirala_logo.png', width: 335, height: 335 },
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
