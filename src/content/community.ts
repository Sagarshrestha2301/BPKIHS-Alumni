export const communityPage = {
  title: 'Community',
  description:
    'News, stories and notices from BPKIHS alumni. Members can share an update; every post is reviewed before it appears.',
  filtersLabel: 'Filter posts',
  filters: [
    { value: '', label: 'All' },
    { value: 'news', label: 'News' },
    { value: 'story', label: 'Stories' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'event', label: 'Event' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'in_memoriam', label: 'In memoriam' },
    { value: 'notice', label: 'Notices' },
  ] as const,
  loadMore: 'Load more posts',
  empty: 'No posts match this filter yet.',
  readMore: 'Read the full post',
  post: {
    back: 'Back to the community feed',
    byline: 'By',
    notFoundTitle: 'Post not found',
  },
  share: {
    title: 'Share an update',
    summary: 'Share an update with the network',
    description:
      'Stories, achievements, notices and memories are welcome. Posts are reviewed before they appear.',
    postingAs: 'Posting as',
    fields: {
      type: 'Type of post',
      title: 'Title',
      body: 'Your update',
      imageUrl: 'Photo URL (optional)',
      authorName: 'Your name',
      authorEmail: 'Your email',
    },
    hints: {
      body: 'At least 20 characters. Do not include private contact details.',
      imageUrl:
        'A photo or event image shown with your post once approved. Use an https:// link or leave it empty.',
      authorEmail: 'Not shown publicly. Used only if we need to check something.',
    },
    button: 'Submit for review',
    submitting: 'Sending…',
    success: 'Thank you. Your post is pending review and will appear once approved.',
    error: 'We could not submit your post. Please check the form and try again.',
  },
  report: {
    summary: 'Report this post',
    reasonLabel: 'Why are you reporting it?',
    detailsLabel: 'More detail (optional)',
    reasons: {
      inappropriate: 'Inappropriate content',
      inaccurate: 'Inaccurate or misleading',
      spam: 'Spam or advertising',
      other: 'Something else',
    } as const,
    submit: 'Send report',
    submitting: 'Sending…',
    success: 'Thank you. The moderators will review this post.',
    error: 'We could not send the report. Please try again.',
  },
  signInGate: {
    title: 'Sign in to share an update',
    text: 'Sharing an update is for members of the network. Sign in, or create a free account, and your post goes to the moderators for review.',
    signIn: 'Sign in',
    register: 'Create an account',
  },
} as const;

export const newsletterPage = {
  title: 'Newsletter',
  description:
    'A periodic email with alumni stories, events and giving updates. Choose what you want to hear about, or unsubscribe at any time.',
  signupTitle: 'Subscribe',
  signupDescription: 'We send a short digest, not a daily email.',
  interestsLabel: 'What would you like to hear about?',
  interests: {
    news: 'Association news',
    events: 'Events',
    giving: 'Giving and impact',
    stories: 'Alumni stories',
  } as const,
  emailLabel: 'Email address',
  subscribe: 'Subscribe',
  subscribing: 'Subscribing…',
  success: 'Check your inbox for the confirmation link. You are not on the list until you open it.',
  error: 'We could not update your subscription. Please try again.',
  emailFailed:
    'We could not send the confirmation email just now. Please try again in a moment. Nothing was added to the list.',
  preferencesTitle: 'Manage your subscription',
  preferencesDescription:
    'Enter the email address you subscribed with. We will send you a link to confirm; nothing changes until you open it.',
  unsubscribe: 'Send the unsubscribe link',
  unsubscribing: 'Sending…',
  unsubscribed:
    'If that address is on the list, a confirmation link is on its way. Open it to finish unsubscribing.',
  unsubscribeConfirmed: 'You are unsubscribed. You can subscribe again at any time.',
  unsubscribeUnknown:
    'That link has already been used or is not valid. Enter your email above to request a new one.',
  confirmedDone: 'You are on the list. Look out for the next digest.',
  confirmedInvalid:
    'That confirmation link is not valid or has already been used. Enter your email above to request a new one.',
  confirm: {
    title: 'Confirm your subscription',
    description: 'One press and the address joins the newsletter list.',
    intro:
      'Press the button to confirm this address. Nothing is sent to it until you do, so a link that a scanner opened on its own changes nothing.',
    button: 'Confirm subscription',
    invalid:
      'That link is not valid or has already been used. Enter your email on the newsletter page to request a new one.',
    privacy:
      'Confirming only proves that this inbox asked to join. The address is used for the newsletter and nothing else.',
    back: 'Back to the newsletter page',
  },
  privacyNote: 'We use your address only for the newsletter. Read the privacy policy for details.',
} as const;
