export const botCheck = {
  label: 'Human check',
  missing: 'Complete the human check and try again.',
  failed: 'The human check did not pass. Please try again.',
  expired: 'The human check expired. Please complete it again.',
  unavailable: 'The human check is unavailable right now. Please try again in a moment.',
  notConfigured: 'Human verification is not configured on this server.',
  loadFailed: 'The human check could not load. Refresh the page and try again.',
} as const;
