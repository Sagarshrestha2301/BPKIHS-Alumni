export const eventsPage = {
  title: 'Events',
  description:
    'Reunions, career conversations, health camps and the annual general meeting. Most events are free and open to alumni and guests.',
  tabs: {
    upcoming: 'Upcoming',
    past: 'Past events',
  },
  searchLabel: 'Search events',
  searchPlaceholder: 'Title, venue or city',
  searchButton: 'Search',
  clear: 'Clear search',
  empty: 'No events match this search.',
  pastNote: 'Past events include recaps and photo galleries where the organisers shared them.',
} as const;

export const eventDetailPage = {
  rsvpTitle: 'Reserve your place',
  rsvpIntro:
    'No account is needed. We will email the joining details or a reminder before the event.',
  fields: {
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone number (optional)',
    partySize: 'How many people are coming?',
  },
  partyHint: 'Including yourself, up to 6 people.',
  buttons: {
    rsvp: 'Confirm RSVP',
    submitting: 'Sending…',
  },
  success: 'Thank you. Your place is confirmed.',
  waitlist:
    'This event is full, so your request has been added to the waitlist. We will email you if a place opens.',
  error: 'We could not save your RSVP. Please check your details and try again.',
  full: 'Fully booked',
  places: 'places filled',
  unlimited: 'Open to everyone',
  capacityLabel: 'Places',
  pastTitle: 'Event recap',
  pastEventNote: 'This event has already taken place. The recap and any photos are below.',
  galleryTitle: 'Photos and video',
  calendar: 'Add to calendar',
  linkedGoalTitle: 'This event supports a giving goal',
  linkedGoalCta: 'Give to this goal',
  detailsTitle: 'Event details',
  venue: 'Venue',
  date: 'Date and time',
  mode: 'Format',
  back: 'All events',
  shareNote: 'Confirm the date and venue with the organiser before travelling.',
} as const;
