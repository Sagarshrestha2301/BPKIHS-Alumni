import { PHOTO_MAX_DIMENSION, PHOTO_MIN_DIMENSION, photoMaxMegabytes } from '@/lib/constants/photo';

const MAX_MB = photoMaxMegabytes();

/**
 * Copy shared by the registration form, the profile editor and the API.
 *
 * The API returns the same wording the browser would have shown, so a file that passes the
 * picker but fails the real decode still gets a sentence a member can act on.
 */
export const photoCopy = {
  altPrefix: 'Photo of',
  consentLabel: 'I agree to my photo being shown in the alumni directory',
  consentHint:
    'Your photo follows your profile visibility. You can remove it at any time from your account.',
  consentRecorded: 'You have agreed to publish this photo. Remove it to withdraw that consent.',
  errors: {
    empty: 'That file is empty. Choose another photo.',
    type: 'Choose a JPEG, PNG or WebP image.',
    size: `That photo is larger than ${MAX_MB} MB. Choose a smaller file.`,
    tooSmall: `That photo is too small. Choose an image at least ${PHOTO_MIN_DIMENSION} × ${PHOTO_MIN_DIMENSION} pixels.`,
    tooLarge: `That photo is too large. Choose an image no larger than ${PHOTO_MAX_DIMENSION} × ${PHOTO_MAX_DIMENSION} pixels.`,
    unreadable: 'We could not read that image. Choose a different photo.',
    animated: 'Choose a still image. Animated images are not supported.',
    consent: 'Please agree to your photo appearing in the directory.',
    upload: 'We could not upload your photo. Try again, or use a different image.',
    remove: 'We could not remove your photo. Try again.',
    notFound: 'That photo was not found.',
  },
} as const;
