import type { FaqItem } from '@/lib/api/types';

/** Placeholder answers. Real answers wait on the Association (Open Question Q8). */
export const faqSeed: FaqItem[] = [
  {
    id: 'faq-who-can-join',
    category: 'Membership',
    question: 'Who can register as an alumnus?',
    answer:
      'Anyone who completed a programme at BPKIHS, from MBBS and nursing to MD/MS, MSc, BMIT and fellowships. Registration is free. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-approval-time',
    category: 'Membership',
    question: 'How long does approval take?',
    answer:
      'Most registrations are reviewed within a few working days. You will get an email once your profile is approved. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-privacy-profile',
    category: 'Privacy',
    question: 'Who can see my profile?',
    answer:
      'You choose. For your email, phone number and profile you can pick public, alumni only or hidden. Hidden details are never shown. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-edit-remove',
    category: 'Privacy',
    question: 'How do I change or remove my details?',
    answer:
      'Write to the Association office from the email you registered with and we will update or remove your profile. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-where-money-goes',
    category: 'Giving',
    question: 'Where does my donation go?',
    answer:
      'To the goal you choose, or to the general fund if you do not choose one. The transparency page shows how funds are used. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-receipt',
    category: 'Giving',
    question: 'Will I get a receipt?',
    answer:
      'Yes. A receipt is sent to the email address you give when you donate. If it does not arrive, contact support with your donation reference. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-anonymous',
    category: 'Giving',
    question: 'Can I give anonymously?',
    answer:
      'Yes. Choose the anonymous option at checkout and your name will not appear on the public list of supporters. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-rsvp',
    category: 'Events',
    question: 'Do I need an account to RSVP?',
    answer:
      'No. Fill in your name and email on the event page. If an event is full you can join the waitlist. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-share-update',
    category: 'Community',
    question: 'How do I share my news with other alumni?',
    answer:
      'Use the Share an update form on the community page. Posts are reviewed before they appear, usually within a few days. Sample answer.',
    placeholder: true,
  },
  {
    id: 'faq-contact',
    category: 'Support',
    question: 'How can I contact the Association?',
    answer:
      'Use the helpdesk form on the support page and choose the topic that fits best. We aim to reply within two working days. Sample answer.',
    placeholder: true,
  },
];
