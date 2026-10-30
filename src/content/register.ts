import { photoMaxMegabytes } from '@/lib/constants/photo';

export const registerPage = {
  title: 'Register as an alumnus',
  description:
    'Add yourself to the BPKIHS alumni directory. Registration is free, takes about five minutes, and every profile is reviewed before it appears.',
  intro:
    'This form is for BPKIHS graduates and former residents. The Association reviews each profile before it is listed, so the directory stays accurate and no one is added without their consent.',
  reviewNote:
    'Profiles are reviewed by the Association before they appear in the directory. Registering also creates your account, which you confirm with a code we email you, and which you use to sign in later.',
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
      hint: `Optional. A JPEG, PNG or WebP image up to ${photoMaxMegabytes()} MB. It is uploaded after you confirm your email.`,
      selected: 'This photo will be uploaded once your email is confirmed.',
      remove: 'Remove photo',
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
    password: {
      label: 'Password',
      hint: 'At least 8 characters. You will use it, with your email, to sign in and check your profile.',
    },
    confirmPassword: { label: 'Repeat password', hint: 'Type the same password again.' },
  },
  privacy: {
    legend: 'What others can see',
    intro:
      'You control each item separately. “Alumni only” items are kept for the Association and never shown on the public directory.',
    email: {
      label: 'Email visibility',
      options: {
        public: 'Public: shown on your profile',
        alumni_only: 'Alumni only: not shown publicly yet',
        hidden: 'Hidden: never shown publicly',
      },
    },
    phone: {
      label: 'Phone visibility',
      options: {
        public: 'Public: shown on your profile',
        alumni_only: 'Alumni only: not shown publicly yet',
        hidden: 'Hidden: never shown publicly',
      },
    },
    profile: {
      label: 'Directory visibility',
      options: {
        public: 'Public: listed in the alumni directory',
        alumni_only: 'Alumni only: not listed publicly yet',
        hidden: 'Hidden: not listed at all',
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
  verify: {
    title: 'Confirm your email address',
    body: 'We sent a code to',
    instruction: 'Enter it below to finish registering and sign in.',
    codeLabel: 'Verification code',
    codeHint: 'Digits only. The code expires after a short while, so use it promptly.',
    codeError: 'Enter the code from the email. Digits only.',
    submit: 'Confirm and sign in',
    submitting: 'Confirming…',
    resend: 'Send a new code',
    resending: 'Sending…',
    resendIn: 'Send a new code in',
    sent: 'A new code is on its way. It can take a minute to arrive.',
    notReceived:
      'Nothing arrived? Check your spam folder and make sure the address above is right.',
    deliveryFailed:
      'We could not email the code just now. Send a new one below, or contact the office if it keeps failing.',
    changeEmail: 'Registered the wrong address? Contact the office and we will correct it.',
  },
  signIn: {
    prompt: 'Already registered?',
    action: 'Sign in to your account',
  },
  success: {
    title: 'Thank you. Your email is confirmed and your profile is pending approval.',
    body: 'The Association will review your details and email you when your profile is live. This usually takes a few working days. You can sign in at any time to check the review.',
    photoAdded:
      'Your photo was uploaded. It will appear with your profile once the Association approves it.',
    photoFailed:
      'Your registration is complete, but the photo could not be uploaded. Add it from your account profile, or contact the office if it keeps failing.',
    reference: 'Your reference',
    account: 'Go to your account',
    directory: 'Browse the directory',
    home: 'Back to home',
  },
  error: 'We could not submit your registration. Please check your connection and try again.',
} as const;
