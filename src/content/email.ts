/**
 * Transactional email copy.
 *
 * Like every other user-facing string, these live outside components and services. Each
 * function returns a subject and a plain-text body; operational values (names, dates,
 * amounts, links) are passed in, never embedded.
 */

export const emailSignature = 'BPKIHS Alumni Association';

function lines(...values: string[]): string {
  return [...values, '', emailSignature].join('\n');
}

export const emailCopy = {
  registrationCode(input: { otp: string; minutes: number }): {
    subject: string;
    text: string;
  } {
    return {
      subject: 'Your BPKIHS alumni verification code',
      text: lines(
        'Use this code to confirm your email address and finish your alumni registration:',
        '',
        input.otp,
        '',
        `The code expires in ${input.minutes} minutes. If you did not register, ignore this email and nothing will be stored.`,
      ),
    };
  },

  newsletterWelcome: {
    subject: 'You are on the BPKIHS alumni newsletter list',
    text: lines(
      'Thank you for subscribing.',
      '',
      'You will get a short digest with alumni stories, events and giving updates. You can unsubscribe at any time from the newsletter page.',
    ),
  },

  newsletterUnsubscribed: {
    subject: 'You have been removed from the newsletter',
    text: lines(
      'You will no longer receive the alumni newsletter.',
      '',
      'You can subscribe again at any time from the community page.',
    ),
  },

  rsvpConfirmed(input: {
    name: string;
    eventTitle: string;
    partySize: number;
    when: string;
    venue: string;
    city: string;
  }): { subject: string; text: string } {
    return {
      subject: `You are registered for ${input.eventTitle}`,
      text: lines(
        `Hello ${input.name},`,
        '',
        `Your place for ${input.eventTitle} is confirmed for ${input.partySize} ${
          input.partySize === 1 ? 'person' : 'people'
        }.`,
        `When: ${input.when}`,
        `Where: ${input.venue}, ${input.city}`,
      ),
    };
  },

  rsvpWaitlisted(input: {
    name: string;
    eventTitle: string;
    when: string;
    venue: string;
    city: string;
  }): { subject: string; text: string } {
    return {
      subject: `You are on the waitlist for ${input.eventTitle}`,
      text: lines(
        `Hello ${input.name},`,
        '',
        `All places for ${input.eventTitle} are taken, so you are on the waitlist. We will email you if a place opens.`,
        `When: ${input.when}`,
        `Where: ${input.venue}, ${input.city}`,
      ),
    };
  },

  supportReceived(input: {
    name: string;
    subject: string;
    reference: string;
    message: string;
    replyWindowDays: number;
  }): { subject: string; text: string } {
    return {
      subject: `We received your message (${input.reference})`,
      text: lines(
        `Hello ${input.name},`,
        '',
        `Thank you for contacting the association about "${input.subject}".`,
        `Your reference is ${input.reference}. We normally reply within ${input.replyWindowDays} working days.`,
        '',
        'Your message:',
        input.message,
      ),
    };
  },

  donationReceipt(input: { name: string; amount: string; reference: string; goalTitle?: string }): {
    subject: string;
    text: string;
  } {
    return {
      subject: 'Thank you for your gift',
      text: lines(
        `Dear ${input.name},`,
        '',
        `Your gift of ${input.amount} has been confirmed.`,
        ...(input.goalTitle ? [`Designated to: ${input.goalTitle}`] : []),
        `Reference: ${input.reference}`,
      ),
    };
  },

  campaign(input: { subject: string; body: string; unsubscribeUrl: string }): {
    subject: string;
    text: string;
  } {
    return {
      subject: input.subject,
      text: [input.body.trim(), '', '—', `Unsubscribe: ${input.unsubscribeUrl}`].join('\n'),
    };
  },
} as const;
