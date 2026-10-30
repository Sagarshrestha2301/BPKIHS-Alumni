export const donatePage = {
  title: 'Give to BPKIHS',
  description:
    'Support a giving goal approved by the BPKIHS Alumni Association, or contribute to its general fund.',
  intro:
    'Each goal names the work it is intended to support. You can also give to the general fund. The transparency page reports payments confirmed through this site; it does not include gifts made offline or replace the Association’s audited accounts.',
  transparencyLink: 'See how funds are used',
  goalsHeading: 'Current giving goals',
  noGoals:
    'There are no open giving goals at the moment. You can still contribute to the general fund.',
  generalFund: 'Give to the general fund',
  quickAmounts: {
    title: 'Choose an amount',
    description: 'Choose a suggested amount or enter your own in the secure checkout.',
    amounts: [100_000, 250_000, 500_000, 1_000_000] as const,
    label: 'Give',
  },
  funds: {
    title: 'Where the money goes',
    description:
      'The amounts shown here are the allocation plan applied to confirmed online gifts. They are not a record of expenditure.',
    link: 'Open the transparency page',
  },
  tribute: {
    title: 'Give in honour or in memory',
    description:
      'Make a gift in honour of a mentor, a batch or someone you remember. The message is shared with the person you name, not published with the amount.',
    link: 'Make a tribute gift',
  },
  paymentNote:
    'Payment is completed on the provider’s secure page. Enter wallet or card details only there, never on this site.',
  trust: {
    title: 'What you can expect',
    items: [
      'A receipt by email after the provider confirms your payment.',
      'Payment completed on the provider’s secure page; card details never reach this site.',
      'Questions about a gift? Contact the Association.',
    ],
    support: 'Contact the Association',
  },
} as const;

export const donateCheckoutPage = {
  title: 'Complete your gift',
  description:
    'Choose an amount, sign in for a receipt and donation record, then select a payment method.',

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
      'Sign in or create an account so the Association can send your receipt and keep your donation record.',
    signInTitle: 'Sign in',
    signUpTitle: 'Create an account',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters.',
    nameLabel: 'Full name',
    phoneLabel: 'Phone number (optional)',
    signInButton: 'Sign in',
    signUpButton: 'Create account and continue',
    note: 'You can browse the rest of the site without an account.',
  },
  payment: {
    title: 'Payment method',
    description:
      'Choose how you would like to give. You will complete the payment on the provider’s secure page and then return here for your receipt.',
    national: 'Nepal',
    methods: {
      esewa: { label: 'eSewa', description: 'Wallet payment' },
      khalti: { label: 'Khalti', description: 'Wallet payment' },
      connectips: {
        label: 'ConnectIPS',
        description: 'Direct bank payment, arranged through NCHL',
      },
    },
    unavailable:
      'Online payments are temporarily unavailable. Please try again later or contact the Association.',
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
    'The published giving goals, payment totals recorded on this site and the Association’s allocation plan.',
  intro:
    'Payment totals include gifts confirmed through this site. Goal allocations describe the Association’s published plan, not a record of money already spent. This page is not an audited account; contact the Association for audited statements and offline giving records.',
  totalRaised: 'Confirmed through this site',
  totalGoals: 'Active goals',
  funds: {
    title: 'How the funds are allocated',
    emptyTitle: 'No allocation plan has been published',
    emptyText:
      'The Association has not added fund categories yet. This page will show the allocation plan after it is published.',
  },
  table: {
    category: 'Category',
    share: 'Share',
    amount: 'Amount',
  },
  donors: {
    title: 'Recent gifts',
    description:
      'Gifts confirmed through this site, newest first. Donors who chose anonymity are listed without a name; amounts are not shown alongside people.',
    anonymous: 'Anonymous donor',
    generalFund: 'General fund',
    empty: 'No confirmed gifts yet. The first one will appear here.',
  },
  note: 'Figures update when the payment provider confirms a gift. Offline donations are not included; audited statements are available from the Association.',
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
