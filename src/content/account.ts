/** Copy for signing in and for the member's own account page. */

export const signInPage = {
  title: 'Sign in',
  description:
    'Sign in to check your alumni registration, confirm your email address and see your profile review.',
  fields: {
    email: { label: 'Email address', hint: 'The address you registered with.' },
    password: { label: 'Password' },
  },
  buttons: {
    submit: 'Sign in',
    submitting: 'Signing in…',
    signOut: 'Sign out',
  },
  error: 'We could not sign you in. Check your email and password and try again.',
  unverified:
    'Your email address is not confirmed yet. Open your account page after signing in to send yourself a new code.',
  newHere: 'New here?',
  register: 'Register as an alumnus',
  forgotPassword: 'Forgotten your password? Contact the office and we will reset it for you.',
  backToSite: 'Back to the site',
} as const;

export const accountPage = {
  title: 'Your account',
  description: 'Your alumni profile and the state of its review.',
  signOut: 'Sign out',
  signingOut: 'Signing out…',
  emailLabel: 'Email address',
  statusLabel: 'Profile status',
  status: {
    pending: 'Pending review',
    approved: 'Approved and listed',
    rejected: 'Not approved',
  },
  statusHelp: {
    pending: 'The Association is reviewing your profile. You will get an email when it is live.',
    approved: 'Your profile appears in the alumni directory.',
    rejected: 'Your profile is not listed. The reason is below.',
  },
  verification: {
    verified: 'Email confirmed',
    unverified: 'Email not confirmed',
    unverifiedHelp:
      'Confirm your email address so the Association can approve your profile. We email a short code.',
    resend: 'Send a new code',
    resending: 'Sending…',
    sent: 'A new code is on its way. It can take a minute to arrive.',
    verifyHelp: 'Use the code from the email to confirm your address.',
    codeLabel: 'Verification code',
    verify: 'Confirm email',
    verifying: 'Confirming…',
    failed: 'That code was not accepted. Try again, or send a new one.',
    expired: 'That code has expired. Send a new one and try again.',
    tooMany: 'Too many wrong codes. Send a new one and try again.',
  },
  noProfile: 'This account has no alumni profile yet. Register to add yourself to the directory.',
  register: 'Register as an alumnus',
  editHelp: 'To change any of these details, contact the office and we will update your profile.',
  fields: {
    fullName: 'Name',
    programme: 'Programme',
    batchYear: 'Batch year',
    country: 'Country',
    city: 'City',
    currentPosition: 'Current position',
    organisation: 'Organisation',
    furtherStudies: 'Further studies',
    note: 'Your note',
    privacy: 'Directory visibility',
  },
  privacyLabels: {
    public: 'Public',
    alumni_only: 'Alumni only',
    hidden: 'Hidden',
  },
  directory: 'Browse the directory',
} as const;
