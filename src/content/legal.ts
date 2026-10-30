export type LegalSection = {
  id: string;
  title: string;
  paragraphs: readonly string[];
};

export type LegalDocument = {
  slug: 'privacy' | 'terms' | 'accessibility';
  title: string;
  description: string;
  updated: string;
  intro: readonly string[];
  sections: readonly LegalSection[];
};

export const legalDocuments: Record<LegalDocument['slug'], LegalDocument> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy policy',
    description:
      'What the BPKIHS Alumni Association collects, why it collects it, and the choices alumni have about their information.',
    updated: '12 October 2026',
    intro: [
      'This policy explains what the BPKIHS Alumni Association collects through this website, why it collects it, and the choices alumni have about their information.',
      'Information you submit is stored in the Association’s database. Registrations, messages, event RSVPs and donation records reach the Association.',
    ],
    sections: [
      {
        id: 'what-we-collect',
        title: 'What we collect',
        paragraphs: [
          'Registration collects your name, programme, batch year, country, city, current position, organisation, further studies, an optional note and an optional photo. Email is required; phone is optional.',
          'Support messages collect your name, email, topic and message. Newsletter sign-up collects your email and the topics you choose. Event RSVPs collect your name, email, optional phone and party size.',
        ],
      },
      {
        id: 'why',
        title: 'Why we collect it',
        paragraphs: [
          'To verify that you are a BPKIHS alumnus, to list you in the directory if you choose to be listed, to send event details and receipts, and to answer support requests.',
          'Aggregate figures such as the number of registered alumni and funds raised may be shown publicly. Individual contact details are not included in those figures.',
        ],
      },
      {
        id: 'visibility',
        title: 'Who can see your profile',
        paragraphs: [
          'You choose the visibility of your email, phone and profile separately: public, alumni only or hidden. Hidden details are never returned by the public site.',
          '“Alumni only” information is not shown on the public directory or profile pages. Your account page shows your own details, and the Association can see the full record for verification.',
          'A profile photo is optional and has its own consent. If you upload one, it follows your profile visibility, is resized and stored without its location metadata, and is deleted when you remove it from your account. You can withdraw photo consent at any time by removing the photo.',
        ],
      },
      {
        id: 'sharing',
        title: 'Sharing and retention',
        paragraphs: [
          'The Association does not sell alumni data. Information is shared only with service providers needed to run the site, such as hosting, email and payment providers, and only for that purpose.',
          'Records are kept while you remain registered and for the period the Association needs to meet its legal and accounting duties. You may ask for your profile to be corrected or removed.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies and analytics',
        paragraphs: [
          'The site uses essential cookies only: a session cookie when you sign in, and the security cookie Better Auth needs to protect that session. It does not use advertising cookies or third-party analytics.',
        ],
      },
      {
        id: 'rights',
        title: 'Your choices',
        paragraphs: [
          'You can change what is visible on your profile, unsubscribe from the newsletter, or ask the Association to correct or delete your record. Contact the office using the details on the support page.',
        ],
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of use',
    description:
      'The rules for using the BPKIHS Alumni Association website, including the directory, community posts and donations.',
    updated: '12 October 2026',
    intro: [
      'These terms apply to the BPKIHS Alumni Association website. By using the site, you agree to them.',
      'The site is operated by the Association for BPKIHS alumni and supporters. It is not an official service of BPKIHS itself.',
    ],
    sections: [
      {
        id: 'use',
        title: 'Using the site',
        paragraphs: [
          'Use the site lawfully and respectfully. Do not attempt to access another person’s data, disrupt the service, or scrape the directory for advertising or bulk contact.',
          'You are responsible for the accuracy of the information you submit and for keeping your contact details current.',
        ],
      },
      {
        id: 'directory',
        title: 'Directory and community content',
        paragraphs: [
          'Directory profiles are reviewed before they are listed. Community posts are moderated. The Association may edit or remove content that is inaccurate, abusive, commercial spam or inappropriate for the alumni network.',
          'Opinions in member posts are those of the author, not of the Association or BPKIHS.',
        ],
      },
      {
        id: 'donations',
        title: 'Donations',
        paragraphs: [
          'Donations are processed by eSewa or Khalti. A gift is recorded only after the provider confirms the payment, and the provider’s terms also apply to that transaction.',
          'Write to the Association through the support page if you need a receipt corrected, have a question about a gift, or believe a payment was taken in error. Tribute messages are reviewed before they appear on the public wall.',
        ],
      },
      {
        id: 'accounts',
        title: 'Accounts and sign-in',
        paragraphs: [
          'An account is needed only to receive a donation receipt and to use the admin dashboard. Passwords are stored as salted hashes, never as plain text. Use a unique password and contact the Association if you believe an account has been compromised.',
        ],
      },
      {
        id: 'liability',
        title: 'Availability and liability',
        paragraphs: [
          'The Association aims to keep the site available and accurate but does not promise uninterrupted service. It is not liable for indirect loss arising from use of the site, to the extent the law allows.',
          'Nothing in these terms limits rights that cannot be limited by law.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes',
        paragraphs: [
          'These terms may change as the Association’s services develop. The updated date at the top of this page changes when they do.',
        ],
      },
    ],
  },
  accessibility: {
    slug: 'accessibility',
    title: 'Accessibility statement',
    description:
      'How the BPKIHS Alumni Association website aims to meet WCAG 2.2 AA, what is known to be incomplete, and how to report a barrier.',
    updated: '12 October 2026',
    intro: [
      'The Association wants every alumnus to be able to use this site, including people who use a keyboard, a screen reader, magnification or reduced motion.',
      'This statement describes the current site and the accessibility work still planned.',
    ],
    sections: [
      {
        id: 'standard',
        title: 'Our target',
        paragraphs: [
          'The site aims to meet WCAG 2.2 level AA. That includes text contrast, visible focus, labels for every form field, meaningful link text, touch targets of at least 44 by 44 pixels, and no information conveyed by colour alone.',
        ],
      },
      {
        id: 'done',
        title: 'What is in place',
        paragraphs: [
          'Pages use one main landmark, a skip link, a logical heading order and a visible focus ring. Forms show inline errors linked to their fields and move focus to the first problem. Lists, tables and progress bars have text alternatives.',
          'The site respects reduced-motion settings and does not autoplay media.',
        ],
      },
      {
        id: 'known',
        title: 'Known gaps',
        paragraphs: [
          'The site has not yet had a full screen-reader review or an independent audit. Some images supplied by the Association may need better descriptions. Photos uploaded by members can be added and removed from the profile editor.',
        ],
      },
      {
        id: 'feedback',
        title: 'Report a barrier',
        paragraphs: [
          'If something is difficult to use, contact the Association through the support page and say which page and what happened. Please include the browser or assistive technology you used if you can.',
        ],
      },
    ],
  },
};
