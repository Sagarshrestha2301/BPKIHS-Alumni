/** Home page copy. Marked placeholder until the Association approves its own wording. */
export const hero = {
  eyebrow: 'BPKIHS Alumni Association',
  title: 'Once BPKIHS, always BPKIHS',
  mission:
    'A network of BPKIHS graduates, in Nepal and abroad, who give back to the institute and look out for each other.',
  ctas: [
    { key: 'give', label: 'Give now', href: '/donate' },
    { key: 'find', label: 'Find alumni', href: '/directory' },
    { key: 'join', label: 'Join the network', href: '/register' },
  ],
} as const;

export const doors = {
  eyebrow: 'Get involved',
  title: 'Three ways to take part',
  description: 'Whatever brings you here, start with the one that fits.',
  items: [
    {
      key: 'give',
      title: 'Give',
      text: 'Back a fundraising goal or give to the general fund, and see how the money is used.',
      links: [{ label: 'See the goals', href: '/donate' }],
    },
    {
      key: 'network',
      title: 'Find and join alumni',
      text: 'Look up classmates by programme, batch or country, or add yourself to the directory.',
      links: [
        { label: 'Browse the directory', href: '/directory' },
        { label: 'Register as an alumnus', href: '/register' },
      ],
    },
    {
      key: 'events',
      title: 'Attend and read',
      text: 'Come to a reunion or webinar, and catch up on news and stories from the community.',
      links: [
        { label: 'See upcoming events', href: '/events' },
        { label: 'Read community news', href: '/community' },
      ],
    },
  ],
} as const;

export const featuredGoals = {
  eyebrow: 'Featured giving',
  title: 'Where your gift goes',
  description: 'Back a goal, or give where it is needed most.',
  allGoalsLabel: 'See all goals',
  allGoalsHref: '/donate',
} as const;

export const upcomingEvents = {
  eyebrow: 'Events',
  title: 'Upcoming events',
  description: 'Meet classmates and colleagues, in person or online.',
  allLabel: 'See all events',
  allHref: '/events',
} as const;

export const communityPosts = {
  eyebrow: 'Community',
  title: 'From the community',
  description: 'News, stories and achievements from fellow alumni.',
  allLabel: 'Read more posts',
  allHref: '/community',
} as const;
