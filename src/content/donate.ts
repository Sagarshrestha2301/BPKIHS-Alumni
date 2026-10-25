export const donatePage = {
  title: 'Give to BPKIHS',
  description:
    'Support scholarships, learning spaces, rural health camps and student emergency aid through the BPKIHS Alumni Association.',
  intro:
    'Every gift is tied to a named goal or to the general fund, so you can see what your support makes possible. The Association publishes how funds are used.',
  transparencyLink: 'See how funds are used',
  goalsHeading: 'Where your gift can go',
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
      'A simple breakdown of funds raised so far. The full transparency page shows the figures and categories.',
    link: 'Open the transparency page',
  },
  tribute: {
    title: 'Give in honour or in memory',
    description:
      'Make a gift in honour of a mentor, a batch or someone you remember. The message is shared with the person you name, not published with the amount.',
    link: 'Make a tribute gift',
  },
  paymentNote:
    'Payments are processed by eSewa or Khalti. Your card and wallet details never reach this site.',
  trust: {
    title: 'What you can expect',
    items: [
      'A receipt by email after the provider confirms your payment.',
      'Payment completed on the provider’s secure page; card details never reach this site.',
      'A contact for any question about a donation.',
    ],
    support: 'Contact the Association',
  },
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
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters.',
    nameLabel: 'Full name',
    phoneLabel: 'Phone number (optional)',
    signInButton: 'Sign in',
    signUpButton: 'Create account and continue',
    note: 'Your account is used only for this receipt. The rest of the site stays anonymous.',
  },
  payment: {
    title: 'Payment method',
    description:
      'Choose how you would like to give. You will complete the payment on the provider’s secure page and then return here for your receipt.',
    national: 'Nepal',
    methods: {
      esewa: { label: 'eSewa', description: 'Wallet payment' },
      khalti: { label: 'Khalti', description: 'Wallet payment' },
    },
    redirectNote:
      'You will be redirected to the provider to pay. Card and wallet details are entered there, never on this site.',
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
  success: 'Thank you. Your gift is recorded.',
} as const;

export const thankYouPage = {
  title: 'Thank you for your gift',
  description: 'Your gift has been recorded and a receipt is on its way.',
  pendingTitle: 'Your gift is pending',
  receiptPendingNote:
    'The payment provider has not confirmed this gift yet. We will email a receipt as soon as it settles.',
  receiptNote: 'A receipt has been emailed to the address on your account.',
  failedTitle: 'Your gift was not completed',
  failedNote:
    'The payment provider did not confirm this gift, so it has not been recorded as a donation. You can try again or choose another payment method.',
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
    'These figures come from the goals and donations recorded on this site. They show the current allocation and are not an audited account.',
  totalRaised: 'Raised so far',
  totalGoals: 'Active goals',
  table: {
    category: 'Category',
    share: 'Share',
    amount: 'Amount',
  },
  note: 'Figures update as donations are confirmed. Audited statements are published separately by the Association.',
} as const;

export const tributePage = {
  title: 'Tribute giving',
  description:
    'Give in honour of a mentor, a batch or someone you remember. The message is shared with the person you name, not published with the amount.',
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
  messagePlaceholder: 'A few words for the person you are honouring',
  notifyLabel: 'Notify someone by email (optional)',
  notifyHint: 'We will send one message with the tribute details.',
  amountLabel: 'Amount (NPR)',
  buttons: {
    submit: 'Continue to checkout',
    submitting: 'Preparing…',
  },
  error: 'We could not prepare that tribute. Please check the form and try again.',
} as const;
