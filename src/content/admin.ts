/** Copy for the admin dashboard. Same rule as the public site: no strings inside components. */

export const adminNav = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/alumni', label: 'Registrations' },
  { href: '/admin/posts', label: 'Posts' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/tickets', label: 'Support' },
  { href: '/admin/donations', label: 'Donations' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/audit', label: 'Audit log' },
] as const;

export const adminShell = {
  publicSite: 'Public site',
  notAdminTitle: 'Admin access',
  notAdminPrefix: 'You are signed in as',
  notAdminSuffix: 'but this account does not have admin access.',
} as const;

export const adminSignIn = {
  title: 'Admin sign-in',
  description: 'Moderation is limited to Association administrators.',
  emailLabel: 'Email address',
  passwordLabel: 'Password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  error: 'Check your email and password and try again.',
  notAdmin: 'This account does not have admin access.',
  backToSite: 'Back to the public site',
} as const;

export const adminOverview = {
  title: 'Overview',
  description: 'What needs attention today.',
  queuesTitle: 'Needs attention',
  numbersTitle: 'At a glance',
  queues: [
    { key: 'pendingAlumni', label: 'Registrations', href: '/admin/alumni?status=pending' },
    { key: 'pendingPosts', label: 'Posts to review', href: '/admin/posts' },
    { key: 'openReports', label: 'Open reports', href: '/admin/reports' },
    { key: 'openTickets', label: 'Open tickets', href: '/admin/tickets?status=open' },
  ],
  numbers: [
    { key: 'alumniCount', label: 'Approved alumni' },
    { key: 'subscribers', label: 'Newsletter subscribers' },
    { key: 'raisedMinor', label: 'Raised to date', money: true },
    { key: 'countries', label: 'Countries represented' },
  ],
  empty: 'Nothing is waiting for review.',
} as const;

export const adminAlumniPage = {
  title: 'Registrations',
  description: 'Approve a profile to publish it in the directory, or reject it with a reason.',
  searchLabel: 'Search registrations',
  statusLabels: {
    all: 'All',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  columns: {
    person: 'Alumnus',
    programme: 'Programme',
    place: 'Place',
    submitted: 'Submitted',
    status: 'Status',
    actions: 'Actions',
  },
  approve: 'Approve',
  reject: 'Reject',
  rejectTitle: 'Why is this registration being rejected?',
  rejectHint: 'The reason is stored in the audit log.',
  rejectSubmit: 'Reject registration',
  cancel: 'Cancel',
  reasonLabel: 'Reason',
  empty: 'No registrations match this filter.',
  approvedNote: 'Approved',
} as const;

export const adminPostsPage = {
  title: 'Posts',
  description: 'Community submissions wait here until an admin publishes them.',
  columns: {
    post: 'Post',
    type: 'Type',
    author: 'Author',
    submitted: 'Submitted',
    actions: 'Actions',
  },
  approve: 'Publish',
  reject: 'Reject',
  rejectTitle: 'Why is this post being rejected?',
  rejectHint: 'The reason is stored in the audit log.',
  rejectSubmit: 'Reject post',
  cancel: 'Cancel',
  reasonLabel: 'Reason',
  readMore: 'Read the full post',
  empty: 'No posts are waiting for review.',
} as const;

export const adminReportsPage = {
  title: 'Reports',
  description: 'Readers can report a published post. Resolve each report once you have looked.',
  columns: {
    post: 'Post',
    reason: 'Reason',
    details: 'Details',
    reported: 'Reported',
    actions: 'Actions',
  },
  review: 'Mark reviewed',
  dismiss: 'Dismiss',
  empty: 'No open reports.',
} as const;

export const adminTicketsPage = {
  title: 'Support',
  description: 'Helpdesk messages from the contact form.',
  columns: {
    reference: 'Reference',
    person: 'From',
    topic: 'Topic',
    subject: 'Subject',
    received: 'Received',
    status: 'Status',
  },
  statusLabels: {
    open: 'Open',
    in_progress: 'In progress',
    closed: 'Closed',
  },
  statusAction: 'Change status',
  readMessage: 'Read the message',
  empty: 'No tickets match this filter.',
} as const;

export const adminDonationsPage = {
  title: 'Donations',
  description: 'Every recorded gift, newest first. Amounts are in NPR.',
  columns: {
    reference: 'Reference',
    amount: 'Amount',
    method: 'Method',
    goal: 'Goal',
    date: 'Recorded',
    status: 'Status',
  },
  anonymous: 'Anonymous',
  empty: 'No donations recorded yet.',
  exportCsv: 'Download CSV',
  exportHint: 'The whole ledger as a spreadsheet, for reconciling against the bank statement.',
  previous: 'Previous',
  next: 'Next',
  pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
} as const;

export const adminActions = {
  working: 'Working…',
  failed: 'That action did not go through. Please try again.',
  signOut: 'Sign out',
} as const;

export const adminPaymentLabels: Record<string, string> = {
  esewa: 'eSewa',
  khalti: 'Khalti',
  connectips: 'ConnectIPS',
  fonepay: 'Fonepay',
  card: 'Card',
  paypal: 'PayPal',
};

export const adminStatusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  succeeded: 'Succeeded',
  failed: 'Failed',
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
};
