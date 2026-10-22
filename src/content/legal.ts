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
      'This is a draft privacy policy for the new alumni website. It is written for review by the Association and its legal adviser before launch. It describes the information the site is designed to collect, not a final legal position.',
      'The site is currently a frontend demonstration. Form submissions go to sample data in the browser and are not sent to a live server.',
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
          'Until member sign-in exists, “alumni only” is treated like hidden on the public site. The Association can still see the full record for verification.',
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
          'The demonstration site does not use advertising cookies or third-party analytics. A production site may use essential cookies for sign-in and a privacy-respecting analytics tool; this policy will be updated before that happens.',
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
      'The rules for using the BPKIHS Alumni Association website, including the directory, community posts and demonstration payments.',
    updated: '12 October 2026',
    intro: [
      'This is a draft terms of use for review by the Association and its legal adviser. By using the site, you agree to these terms.',
      'The site is a frontend demonstration. Payment screens do not take money and no real receipt is issued.',
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
          'In this demonstration, donation forms do not process payments and no funds are transferred. When real payments are enabled, the payment provider’s terms and the Association’s receipt policy will apply.',
          'Tribute messages are reviewed before they appear on the public wall.',
        ],
      },
      {
        id: 'accounts',
        title: 'Accounts and sign-in',
        paragraphs: [
          'Sign-in is currently required only for the donation receipt step and uses a demonstration account in memory. Do not reuse a real password, because the demonstration does not store or check passwords.',
        ],
      },
      {
        id: 'liability',
        title: 'Availability and liability',
        paragraphs: [
          'The site is provided as-is while it is being built. The Association does not promise uninterrupted availability and is not liable for indirect loss arising from use of the demonstration.',
          'Nothing in these terms limits rights that cannot be limited by law.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes',
        paragraphs: [
          'These terms may change as the site moves from demonstration to production. The updated date at the top of this page will change when they do.',
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
      'This statement describes the current build. It is a draft and will be updated after the accessibility review at the end of the project.',
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
          'The site has not yet had a full screen-reader review or an independent audit. Some placeholder images and sample content may need better descriptions when real content arrives. The photo upload control is disabled in this build.',
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
