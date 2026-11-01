export const supportPage = {
  title: 'Support',
  description:
    'Questions about your profile, a donation receipt or the Association? Contact the office or send a message through the helpdesk.',
  contactTitle: 'Contact the Association',
  contactNote: 'Reach the Association office using these details.',
  contactLabels: {
    email: 'Email',
    phone: 'Phone',
    address: 'Office',
    hours: 'Office hours',
  },
  responseNote:
    'We aim to reply within two working days. Include your donation reference if your question is about a gift.',
  helpdeskTitle: 'Send a message',
  helpdeskDescription:
    'Choose a topic so the message reaches the right person. We reply to the email you give us.',
  sendingAs: 'Sending as',
  signInPrompt: {
    title: 'Sign in to send your message',
    text: 'Your message is saved. Sign in with your member account so the Association knows who to reply to. The form will be waiting when you return. Or create an account; it takes a minute.',
    signIn: 'Sign in',
    register: 'Create an account',
    keepEditing: 'Keep editing',
  },
  draftRestored: 'Welcome back. Your message was kept. Check it, then press Send message.',
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
} as const;
