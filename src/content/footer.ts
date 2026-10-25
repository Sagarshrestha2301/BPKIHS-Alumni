import type { NavItem } from './site';

export type FooterGroup = { title: string; links: readonly NavItem[] };

export const footerGroups: readonly FooterGroup[] = [
  {
    title: 'About the Association',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Our board', href: '/about/board' },
      { label: 'How we work with BPKIHS', href: '/about/how-we-work' },
    ],
  },
  {
    title: 'Get involved',
    links: [
      { label: 'Register as alumni', href: '/register' },
      { label: 'Sign in', href: '/sign-in' },
      { label: 'Alumni directory', href: '/directory' },
      { label: 'Donate', href: '/donate' },
      { label: 'Events', href: '/events' },
      { label: 'Community', href: '/community' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact and helpdesk', href: '/support' },
      { label: 'FAQ', href: '/support/faq' },
      { label: 'Newsletter', href: '/community/newsletter' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Accessibility', href: '/legal/accessibility' },
    ],
  },
];

export const legalNav: readonly NavItem[] = footerGroups[3]?.links ?? [];

export const footerAddress = 'Dharan, Koshi Province, Nepal';
