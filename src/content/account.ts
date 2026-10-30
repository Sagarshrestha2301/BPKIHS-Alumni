/** Copy for signing in and for the member's own account page. */

import { photoMaxMegabytes } from '@/lib/constants/photo';

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
  forgotPassword: 'Forgotten your password?',
  resetPassword: 'Reset it by email',
  adminSignIn: 'Association administrator? Sign in to the dashboard',
  adminTwoFactor:
    'This account uses two-factor authentication. Sign in from the administrator page.',
  backToSite: 'Back to the site',
} as const;

export const visibilityLabels = {
  public: 'Public',
  alumni_only: 'Alumni only',
  hidden: 'Hidden',
} as const;

export const accountPage = {
  title: 'Your account',
  description: 'Your alumni profile and the state of its review.',
  signOut: 'Sign out',
  signingOut: 'Signing out…',
  emailLabel: 'Email address',
  roleLabel: 'Account type',
  roles: {
    donor: 'Standard account',
    alumni: 'Alumni member',
    admin: 'Administrator',
  },
  roleHelp: {
    donor: 'You can give, follow the community and manage your own registration.',
    alumni: 'You can see alumni-only directory details and edit your own profile.',
    admin: 'You can manage registrations, content, donations and the helpdesk.',
  },
  adminLink: 'Open the admin dashboard',
  statusLabel: 'Profile status',
  status: {
    pending: 'Pending review',
    approved: 'Approved and listed',
    rejected: 'Not approved',
  },
  statusHelp: {
    pending: 'The Association is reviewing your profile. You will get an email when it is live.',
    approved: 'Your profile appears in the alumni directory.',
    rejected: "Your profile is not listed. The Association's reason is below.",
  },
  rejectionReasonLabel: 'Why it was not approved',
  rejectionReasonMissing:
    'The Association did not record a reason. Contact the office and we will explain.',
  verification: {
    verified: 'Email confirmed',
    unverified: 'Email not confirmed',
    cardTitle: 'Confirm your email address',
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
  editProfile: 'Edit your profile',
  editHelp:
    'Keep your contact details, work and areas of expertise up to date. Changes appear in the directory as soon as you save.',
  profileTitle: 'Your profile',
  visibilityHelp:
    'What the alumni directory shows other people. Change it when you edit your profile.',
  fields: {
    fullName: 'Name',
    programme: 'Programme',
    batchYear: 'Batch year',
    country: 'Country',
    city: 'City',
    currentPosition: 'Current position',
    organisation: 'Organisation',
    furtherStudies: 'Further studies',
    expertise: 'Areas of expertise',
    note: 'Your note',
    privacy: 'Directory visibility',
  },
  privacyLabels: visibilityLabels,
  password: {
    title: 'Password',
    description:
      'Change the password you use to sign in. Other devices are signed out when it changes.',
    current: 'Current password',
    next: 'New password',
    confirm: 'Repeat the new password',
    hint: 'At least 8 characters.',
    submit: 'Change password',
    submitting: 'Changing…',
    success: 'Your password has been changed. Other devices have been signed out.',
    wrongCurrent: 'That is not your current password.',
    mismatch: 'The two passwords do not match.',
    error: 'We could not change your password. Check the fields and try again.',
  },
  directory: 'Browse the directory',
} as const;

export const profilePage = {
  title: 'Edit your profile',
  description:
    'Keep your contact details, work and areas of expertise up to date. An approved profile updates in the directory as soon as you save.',
  identityTitle: 'Identity',
  identityHelp:
    'Programme, batch year and email come from your registration. Contact the office if one of them is wrong.',
  identity: {
    email: 'Email address',
    programme: 'Programme',
    batchYear: 'Batch year',
  },
  photo: {
    title: 'Profile photo',
    description:
      'An optional photo for your directory profile. It follows your profile visibility and can be removed whenever you choose.',
    choose: 'Choose a photo',
    change: 'Choose a different photo',
    hint: `JPEG, PNG or WebP, up to ${photoMaxMegabytes()} MB. The image is cropped square and stored without its location metadata.`,
    upload: 'Upload photo',
    uploading: 'Uploading…',
    removing: 'Removing…',
    saved: 'Your photo has been saved. It will appear with your profile when it is listed.',
    removed: 'Your photo has been removed and the file deleted.',
    remove: 'Remove photo',
    removeTitle: 'Remove your photo?',
    removeHelp:
      'The file will be deleted and your profile will show your initials. This also withdraws your consent to publish the photo.',
    removeConfirm: 'Yes, remove photo',
    removeCancel: 'Keep photo',
    none: 'No photo yet. Your profile uses your initials.',
    clear: 'Clear selection',
  },
  fields: {
    fullName: { label: 'Name' },
    phone: { label: 'Phone', hint: 'Optional. Shown only if you allow it below.' },
    currentPosition: {
      label: 'Current position',
      hint: 'For example, Consultant Cardiologist.',
    },
    organisation: { label: 'Organisation', hint: 'Hospital, university or practice.' },
    city: { label: 'City' },
    country: { label: 'Country' },
    furtherStudies: {
      label: 'Further studies',
      hint: 'Degrees, fellowships or training since BPKIHS.',
    },
    expertise: {
      label: 'Areas of expertise',
      hint: 'Choose up to 8. Alumni use these to find advice, teaching and collaboration.',
      suggestions: 'Suggestions',
      custom: 'Add your own',
      placeholder: 'For example, Paediatric cardiology',
      add: 'Add',
      remove: 'Remove',
      full: 'You have added the maximum of 8 areas.',
      duplicate: 'That area is already on your profile.',
      none: 'No areas added yet.',
    },
    note: {
      label: 'About you',
      hint: 'A short note for your profile, up to 500 characters.',
    },
  },
  privacy: {
    legend: 'Directory visibility',
    intro: 'Choose who can see each detail. Email and phone stay hidden unless you allow them.',
    email: 'Email address',
    phone: 'Phone number',
    profile: 'My whole profile',
  },
  save: 'Save changes',
  saving: 'Saving…',
  saved: 'Your profile has been updated.',
  savedRequeued: 'Your profile has been updated and sent back for review.',
  error: 'We could not save your profile. Check the form and try again.',
  cancel: 'Back to your account',
} as const;

export const forgotPasswordPage = {
  title: 'Reset your password',
  description:
    'Enter the address you registered with and we will email a link for choosing a new password.',
  emailLabel: 'Email address',
  submit: 'Send the link',
  submitting: 'Sending…',
  success:
    'If that address has an account, a reset link is on its way. It expires in 30 minutes and works once.',
  error: 'We could not send the link. Please try again.',
  back: 'Back to sign in',
} as const;

export const resetPasswordPage = {
  title: 'Choose a new password',
  description: 'Pick a password you do not use anywhere else.',
  passwordLabel: 'New password',
  confirmLabel: 'Repeat the new password',
  hint: 'At least 8 characters.',
  submit: 'Set the new password',
  submitting: 'Saving…',
  success: 'Your password has been changed. You can sign in with it now.',
  invalid: 'This reset link is not valid or has expired. Request a new one.',
  mismatch: 'The two passwords do not match.',
  error: 'We could not change the password. Request a new link and try again.',
  signIn: 'Sign in',
  requestNew: 'Request a new link',
} as const;
