export const registerPage = {
  title: 'Register as an alumnus',
  description:
    'Add yourself to the BPKIHS alumni directory. Registration is free, takes about five minutes, and every profile is reviewed before it appears.',
  intro:
    'This form is for BPKIHS graduates and former residents. The Association reviews each profile before it is listed, so the directory stays accurate and no one is added without their consent.',
  reviewNote:
    'Profiles are reviewed by the Association before they appear in the directory. You will receive an email when your profile is approved.',
  fields: {
    fullName: { label: 'Full name', hint: 'Use the name you were known by at BPKIHS.' },
    programme: { label: 'Programme', placeholder: 'Choose your programme' },
    batchYear: {
      label: 'Batch year',
      hint: 'The year you graduated or completed your programme.',
      placeholder: 'For example 2012',
    },
    country: { label: 'Country', placeholder: 'Choose your country' },
    countryOther: { label: 'Country name', placeholder: 'Enter your country' },
    city: { label: 'City', placeholder: 'For example Kathmandu' },
    currentPosition: { label: 'Current position', placeholder: 'For example Consultant Physician' },
    organisation: {
      label: 'Organisation',
      placeholder: 'Hospital, university or practice',
    },
    furtherStudies: {
      label: 'Further studies',
      placeholder: 'For example MD Internal Medicine, AIIMS',
      hint: 'Optional. Include the qualification and the institution.',
    },
    note: {
      label: 'A note for fellow alumni',
      placeholder: 'What would you like the alumni network to know?',
      hint: 'Optional. Up to 500 characters.',
    },
    photo: {
      label: 'Profile photo',
      hint: 'Photo upload is not connected yet. Your profile will use your initials until it is.',
    },
    email: {
      label: 'Email address',
      hint: 'Required. Used for verification and your donation receipts; hidden unless you make it public.',
    },
    phone: {
      label: 'Phone number',
      placeholder: '+977 98XXXXXXXX',
      hint: 'Optional. Hidden unless you make it public.',
    },
  },
  privacy: {
    legend: 'What others can see',
    intro:
      'You control each item separately. Until member sign-in exists, “Alumni only” is treated like Hidden on the public site.',
    email: {
      label: 'Email visibility',
      options: {
        public: 'Public — shown on your profile',
        alumni_only: 'Alumni only — not shown publicly yet',
        hidden: 'Hidden — never shown publicly',
      },
    },
    phone: {
      label: 'Phone visibility',
      options: {
        public: 'Public — shown on your profile',
        alumni_only: 'Alumni only — not shown publicly yet',
        hidden: 'Hidden — never shown publicly',
      },
    },
    profile: {
      label: 'Directory visibility',
      options: {
        public: 'Public — listed in the alumni directory',
        alumni_only: 'Alumni only — not listed publicly yet',
        hidden: 'Hidden — not listed at all',
      },
    },
  },
  consent: {
    label: 'I agree to the terms of use and the privacy policy',
    hint: 'The Association needs your consent to store and review this profile.',
  },
  buttons: {
    back: 'Back',
    next: 'Continue',
    submit: 'Submit registration',
    submitting: 'Submitting…',
  },
  requiredNote: 'Fields marked * are required.',
  success: {
    title: 'Thank you. Your profile is pending approval.',
    body: 'The Association will review your details and email you when your profile is live. This usually takes a few working days.',
    reference: 'Your reference',
    directory: 'Browse the directory',
    home: 'Back to home',
  },
  error: 'We could not submit your registration. Please check your connection and try again.',
} as const;
