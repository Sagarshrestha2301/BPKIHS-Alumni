/** Home page copy; the Association can revise it in the content manager as its priorities change. */
export const hero = {
  eyebrow: 'BPKIHS Alumni Association',
  /** Devanagari companion to the eyebrow. Factual place names only, so it is safe copy that needs no sign-off. */
  locationNe: 'धरान, नेपाल',
  title: 'Connected by BPKIHS. Wherever life takes us.',
  mission:
    'A place to find old classmates, hear what alumni are doing and stay connected with the institute in Dharan.',
  ctas: [
    { key: 'give', label: 'Give now', href: '/donate' },
    { key: 'find', label: 'Find alumni', href: '/directory' },
    { key: 'join', label: 'Join the network', href: '/register' },
  ],
  /**
   * The institute's own campus photograph from bpkihs.edu : the hospital building, its
   * courtyard tree and the same wide steps alumni walked down. The institute publishes it at
   * 520×320 only, so the file is centre-cropped to 2:1 and scaled up with a soft kernel; the
   * navy wash keeps the softness from reading. When the communications office supplies the
   * original at a higher resolution, replace the file and keep the credit below.
   */
  image: {
    src: '/hero-bpkihs-campus.jpg',
    alt: 'The BPKIHS hospital building in Dharan, with its courtyard tree and the road in front',
    credit: 'Photo: B.P. Koirala Institute of Health Sciences, Dharan (bpkihs.edu)',
    creditHref: 'https://bpkihs.edu/',
  },
} as const;

export const doors = {
  eyebrow: 'Stay in touch',
  title: 'A network that travels with you',
  description:
    'Whether you are nearby or working abroad, there are a few easy ways to stay part of BPKIHS.',
  items: [
    {
      key: 'give',
      title: 'Support a current goal',
      text: 'Read what the Association is raising funds for, then choose whether to contribute.',
      links: [{ label: 'See the goals', href: '/donate' }],
    },
    {
      key: 'network',
      title: 'Find a classmate',
      text: 'Look up alumni by programme, graduating batch or country. Add your profile if you are not listed.',
      links: [
        { label: 'Browse the directory', href: '/directory' },
        { label: 'Register as an alumnus', href: '/register' },
      ],
    },
    {
      key: 'events',
      title: 'Meet up and catch up',
      text: 'See upcoming gatherings and read news shared by alumni and the Association.',
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
  eyebrow: 'Alumni news',
  title: 'What classmates are up to',
  description: 'Notes, milestones and news shared by BPKIHS graduates.',
  /** Editorial fallbacks keep the first two news cards visual until authors add their own photos. */
  fallbackImageUrls: [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1200&q=80',
  ],
  allLabel: 'Read more posts',
  allHref: '/community',
} as const;

export const welcomeSection = {
  eyebrow: 'A word from us',
  title: 'A message from the Association',
} as const;

export const noticeBoard = {
  eyebrow: 'Notices',
  title: 'Notice board',
  /** Devanagari companion, after the government notice boards the panel imitates. */
  titleNe: 'सूचना',
  /** The floating button that reopens the panel after it has been dismissed. */
  openLabel: 'Notices',
  closeLabel: 'Dismiss the notice board',
  popupTitle: 'Latest notice',
  popupCloseLabel: 'Dismiss this notice',
  readLabel: 'Read the notice',
  allLabel: 'All posts',
  allHref: '/community',
} as const;

export const boardPreview = {
  eyebrow: 'Leadership',
  title: 'Meet the board',
  description: 'Alumni who give their time to run the Association.',
  allLabel: 'Meet the full board',
  allHref: '/about/board',
} as const;
