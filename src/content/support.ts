export const supportPage = {
  title: 'Support',
  description:
    'Questions about your profile, a donation receipt or the Association? Contact the office or send a message through the helpdesk.',
  contactTitle: 'Contact the Association',
  contactNote: 'These contact details are placeholders until the Association supplies its own.',
  contacts: [
    {
      key: 'email',
      label: 'Email',
      value: 'support@bpkihs-alumni.example',
      href: 'mailto:support@bpkihs-alumni.example',
    },
    {
      key: 'phone',
      label: 'Phone',
      value: '+977 98XXXXXXXX',
      href: 'tel:+9779800000000',
    },
    {
      key: 'address',
      label: 'Office',
      value: 'BPKIHS Alumni Association, Dharan, Koshi Province, Nepal',
    },
    {
      key: 'hours',
      label: 'Office hours',
      value: 'Sunday to Friday, 10:00 to 17:00 (Nepal time)',
    },
  ] as const,
  responseNote:
    'We aim to reply within two working days. Include your donation reference if your question is about a gift.',
  helpdeskTitle: 'Send a message',
  helpdeskDescription:
    'Choose a topic so the message reaches the right person. You do not need an account.',
  fields: {
    topic: 'Topic',
    name: 'Full name',
    email: 'Email address',
    subject: 'Subject',
    message: 'Message',
  },
  topics: {
    account: 'Account or sign-in',
    profile_verification: 'Profile verification',
    donation_receipt: 'Donation receipt',
    general: 'General enquiry',
  } as const,
  button: 'Send message',
  submitting: 'Sending…',
  success: {
    title: 'Thank you. Your message has been received.',
    body: 'The Association will reply to the email address you gave. Keep your ticket reference for follow-up.',
    reference: 'Ticket reference',
  },
  error: 'We could not send your message. Please check the form and try again.',
  faqCta: 'Read the FAQ first',
} as const;

export const faqPage = {
  title: 'Frequently asked questions',
  description:
    'Short answers about registration, privacy, giving, events and using the alumni network.',
  searchLabel: 'Search the FAQ',
  searchPlaceholder: 'Search a question or a topic',
  categoriesLabel: 'Categories',
  all: 'All',
  empty: 'No questions match this search.',
  stillNeedHelp: 'Still need help?',
  contactCta: 'Contact the Association',
  sample: 'Sample answers. The Association will replace them with its own wording.',
} as const;
