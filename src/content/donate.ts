export const donatePage = {
  title: 'Give to BPKIHS',
  description:
    'Support scholarships, learning spaces, rural health camps and student emergency aid through the BPKIHS Alumni Association.',
  intro:
    'Every gift is tied to a named goal or to the general fund, so you can see what your support makes possible. The Association publishes how funds are used.',
  transparencyLink: 'See how funds are used',
  goalsHeading: 'Where your gift can go',
  goalsNote: 'Sample goals and amounts until the Association opens its real campaign.',
  generalFund: 'Give to the general fund',
  quickAmounts: {
    title: 'Give in a minute',
    description: 'Choose an amount and continue to the secure checkout. No account is needed yet.',
    amounts: [100_000, 250_000, 500_000, 1_000_000] as const,
    label: 'Give',
  },
  funds: {
    title: 'Where the money goes',
    description:
      'A simple breakdown of funds raised so far. The full transparency page shows the figures and recent gifts.',
    link: 'Open the transparency page',
  },
  tribute: {
    title: 'Give in honour or in memory',
    description:
      'Make a gift in honour of a mentor, a batch or someone you remember. The tribute wall records the thought, not the amount.',
    link: 'Make a tribute gift',
  },
  trust: {
    title: 'What you can expect',
    items: [
      'A receipt by email after a completed gift.',
      'A clear note on this site that payments are a demonstration until the gateway is live.',
      'A contact for any question about a donation.',
    ],
    support: 'Contact the Association',
  },
  demoNote:
    'Payments are a demonstration. No money is taken and no card details are stored on this site.',
} as const;

export const donateCheckoutPage = {
  title: 'Complete your gift',
  description: 'Choose the amount, sign in for your receipt, then pick a payment method.',
  steps: [
    { id: 'amount', label: 'Amount' },
    { id: 'account', label: 'Your details' },
    { id: 'payment', label: 'Payment' },
  ],
  amount: {
    title: 'Choose an amount',
    goalLabel: 'Giving to',
    generalFund: 'General fund',
    amountLabel: 'Amount (NPR)',
    amountHint: 'The smallest gift is NPR 100.',
    customLabel: 'Or enter another amount',
    anonymousLabel: 'Give anonymously',
    anonymousHint: 'Your name will not appear on the public list of recent gifts.',
  },
  account: {
    title: 'Sign in to continue',
    description:
      'We ask you to sign in only to give, so we can send your receipt. The rest of the site never asks you to log in.',
    signInTitle: 'Sign in',
    signUpTitle: 'Create an account',
    emailLabel: 'Email address',
    nameLabel: 'Full name',
    phoneLabel: 'Phone number (optional)',
    signInButton: 'Sign in',
    signUpButton: 'Create account and continue',
    demoNote: 'Demo accounts are in memory only. Reloading the page signs you out.',
  },
  payment: {
    title: 'Payment method',
    description:
      'Choose how you would like to give. Every method is a demonstration in this build.',
    national: 'Nepal',
    international: 'International',
    methods: {
      esewa: { label: 'eSewa', description: 'Wallet payment' },
      khalti: { label: 'Khalti', description: 'Wallet payment' },
      connectips: { label: 'ConnectIPS', description: 'Bank transfer' },
      fonepay: { label: 'Fonepay QR', description: 'Scan and pay' },
      card: { label: 'Card', description: 'Visa or Mastercard' },
      paypal: { label: 'PayPal-style', description: 'International wallet' },
    },
    cardNote: 'Card fields are a visual stub. No card number is collected or stored.',
    walletNote: 'You would normally be redirected to the provider. This build does not redirect.',
  },
  summary: {
    title: 'Your gift',
    goal: 'Goal',
    amount: 'Amount',
    fee: 'Processing fee',
    feeValue: 'Covered by the Association',
    total: 'Total',
    change: 'Change',
  },
  buttons: {
    back: 'Back',
    continue: 'Continue',
    pay: 'Complete gift',
    paying: 'Processing…',
  },
  errors: {
    amount: 'Enter an amount of at least NPR 100.',
    account: 'Sign in or create an account to continue.',
    payment: 'Choose a payment method.',
    submit: 'The payment could not be completed. Please try again or choose another method.',
  },
  demoNotice: 'Demo only — no payment is taken.',
  success: 'Thank you. Your gift is recorded.',
} as const;

export const thankYouPage = {
  title: 'Thank you for your gift',
  description: 'Your gift has been recorded and a receipt is on its way.',
  receiptNote:
    'This is a demonstration. In the live site a receipt would be emailed to the address on your account.',
  nextSteps: [
    { label: 'See the transparency page', href: '/donate/transparency' },
    { label: 'Find alumni in the directory', href: '/directory' },
    { label: 'Join the newsletter', href: '/community/newsletter' },
  ],
} as const;

export const transparencyPage = {
  title: 'Fund transparency',
  description:
    'How the Association allocates the funds it raises, with a table for anyone who prefers figures to charts.',
  intro:
    'These figures are sample data until the Association completes its first reporting period. The categories show the intended split, not a final audited account.',
  totalRaised: 'Raised so far',
  totalGoals: 'Active goals',
  table: {
    category: 'Category',
    share: 'Share',
    amount: 'Amount',
  },
  report: 'Download the annual report (placeholder)',
  note: 'Placeholder figures. Real reporting starts after the first campaign closes.',
} as const;

export const tributePage = {
  title: 'Tribute giving',
  description:
    'Give in honour of a mentor, a batch or someone you remember. The tribute wall records the thought, not the amount.',
  inHonour: 'In honour',
  inMemory: 'In memory',
  formTitle: 'Make a tribute gift',
  typeLegend: 'This gift is',
  recipientLabel: 'Who is this for?',
  recipientKinds: {
    batch: 'A batch',
    mentor: 'A mentor',
    alumnus: 'An alumnus',
  },
  nameLabel: 'Name',
  namePlaceholder: 'For example Batch of 2012, or Dr Asha Rai',
  messageLabel: 'Message (optional)',
  messagePlaceholder: 'A few words for the tribute wall',
  notifyLabel: 'Notify someone by email (optional)',
  notifyHint: 'We will send one message with the tribute details.',
  amountLabel: 'Amount (NPR)',
  buttons: {
    submit: 'Continue to checkout',
    submitting: 'Preparing…',
  },
  wallTitle: 'Tribute wall',
  wallNote: 'Sample tributes. New entries appear after review.',
  wall: [
    {
      id: 'tribute-1',
      type: 'in_honour' as const,
      name: 'Batch of 2012',
      message: 'For the teachers who made the first year feel possible.',
    },
    {
      id: 'tribute-2',
      type: 'in_memory' as const,
      name: 'Dr Asha Rai',
      message: 'A mentor to generations of residents at BPKIHS.',
    },
    {
      id: 'tribute-3',
      type: 'in_honour' as const,
      name: 'The nursing faculty',
      message: 'With gratitude for years of patient teaching.',
    },
  ],
  error: 'We could not prepare that tribute. Please check the form and try again.',
} as const;
