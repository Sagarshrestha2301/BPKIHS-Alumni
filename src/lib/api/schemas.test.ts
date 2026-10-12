import { describe, expect, it } from 'vitest';

import { MIN_DONATION_MINOR, PROGRAMMES } from '@/lib/constants/domain';

import {
  donationSchema,
  helpdeskSchema,
  loginSchema,
  memberPostSchema,
  newsletterPrefsSchema,
  newsletterSubscribeSchema,
  postReportSchema,
  registrationSchema,
  rsvpSchema,
  signupSchema,
} from './schemas';

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

const validRegistration = {
  fullName: 'Asha Rai',
  email: 'asha@example.com',
  programme: 'MBBS',
  batchYear: 2012,
  country: 'Nepal',
  privacy: { email: 'alumni_only', phone: 'hidden', profile: 'public' },
  consent: true,
};

const validDonation = {
  amountMinor: 500_000,
  currency: 'NPR',
  method: 'esewa',
  anonymous: false,
};

describe('registrationSchema', () => {
  it('accepts a valid registration', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('accepts BMIT and every listed programme', () => {
    for (const programme of PROGRAMMES) {
      expect(registrationSchema.safeParse({ ...validRegistration, programme }).success).toBe(true);
    }
    expect(PROGRAMMES).toContain('BMIT');
  });

  it('rejects an unknown programme', () => {
    expect(registrationSchema.safeParse({ ...validRegistration, programme: 'Law' }).success).toBe(
      false,
    );
  });

  it('asks for a name when it is blank', () => {
    const result = registrationSchema.safeParse({ ...validRegistration, fullName: '   ' });
    expect(messages(result)).toContain('Enter your full name.');
  });

  it('explains an invalid email', () => {
    const result = registrationSchema.safeParse({ ...validRegistration, email: 'asha@' });
    expect(messages(result)).toContain(
      'Enter a valid email address, for example name@example.com.',
    );
  });

  it('requires consent', () => {
    const result = registrationSchema.safeParse({ ...validRegistration, consent: false });
    expect(messages(result)).toContain('Please agree to the terms to register.');
  });

  it('checks the batch year range and type', () => {
    const next = new Date().getFullYear() + 2;
    expect(registrationSchema.safeParse({ ...validRegistration, batchYear: 1980 }).success).toBe(
      false,
    );
    expect(registrationSchema.safeParse({ ...validRegistration, batchYear: next }).success).toBe(
      false,
    );
    expect(registrationSchema.safeParse({ ...validRegistration, batchYear: 2012.5 }).success).toBe(
      false,
    );
  });

  it('treats blank optional fields as not provided', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      phone: '',
      city: '',
      note: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed phone number', () => {
    const result = registrationSchema.safeParse({ ...validRegistration, phone: 'call me' });
    expect(result.success).toBe(false);
  });

  it('accepts an international phone number', () => {
    const result = registrationSchema.safeParse({ ...validRegistration, phone: '+977 9812345678' });
    expect(result.success).toBe(true);
  });
});

describe('donationSchema', () => {
  it('accepts a valid gift to the general fund', () => {
    expect(donationSchema.safeParse(validDonation).success).toBe(true);
  });

  it('rejects a gift below the minimum and names the minimum', () => {
    const result = donationSchema.safeParse({
      ...validDonation,
      amountMinor: MIN_DONATION_MINOR - 1,
    });
    expect(messages(result)).toContain('The smallest gift is NPR 100.');
  });

  it('rejects fractional minor units', () => {
    expect(donationSchema.safeParse({ ...validDonation, amountMinor: 10_000.5 }).success).toBe(
      false,
    );
  });

  it('is NPR only', () => {
    expect(donationSchema.safeParse({ ...validDonation, currency: 'USD' }).success).toBe(false);
  });

  it('rejects an unknown payment method', () => {
    expect(donationSchema.safeParse({ ...validDonation, method: 'bitcoin' }).success).toBe(false);
  });

  it('accepts a tribute with a recipient kind', () => {
    const result = donationSchema.safeParse({
      ...validDonation,
      goalId: 'goal-1',
      tribute: { type: 'in_memory', recipientKind: 'mentor', name: 'Dr. Sample Mentor' },
    });
    expect(result.success).toBe(true);
  });

  it('requires a name on a tribute', () => {
    const result = donationSchema.safeParse({
      ...validDonation,
      tribute: { type: 'in_honour', recipientKind: 'batch', name: '' },
    });
    expect(messages(result)).toContain('Enter the name this gift honours.');
  });
});

describe('rsvpSchema', () => {
  const valid = { name: 'Asha Rai', email: 'asha@example.com', partySize: 2 };

  it('accepts a valid RSVP', () => {
    expect(rsvpSchema.safeParse(valid).success).toBe(true);
  });

  it('keeps the party size between 1 and 6', () => {
    expect(rsvpSchema.safeParse({ ...valid, partySize: 0 }).success).toBe(false);
    expect(rsvpSchema.safeParse({ ...valid, partySize: 7 }).success).toBe(false);
  });
});

describe('helpdeskSchema', () => {
  const valid = {
    topic: 'donation_receipt',
    name: 'Asha Rai',
    email: 'asha@example.com',
    subject: 'Receipt needed',
    message: 'Please resend my donation receipt.',
  };

  it('accepts a valid ticket', () => {
    expect(helpdeskSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a very short message', () => {
    const result = helpdeskSchema.safeParse({ ...valid, message: 'Help' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown topic', () => {
    expect(helpdeskSchema.safeParse({ ...valid, topic: 'billing' }).success).toBe(false);
  });
});

describe('newsletter schemas', () => {
  it('accepts a subscription with no specific interests', () => {
    expect(newsletterSubscribeSchema.safeParse({ email: 'a@b.co', interests: [] }).success).toBe(
      true,
    );
  });

  it('rejects an unknown interest', () => {
    expect(
      newsletterSubscribeSchema.safeParse({ email: 'a@b.co', interests: ['gossip'] }).success,
    ).toBe(false);
  });

  it('accepts and validates preferences', () => {
    expect(newsletterPrefsSchema.safeParse({ email: 'a@b.co', optIn: false }).success).toBe(true);
    expect(newsletterPrefsSchema.safeParse({ email: 'a@b.co', optIn: 'no' }).success).toBe(false);
  });
});

describe('memberPostSchema', () => {
  const valid = {
    type: 'story',
    title: 'My first year as a resident',
    body: 'A few lines about my first year after graduation.',
    authorName: 'Asha Rai',
    authorEmail: 'asha@example.com',
  };

  it('accepts a valid post', () => {
    expect(memberPostSchema.safeParse(valid).success).toBe(true);
  });

  it('does not let members post staff-only types', () => {
    expect(memberPostSchema.safeParse({ ...valid, type: 'news' }).success).toBe(false);
  });

  it('rejects a body that is too short', () => {
    expect(memberPostSchema.safeParse({ ...valid, body: 'Too short' }).success).toBe(false);
  });
});

describe('postReportSchema', () => {
  it('accepts a standard reason without details', () => {
    expect(postReportSchema.safeParse({ reason: 'spam' }).success).toBe(true);
  });

  it('asks for details when the reason is "other"', () => {
    const result = postReportSchema.safeParse({ reason: 'other' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['details']);
  });

  it('accepts "other" with details', () => {
    expect(
      postReportSchema.safeParse({ reason: 'other', details: 'Contains private information.' })
        .success,
    ).toBe(true);
  });
});

describe('sign-in schemas', () => {
  it('validates login by email only', () => {
    expect(loginSchema.safeParse({ email: 'asha@example.com' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('validates signup', () => {
    expect(
      signupSchema.safeParse({ fullName: 'Asha Rai', email: 'asha@example.com' }).success,
    ).toBe(true);
    expect(signupSchema.safeParse({ fullName: '', email: 'asha@example.com' }).success).toBe(false);
  });
});
