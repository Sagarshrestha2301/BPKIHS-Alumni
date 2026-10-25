/** About and How we work copy. Draft wording, pending approval by the Association and BPKIHS. */
export const aboutPage = {
  title: 'About the Association',
  description:
    'Who we are, what we do, and how the Association connects BPKIHS alumni with the institute and with each other.',
  mission: {
    title: 'Our mission',
    text: 'To keep BPKIHS graduates connected, to support the institute that trained them, and to help each new generation of health professionals get a good start.',
  },
  vision: {
    title: 'Our vision',
    text: 'A lifelong, worldwide community of BPKIHS alumni who look out for one another and give back to Nepal health care.',
  },
  whatWeDo: {
    eyebrow: 'What we do',
    title: 'What the Association does',
    items: [
      {
        key: 'connect',
        title: 'Connect alumni',
        text: 'A searchable directory and regular events help classmates and colleagues find each other, in Nepal and abroad.',
      },
      {
        key: 'support',
        title: 'Support the institute',
        text: 'We raise funds for named goals agreed with BPKIHS and report openly on how the money is used.',
      },
      {
        key: 'celebrate',
        title: 'Celebrate achievements',
        text: 'News, stories and awards from the community are shared so that good work is seen.',
      },
      {
        key: 'mentor',
        title: 'Mentor new graduates',
        text: 'Experienced alumni offer advice on careers, further study and working abroad.',
      },
    ],
  },
  timeline: {
    eyebrow: 'Our story',
    title: 'Our story',
    items: [
      {
        key: 'founding',
        when: 'The beginning',
        title: 'The institute opens its doors',
        text: 'The first students arrive and the alumni story begins.',
      },
      {
        key: 'first-batches',
        when: 'The first batches',
        title: 'Graduates spread across Nepal',
        text: 'Early graduates take up posts in hospitals and health posts around the country.',
      },
      {
        key: 'network',
        when: 'A growing network',
        title: 'Alumni start to organise',
        text: 'Reunions and informal groups grow into a formal Association.',
      },
      {
        key: 'today',
        when: 'Today',
        title: 'One home online',
        text: 'This website gives every alumnus one place to find classmates, give and take part.',
      },
    ],
  },
  institute: {
    title: 'Our home institute',
    text: 'The B.P. Koirala Institute of Health Sciences is where our story starts. Visit the institute for its programmes, news and campus life.',
    linkLabel: 'Visit bpkihs.edu',
  },
  draftNote: 'Draft wording, pending approval by the Association.',
} as const;

export const howWeWork = {
  title: 'How we work with BPKIHS',
  description:
    'A short guide to how the Association and the institute relate, how decisions are made and how funds are handled.',
  draftNote: 'Draft wording, pending review by the Association and BPKIHS.',
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
        'The transparency page shows how the money raised is divided and spent, and donors receive a receipt by email.',
      ],
    },
    {
      value: 'involved',
      question: 'How can alumni get involved?',
      answer: [
        'Register in the alumni directory, give to a goal, come to an event, or share an update with the community. You can also offer to mentor a recent graduate.',
      ],
    },
  ],
  faqLabel: 'Still have a question? Visit the FAQ',
  faqHref: '/support/faq',
} as const;
