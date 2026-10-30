/** About and How we work copy. Institute facts come from the official BPKIHS site. */
export const aboutPage = {
  title: 'About the Association',
  description:
    'Who we are, what we do, and how the Association connects BPKIHS alumni with the institute and with each other.',
  mission: {
    title: 'Why we are here',
    text: 'The Association brings BPKIHS graduates together, keeps a link with the institute and creates practical ways for alumni to take part.',
  },
  vision: {
    title: 'What we hope to build',
    text: 'A connected alumni network where graduates can find one another, share experience and support work at BPKIHS.',
  },
  whatWeDo: {
    eyebrow: 'What we do',
    title: 'What the Association does',
    items: [
      {
        key: 'connect',
        title: 'Connect alumni',
        text: 'The directory and events give classmates a way to reconnect, whether they are in Nepal or further afield.',
      },
      {
        key: 'support',
        title: 'Support the institute',
        text: 'The giving pages list the goals currently open for support and the figures recorded by the Association.',
      },
      {
        key: 'celebrate',
        title: 'Celebrate achievements',
        text: 'Alumni and Association updates can be shared on the community page.',
      },
      {
        key: 'mentor',
        title: 'Mentor new graduates',
        text: 'Alumni can share advice on clinical work, further study and career choices with recent graduates.',
      },
    ],
  },
  institute: {
    title: 'Our home institute',
    text: 'The B.P. Koirala Institute of Health Sciences is where our story starts. Established in 1993 and made an autonomous health sciences university in 1998, BPKIHS teaches medicine, dentistry, nursing and public health from its campus in Dharan, and its 700-bed Central Teaching Hospital cares for the eastern region. Every alumnus in this Association graduated from here.',
    linkLabel: 'Visit bpkihs.edu',
  },
} as const;

export const howWeWork = {
  title: 'How we work with BPKIHS',
  description:
    'A short guide to how the Association and the institute relate, how decisions are made and how funds are handled.',
  items: [
    {
      value: 'relationship',
      question: 'What is the relationship between the Association and BPKIHS?',
      answer: [
        'The Association is an alumni body that works alongside the institute. It supports BPKIHS but does not run it, and it keeps its own board, records and accounts.',
        'Shared projects are agreed with the institute before any fundraising for them begins.',
      ],
    },
    {
      value: 'decisions',
      question: 'How are decisions made?',
      answer: [
        'The elected board sets priorities and approves each fundraising goal. Major decisions are shared with members through the community page and the newsletter.',
        'Current and past board members are listed on the board page.',
      ],
    },
    {
      value: 'funds',
      question: 'How are donated funds handled?',
      answer: [
        'Every donation is tied to a named goal or to the general fund. Each goal shows its target and its progress in public.',
        'The transparency page shows the totals and allocation plan recorded on this site. Donors receive an email receipt after the payment provider confirms the gift.',
      ],
    },
    {
      value: 'involved',
      question: 'How can alumni get involved?',
      answer: [
        'Add a directory profile, support a listed goal, attend an event or send the Association a community update. You can also contact us about mentoring.',
      ],
    },
  ],
  faqLabel: 'Still have a question? Visit the FAQ',
  faqHref: '/support/faq',
} as const;
