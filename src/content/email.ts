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

  passwordReset(input: { url: string; minutes: number }): {
    subject: string;
    text: string;
  } {
    return {
      subject: 'Reset your BPKIHS alumni password',
      text: lines(
        'Someone asked to reset the password for this address.',
        '',
        'Open this link to choose a new password:',
        input.url,
        '',
        `The link expires in ${input.minutes} minutes and works once. If you did not ask, ignore this email: your password has not changed.`,
      ),
    };
  },

  /**
   * The double opt-in email. Nothing is mailed to the address until this link is opened, so
   * the message has to be clear that ignoring it leaves no trace on the list.
   */
  newsletterConfirm(input: { url: string }): { subject: string; text: string } {
    return {
      subject: 'Confirm your BPKIHS alumni newsletter subscription',
      text: lines(
        'Someone asked to add this address to the BPKIHS alumni newsletter.',
        '',
        'Open this link to confirm. The page has a button; you join the list when you press it:',
        input.url,
        '',
        'The address is not stored on the list until you confirm. If you did not ask, ignore this email and nothing further will be sent.',
      ),
    };
  },

  newsletterUnsubscribed: {
    subject: 'You have been removed from the newsletter',
    text: lines(
      'You will no longer receive the alumni newsletter.',
      '',
      'You can subscribe again at any time from the community page.',
    ),
  },

  /**
   * Sent when someone types an address into the preferences form. The link is the proof that
   * the person asking controls that inbox, so a stranger cannot unsubscribe a member (or
   * subscribe someone who never asked) just by knowing an address.
   */
  newsletterUnsubscribeConfirmation(input: { url: string }): {
    subject: string;
    text: string;
  } {
    return {
      subject: 'Confirm your newsletter unsubscribe',
      text: lines(
        'Someone asked to change the BPKIHS alumni newsletter settings for this address.',
        '',
        'Open this link to confirm. It works once and never asks you to sign in:',
        input.url,
        '',
        'If you did not ask, ignore this email and nothing changes.',
      ),
    };
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

  alumniApproved(input: { name: string; accountUrl: string }): {
    subject: string;
    text: string;
  } {
    return {
      subject: 'Your alumni profile is now published',
      text: lines(
        `Hello ${input.name},`,
        '',
        'The Association has approved your registration. Your profile now appears in the alumni directory.',
        '',
        'Sign in to update your details, expertise or privacy settings:',
        input.accountUrl,
      ),
    };
  },

  alumniRejected(input: { name: string; accountUrl: string }): {
    subject: string;
    text: string;
  } {
    return {
      subject: 'Your alumni registration needs attention',
      text: lines(
        `Hello ${input.name},`,
        '',
        'The Association has reviewed your registration but could not publish it yet.',
        '',
        'Sign in to see what needs changing. Correct the details and save; your profile goes back into the review queue automatically:',
        input.accountUrl,
        '',
        'If anything looks wrong, reply to this email and the office will help.',
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

  tributeNotification(input: {
    recipientName: string;
    kind: 'in_honour' | 'in_memory';
    donorName: string;
    message?: string;
    goalTitle?: string;
  }): { subject: string; text: string } {
    const honour = input.kind === 'in_memory' ? 'in memory of' : 'in honour of';
    return {
      subject:
        input.kind === 'in_memory'
          ? `A gift in memory of ${input.recipientName}`
          : `A gift in honour of ${input.recipientName}`,
      text: lines(
        `A gift has been made to the BPKIHS Alumni Association ${honour} ${input.recipientName}.`,
        ...(input.goalTitle ? [`Designated to: ${input.goalTitle}`] : []),
        '',
        `${input.donorName} asked us to let you know.`,
        ...(input.message ? ['', 'Their message:', input.message] : []),
      ),
    };
  },

  monthlyDigest(input: {
    month: string;
    posts: { title: string; excerpt: string; url: string }[];
    events: { title: string; when: string; venue: string; url: string }[];
    goals: { title: string; progress: string; url: string }[];
    siteUrl: string;
    preferencesUrl: string;
    unsubscribeUrl: string;
  }): { subject: string; text: string } {
    const sections: string[] = [
      'Your monthly BPKIHS alumni digest.',
      '',
      `From the community: ${input.month}`,
      ...(input.posts.length
        ? input.posts.flatMap((post) => ['', post.title, post.excerpt, post.url])
        : ['', 'No new stories this month.']),
      '',
      'Upcoming events',
      ...(input.events.length
        ? input.events.flatMap((event) => [
            '',
            event.title,
            `${event.when} · ${event.venue}`,
            event.url,
          ])
        : ['', 'Nothing on the calendar just yet.']),
      '',
      'Giving goals',
      ...(input.goals.length
        ? input.goals.flatMap((goal) => ['', goal.title, goal.progress, goal.url])
        : ['', 'No active goals at the moment.']),
      '',
      `Read more: ${input.siteUrl}`,
      `Choose what you receive: ${input.preferencesUrl}`,
      `Unsubscribe: ${input.unsubscribeUrl}`,
    ];

    return {
      subject: `BPKIHS alumni digest: ${input.month}`,
      text: sections.join('\n'),
    };
  },

  campaign(input: { subject: string; body: string; unsubscribeUrl: string }): {
    subject: string;
    text: string;
  } {
    return {
      subject: input.subject,
      text: [input.body.trim(), '', '--', `Unsubscribe: ${input.unsubscribeUrl}`].join('\n'),
    };
  },
} as const;
