/** Copy for the admin dashboard. Same rule as the public site: no strings inside components. */

/**
 * The dashboard is grouped by the work it supports, not alphabetically.
 * `badge` names a live queue count shown beside the item (see `getAdminCounts`).
 */
export const adminNavGroups = [
  {
    label: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: 'dashboard',
        exact: true,
        // Summary KPIs and quick stats are on this page
      },
    ],
  },
  {
    label: 'Moderation',
    items: [
      {
        href: '/admin/alumni',
        label: 'Registrations awaiting approval',
        icon: 'users',
        badge: 'pendingAlumni',
        // Review profiles to publish in directory or reject with reason
      },
      {
        href: '/admin/posts',
        label: 'Posts awaiting review',
        icon: 'newspaper',
        badge: 'pendingPosts',
        // Publish or reject community posts
      },
      {
        href: '/admin/reports',
        label: 'Open post reports',
        icon: 'flag',
        badge: 'openReports',
        // Resolve reports once looked at
      },
      {
        href: '/admin/tickets',
        label: 'Support tickets',
        icon: 'life-buoy',
        badge: 'openTickets',
        // Change status, read messages
      },
    ],
  },
  {
    label: 'Giving',
    items: [
      {
        href: '/admin/donations',
        label: 'Donations',
        icon: 'donations',
        // Donation ledger shows confirmed gifts and payment status
      },
      {
        href: '/admin/payments',
        label: 'Payments',
        icon: 'credit-card',
        // Gateway config, last acceptance check, run ConnectIPS
      },
    ],
  },
  {
    label: 'Audience',
    items: [
      {
        href: '/admin/newsletter',
        label: 'Newsletter',
        icon: 'mail',
        // Subscribers, pending confirmations, test sends
      },
      {
        href: '/admin/content',
        label: 'Content',
        icon: 'file-text',
        // Events, giving goals, board, FAQ and welcome editor
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/admin/audit',
        label: 'Audit log',
        icon: 'scroll-text',
        // Newest 200 administrator actions
      },
      {
        href: '/admin/security',
        label: 'Security',
        icon: 'shield-check',
        // Two-factor authentication, password management
      },
    ],
  },
] as const;

export const adminShell = {
  brand: 'BPKIHS Alumni',
  brandShort: 'BPKIHS',
  section: 'Admin',
  publicSite: 'Public site',
  signedInAs: 'Signed in as',
  menu: 'Menu',
  closeMenu: 'Close menu',
  navLabel: 'Admin',
  notAdminTitle: 'Admin access',
  notAdminPrefix: 'You are signed in as',
  notAdminSuffix: 'but this account does not have admin access.',
} as const;

export const adminShellMessages = {
  title: 'Admin dashboard',
  notAdminTitle: 'Admin access',
  notAdminPrefix: 'You are signed in as',
  notAdminSuffix: 'but this account does not have admin access. Please contact an administrator.',
  navLabel: 'Admin navigation',
  menu: 'Menu',
  closeMenu: 'Close menu',
  signedInAsPrefix: 'You are signed in as',
  signedInAsSuffix: ', you can manage Association business here.',
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
  codeTitle: 'Two-factor code',
  codeHelp: 'Enter the six-digit code from your authenticator app.',
  codeLabel: 'Authentication code',
  backupLabel: 'Backup code',
  backupHelp: 'Enter one of the single-use codes you saved when you set up two-factor.',
  verify: 'Verify and sign in',
  verifying: 'Verifying…',
  useBackup: 'Use a backup code instead',
  useAuthenticator: 'Use the authenticator app',
  backToPassword: 'Use a different account',
  codeError: 'That code was not accepted. Try again.',
} as const;

export const adminSecurity = {
  title: 'Security',
  description:
    'Protect the dashboard with a code from an authenticator app, so a stolen password is not enough to approve profiles, send campaigns or change content.',
  statusLabel: 'Two-factor authentication',
  enabled: 'Enabled',
  disabled: 'Not enabled',
  enabledHelp:
    'Signing in asks for a code from your authenticator app after your password. Keep your backup codes somewhere safe.',
  disabledHelp:
    'Turn this on before launch. You will need your password and an authenticator app such as 1Password, Authy or Google Authenticator.',
  setUp: 'Set up two-factor',
  setUpHelp: 'Confirm your password to start.',
  passwordLabel: 'Password',
  continue: 'Continue',
  working: 'Working…',
  scanTitle: 'Add this account to your authenticator app',
  scanHelp:
    'Choose manual entry in the app and paste this key. Keep the app open for the next step.',
  secretLabel: 'Setup key',
  accountLabel: 'Account',
  issuerLabel: 'Issuer',
  confirmTitle: 'Enter the code from the app',
  confirmHelp: 'This proves the app has the right key and turns two-factor on.',
  codeLabel: 'Six-digit code',
  confirm: 'Turn on two-factor',
  backupTitle: 'Save your backup codes',
  backupHelp:
    'Each code works once and is the only way in if you lose the authenticator app. Store them somewhere safe; they are shown only now.',
  backupCodesLabel: 'Backup codes',
  done: 'Two-factor is on. You will be asked for a code the next time you sign in.',
  disableHelp:
    'Enter your password to remove the authenticator and its backup codes. Use this only when replacing a lost device.',
  disableSubmit: 'Turn off two-factor',
  error: 'That did not work. Check the password or code and try again.',
  missingSecret: 'The setup key was missing. Start again.',
  accountTitle: 'Your account',
  accountHint: 'The dashboard is signed in with this address.',
  emailLabel: 'Email address',
  roleLabel: 'Role',
  roleAdmin: 'Administrator',
  requiredTitle: 'Two-factor is required for administrators',
  requiredHelp:
    'The rest of the dashboard stays locked until this is on. If the device is lost, use a backup code, or ask the host operator to run the documented reset.',
  passwordTitle: 'Password',
  passwordHint: 'Change the password from your account screen. You stay signed in here.',
  changePassword: 'Change password',
} as const;

export const adminOverview = {
  eyebrow: 'Dashboard',
  title: 'Overview',
  description:
    'What is waiting, what came in, and where the money stands: the Association’s work for today.',
  asOf: (date: string) => `As of ${date}`,
  kpisLabel: 'Key figures',
  attention: {
    title: 'Needs attention',
    summary: (count: number) =>
      `${count.toLocaleString('en-US')} ${count === 1 ? 'item is' : 'items are'} waiting`,
    clear: 'The queues are clear. Nothing is waiting for review.',
    items: [
      {
        key: 'pendingAlumni',
        label: 'Registrations',
        detail: 'waiting for approval',
        href: '/admin/alumni?status=pending',
        action: 'Review',
      },
      {
        key: 'pendingPosts',
        label: 'Posts',
        detail: 'waiting for review',
        href: '/admin/posts',
        action: 'Review',
      },
      {
        key: 'openReports',
        label: 'Reports',
        detail: 'open',
        href: '/admin/reports',
        action: 'Review',
      },
      {
        key: 'openTickets',
        label: 'Tickets',
        detail: 'open',
        href: '/admin/tickets?status=open',
        action: 'Open',
      },
    ],
  },
  kpis: {
    thisMonth: 'Confirmed this month',
    vsLastMonth: (percent: number) =>
      `${percent > 0 ? '+' : percent < 0 ? '−' : ''}${Math.abs(percent)}% vs last month`,
    noBaseline: 'No gifts last month',
    flat: 'Level with last month',
    giftsNote: (count: number) =>
      `${count.toLocaleString('en-US')} ${count === 1 ? 'gift' : 'gifts'} confirmed`,
    alumni: 'Approved alumni',
    alumniNew: (count: number) => `${count.toLocaleString('en-US')} added this month`,
    alumniNone: 'No new profiles this month',
    subscribers: 'Newsletter subscribers',
    subscribersPending: (count: number) => `${count.toLocaleString('en-US')} awaiting confirmation`,
    subscribersNone: 'Every address is confirmed',
    average: 'Average gift this month',
    averageNote: 'Confirmed payments only',
  },
  charts: {
    givingTitle: 'Confirmed payments (NPR)',
    givingDescription: 'The last six calendar months, in the site’s local time zone.',
    givingEmpty: 'No confirmed payments in this window yet.',
    givingTable: 'Confirmed payments by month',
    registrationTitle: 'Profiles added',
    registrationDescription: 'Self-registrations and register imports together.',
    registrationEmpty: 'No profiles were added in this window.',
    registrationTable: 'Profiles added by month',
    month: 'Month',
    amount: 'Confirmed',
    gifts: 'Gifts',
    added: 'Added',
    pending: 'Pending',
    note: 'Monthly totals use the site’s configured local time zone.',
  },
  recentTitle: 'Latest in the queues',
  recent: {
    registrations: 'Registrations awaiting approval',
    posts: 'Posts awaiting review',
    reports: 'Open post reports',
    tickets: 'Open support tickets',
    viewAll: 'See all',
    empty: 'Nothing waiting.',
  },
  quickActionsTitle: 'Quick actions',
  quickActions: [
    { label: 'Import alumni', href: '/admin/alumni/import' },
    { label: 'Write a newsletter', href: '/admin/newsletter' },
    { label: 'Add a giving goal', href: '/admin/donations' },
    { label: 'Edit site content', href: '/admin/content' },
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
  importLink: 'Import the written register',
  importHint: 'Upload a CSV, match its columns and preview every row before anything is written.',
  search: 'Search',
  results: (total: number) =>
    `${total.toLocaleString('en-US')} ${total === 1 ? 'registration' : 'registrations'}`,
  previous: 'Previous',
  next: 'Next',
  pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
  paginationLabel: 'Registrations pages',
} as const;

export const adminAlumniImportPage = {
  title: 'Import the written register',
  description:
    'Upload a CSV exported from the Association’s register. Match the columns once, preview every row, then import the valid ones.',
  backToList: 'Back to registrations',
  fileLabel: 'CSV file',
  fileHint: 'Up to 1,000 rows and 1 MB. The first non-empty row must hold the column names.',
  fileError: 'We could not read that file. Check that it is a CSV and try again.',
  tooLarge: 'That file is too large. Split it into smaller files and try again.',
  tooManyRows: 'That file has more than 1,000 rows. Split it and try again.',
  mappingTitle: 'Match the columns',
  mappingHelp:
    'Required fields are marked. We guessed the matches from the header names; change any that are wrong.',
  required: 'Required',
  unmapped: 'Not mapped',
  mapRequired: 'Map every required field before previewing.',
  preview: 'Preview rows',
  previewing: 'Reading…',
  visibilityTitle: 'Who can see the imported profiles?',
  visibilityHint:
    'A written register does not prove that someone agreed to be published. Hold rows for review unless the Association already has consent for every person in the file.',
  publishLabel: 'Publish them in the directory now',
  publishHint: 'The profiles appear as soon as the import finishes.',
  holdLabel: 'Hold them for review (recommended)',
  holdHint:
    'The profiles stay out of the directory until an admin approves them or the person registers and claims their record.',
  import: (count: number) => `Import ${count} ${count === 1 ? 'profile' : 'profiles'}`,
  importing: 'Importing…',
  summary: (ready: number, duplicate: number, invalid: number) =>
    `${ready} ready, ${duplicate} already on file, ${invalid} need attention.`,
  tableCaption: 'Rows in the uploaded file',
  columns: {
    row: 'Row',
    person: 'Name',
    email: 'Email',
    status: 'Status',
    message: 'What to fix',
  },
  status: {
    ready: 'Ready',
    duplicate: 'Skipped',
    invalid: 'Needs attention',
  },
  empty: 'No rows found below the header.',
  showingFirst: (shown: number, total: number) => `Showing the first ${shown} of ${total} rows.`,
  success: (imported: number, skipped: number, published: boolean) =>
    published
      ? `Imported ${imported} ${imported === 1 ? 'profile' : 'profiles'} and published ${imported === 1 ? 'it' : 'them'}. ${skipped} ${skipped === 1 ? 'row was' : 'rows were'} skipped.`
      : `Imported ${imported} ${imported === 1 ? 'profile' : 'profiles'}; ${imported === 1 ? 'it is' : 'they are'} waiting for review. ${skipped} ${skipped === 1 ? 'row was' : 'rows were'} skipped.`,
  error: 'The import did not go through. Check the file and try again.',
  viewImported: 'View the registrations',
  chooseAnother: 'Choose another file',
} as const;

export const adminPostsPage = {
  title: 'Posts',
  description:
    'Publish community submissions after review, and write news or announcements directly.',
  queueTitle: 'Awaiting review',
  queueCount: (count: number) =>
    `${count.toLocaleString('en-US')} ${count === 1 ? 'post' : 'posts'} waiting`,
  staff: {
    description:
      'A post written here is published on the community feed immediately. Use it for official news, notices and announcements.',
    empty: 'No staff-written posts yet. Add the first one.',
    fields: {
      type: 'Post type',
      title: 'Title',
      author: 'Byline',
      imageUrl: 'Image URL (optional)',
      body: 'Body',
    },
    typeLabels: {
      news: 'News',
      notice: 'Notice',
      event: 'Event',
      announcement: 'Announcement',
      story: 'Story',
      achievement: 'Achievement',
      in_memoriam: 'In memoriam',
    } as Record<string, string>,
  },
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
  reasonLabels: {
    inappropriate: 'Inappropriate',
    inaccurate: 'Inaccurate',
    spam: 'Spam',
    other: 'Other',
  } as Record<string, string>,
  openCount: (count: number) =>
    `${count.toLocaleString('en-US')} ${count === 1 ? 'report' : 'reports'} open`,
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
    all: 'All',
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
  description:
    'Review payment attempts, check confirmed gifts and export records for reconciliation. Names and email addresses are not shown in this ledger.',
  summaryLabel: 'Donation totals and payment status',
  confirmedTotal: 'Confirmed through this site',
  pendingLabel: 'Awaiting provider confirmation',
  failedLabel: 'Not completed',
  thisMonthLabel: 'Confirmed this month',
  giftCount: (count: number) =>
    `${count.toLocaleString('en-US')} ${count === 1 ? 'gift' : 'gifts'}`,
  generalFund: 'General fund',
  paginationLabel: 'Donation ledger pages',
  columns: {
    reference: 'Reference',
    amount: 'Amount',
    method: 'Method',
    goal: 'Goal',
    tribute: 'Tribute',
    date: 'Recorded',
    status: 'Status',
  },
  anonymous: 'Anonymous',
  tributeInHonour: 'In honour of',
  tributeInMemory: 'In memory of',
  empty: 'No donations recorded yet.',
  noMatches: 'No donations match these filters.',
  searchLabel: 'Search by donation or gateway reference',
  statusLabel: 'Payment status',
  allStatuses: 'All statuses',
  applyFilters: 'Apply filters',
  clearFilters: 'Clear',
  results: (total: number) =>
    `${total.toLocaleString('en-US')} ${total === 1 ? 'donation' : 'donations'} found`,
  exportCsv: 'Download CSV',
  exportHint: 'The whole ledger as a spreadsheet, for reconciling against the bank statement.',
  previous: 'Previous',
  next: 'Next',
  pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
} as const;

export const adminPaymentsPage = {
  title: 'Payments',
  description:
    'Which gateways this server can take money with, what the checkout is actually offering, and the last acceptance check. Settings are read from the environment; their values are never shown.',
  modeLabel: 'Payment mode',
  modeNotSet: 'Not set',
  modeUnset: 'Not set. Payments stay unavailable until PAYMENT_MODE is "sandbox" or "live".',
  sandboxNotice: 'Sandbox: no real money is taken.',
  liveNotice: 'Live: real money is taken.',
  tableCaption: 'Payment gateway configuration and last acceptance check',
  columns: {
    gateway: 'Gateway',
    adapter: 'Adapter',
    credentials: 'Credentials',
    checkout: 'At checkout',
    missing: 'Missing settings',
    lastCheck: 'Last acceptance check',
  },
  adapterPresent: 'Built',
  adapterMissing: 'Not built',
  configured: 'Configured',
  notConfigured: 'Not configured',
  offered: 'Offered',
  hidden: 'Hidden',
  noMissing: 'None',
  noAdapterNote: 'Agreed, but no adapter yet. Tracked as C7b.',
  noCheck: 'No check recorded.',
  checkStatus: {
    passed: 'Passed',
    failed: 'Failed',
    blocked: 'Blocked',
  } as Record<string, string>,
  runTitle: 'Run the ConnectIPS check',
  runHelp:
    'The script signs a form, posts it to NCHL UAT and calls validation, then records the result here. It cannot enter the OTP, so one sandbox donation in a browser is still required.',
  runCommand: 'npm run connectips:accept',
  dryRunLabel: 'Signing only, no request:',
  dryRunCommand: 'npm run connectips:accept -- --dry-run',
  donationNote:
    'eSewa and Khalti are confirmed by their own sandbox donations; their results are not recorded on this page.',
} as const;

export const adminActions = {
  working: 'Working…',
  failed: 'That action did not go through. Please try again.',
  signOut: 'Sign out',
  signingOut: 'Signing out…',
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
