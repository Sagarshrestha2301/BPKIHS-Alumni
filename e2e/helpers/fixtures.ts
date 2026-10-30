import '../../src/server/db/load-env';

import { hashPassword } from 'better-auth/crypto';
import postgres from 'postgres';

import {
  ADMIN,
  DONOR,
  MEMBER,
  RESTRICTED_EMAIL,
  RESTRICTED_ID,
  RESTRICTED_NAME,
  SCHOLARSHIP_GOAL_ID,
} from './storage';

/**
 * Creates what the browser suite signs in as and pays towards.
 *
 * The application deliberately seeds nothing, so the suite brings its own fixtures: one admin,
 * one donor and the scholarship goal the checkout spec links to. They are written straight to
 * the development database before any browser test runs and are safe to run repeatedly.
 *
 * Credentials here are throwaway development values. Nothing in this file is imported by
 * application code, and the production bootstrap stays `npm run db:admin`.
 */

interface SeedAccount {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'donor' | 'alumni';
}

async function upsertAccount(sql: postgres.Sql, account: SeedAccount): Promise<string> {
  const [existing] = await sql<{ id: string }[]>`
    select id from "user" where email = ${account.email}
  `;
  const id = existing?.id ?? crypto.randomUUID();

  if (existing) {
    await sql`
      update "user"
      set name = ${account.name},
          role = ${account.role}::user_role,
          email_verified = true,
          two_factor_enabled = false,
          banned = false,
          updated_at = now()
      where id = ${id}
    `;
    // Replace the credential so a rerun always leaves the password the specs expect.
    await sql`delete from account where user_id = ${id}`;
    // A developer may have enrolled the fixture account in two-factor while poking at the
    // dashboard. The setup project signs in with a password, so clear it here too.
    await sql`delete from two_factor where user_id = ${id}`;
  } else {
    await sql`
      insert into "user" (id, name, email, email_verified, role, created_at, updated_at)
      values (${id}, ${account.name}, ${account.email}, true, ${account.role}::user_role, now(), now())
    `;
  }

  await sql`
    insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
    values (
      ${crypto.randomUUID()},
      ${id},
      'credential',
      ${id},
      ${await hashPassword(account.password)},
      now(),
      now()
    )
  `;

  return id;
}

/**
 * The content the public pages need to render their real state.
 *
 * The application ships with an empty database, so a fresh one would otherwise show empty
 * states and the home-page specs would fail. Three active goals, three upcoming events and
 * three published posts is exactly what those pages display; the ids are stable so a rerun
 * updates the same rows instead of piling new ones up.
 */
async function seedContent(sql: postgres.Sql): Promise<void> {
  const goals = [
    [
      'goal-library',
      'Library and reading room',
      'Books, journals and a quiet place to study.',
      25000000,
      6000000,
      1,
    ],
    [
      'goal-hostel',
      'Hostel repairs',
      'Roof, water and electrical work in the student hostel.',
      40000000,
      12500000,
      2,
    ],
  ] as const;

  for (const [id, title, description, target, raised, order] of goals) {
    await sql`
      insert into donation_goals (
        id, title, description, target_minor, raised_minor, currency, active, sort_order,
        created_at, updated_at
      )
      values (${id}, ${title}, ${description}, ${target}, ${raised}, 'NPR', true, ${order}, now(), now())
      on conflict (id) do update
      set title = excluded.title,
          description = excluded.description,
          target_minor = excluded.target_minor,
          active = true,
          updated_at = now()
    `;
  }

  const events = [
    ['fixture-annual-general-meeting', 'Annual general meeting', 30],
    ['fixture-continuing-education-day', 'Continuing education day', 60],
    ['fixture-alumni-reunion-picnic', 'Alumni reunion picnic', 90],
  ] as const;

  for (const [slug, title, daysAhead] of events) {
    await sql`
      insert into events (
        id, slug, title, summary, description, starts_at, ends_at, venue, city, mode,
        capacity, base_rsvp_count, status, created_at, updated_at
      )
      values (
        ${`event-${slug}`},
        ${slug},
        ${title},
        'Reports, elections and time with colleagues over tea in the DANIDA canteen.',
        'The Association holds its yearly meeting in the BPKIHS auditorium: a short report on the work so far, election of office bearers, and open questions from members. Tea follows in the DANIDA canteen, so most people stay to talk.',
        now() + (${daysAhead} * interval '1 day'),
        now() + (${daysAhead} * interval '1 day') + interval '3 hours',
        'BPKIHS Campus',
        'Dharan',
        'in_person',
        120,
        0,
        'upcoming',
        now(),
        now()
      )
      on conflict (slug) do update
      set title = excluded.title,
          starts_at = excluded.starts_at,
          ends_at = excluded.ends_at,
          status = 'upcoming',
          updated_at = now()
    `;
  }

  const posts = [
    [
      'fixture-post-achievement',
      'achievement',
      'A graduate publishes a public-health study',
      'The field survey that started as a batch project in Jhapa has reached a peer-reviewed journal.',
      'What began as a community-medicine rotation project : three classmates knocking on doors in rural Jhapa with a blood-pressure cuff and paper forms : has been published in a peer-reviewed journal. The study follows 412 households over two years and asks a simple question: how well is hypertension actually controlled outside the referral hospital?\n\nThe answer is a reminder of why alumni work matters: treatment had reached the villages, but control had not. All three of the original survey team now teach at BPKIHS, and the paper closes by thanking the staff of the community medicine department.',
      'Dr. Sabina Karki',
    ],
    [
      'fixture-post-story',
      'story',
      'Memories from the first MBBS batch',
      'Chemistry labs with no running hot water, change festivals honouring the founders, lifelong friendships.' +
        ' What the first batch remembers.',
      'Before the central buildings rose, the first MBBS batch studied in borrowed rooms and walked\n        to the Dharan fields for matches. They remember the cold mornings, the teachers who stayed\n        after lectures to answer every question, and the night the generator failed in the anatomy\n        dissection hall and the class continued by candlelight.\n\n        Most of them are scattered across hospitals and universities now, but they still hold a\n        reunion on every Dashain that brings them to Nepal. If you were part of the first batch,\n        share your own memory below.',
      'Prem Bahadur Limbu',
    ],
    [
      'fixture-post-notice',
      'notice',
      'The alumni fund opens its next round',
      'Applications are open until the end of the month; full details on the donate page.',
      'The annual alumni fund is open again. Money raised this year goes to needs the Association\n        agreed on at the last general meeting : student scholarships first, then reading-room and\n        hostel repairs. Application details are on the Donate page, and the closing date is the\n        end of this month. Donations of any size are welcome, and each gift is receipted by email.',
      'Alumni Association office',
    ],
  ] as const;

  for (const [id, type, title, excerpt, body, author] of posts) {
    await sql`
      insert into feed_posts (
        id, type, status, title, excerpt, body, author, published_at, tags, created_at, updated_at
      )
      values (
        ${id},
        ${type},
        'approved',
        ${title},
        ${excerpt},
        ${body},
        ${author},
        now() - interval '1 day',
        '{}'::text[],
        now() - interval '2 days',
        now()
      )
      on conflict (id) do update
      set type = excluded.type,
          title = excluded.title,
          excerpt = excluded.excerpt,
          body = excluded.body,
          author = excluded.author,
          status = 'approved',
          published_at = excluded.published_at,
          updated_at = now()
    `;
  }

  const board = [
    ['board-fixture-president', 'Dr. Rukmini Basnyat', 'President', 0, true],
    ['board-fixture-secretary', 'Dr. Bijay Thapa', 'General Secretary', 1, true],
    ['board-fixture-past-chair', 'Dr. Hari Joshi', 'Chair', 2, false],
  ] as const;

  for (const [id, name, role, order, current] of board) {
    await sql`
      insert into board_members (id, name, role, term, is_current, sort_order)
      values (${id}, ${name}, ${role}, '2026', ${current}, ${order})
      on conflict (id) do update
      set name = excluded.name,
          role = excluded.role,
          is_current = excluded.is_current,
          sort_order = excluded.sort_order
    `;
  }

  // The home page's leadership welcome hides itself when no message exists, so the suite
  // writes one to exercise the restored section end to end.
  await sql`
    insert into welcome_message (id, author, role, text, video_url, photo_url, placeholder, updated_at)
    values (
      'default',
      'Dr. Rukmini Basnyat',
      'President, BPKIHS Alumni Association',
      'Whatever took you away from Dharan : a first posting, a specialist training abroad, a career in research : you are still part of this community, and this is where it now lives.',
      null,
      null,
      true,
      now()
    )
    on conflict (id) do update
    set author = excluded.author,
        role = excluded.role,
        text = excluded.text,
        placeholder = excluded.placeholder,
        updated_at = excluded.updated_at
  `;
}

export async function seedFixtures(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await upsertAccount(sql, { ...ADMIN, role: 'admin' });
    const donorId = await upsertAccount(sql, { ...DONOR, role: 'donor' });
    const memberId = await upsertAccount(sql, { ...MEMBER, role: 'alumni' });

    // The goal has to be open so checkout is allowed to start against it.
    await sql`
      insert into donation_goals (
        id, title, description, target_minor, raised_minor, currency, active, sort_order,
        created_at, updated_at
      )
      values (
        ${SCHOLARSHIP_GOAL_ID},
        'Scholarships for students in need',
        'Covers tuition and living costs for students who would otherwise have to leave the programme.',
        500000000,
        125000000,
        'NPR',
        true,
        0,
        now(),
        now()
      )
      on conflict (id) do update
      set title = excluded.title,
          description = excluded.description,
          target_minor = excluded.target_minor,
          active = true,
          updated_at = now()
    `;

    await seedContent(sql);

    // An approved alumnus with expertise, so /account and the directory have a real member.
    await sql`
      insert into alumni (
        id, user_id, full_name, email, programme, batch_year, current_position, organisation,
        city, country, note, expertise, privacy_email, privacy_phone, privacy_profile,
        status, source, placeholder, approved_at, created_at, updated_at
      )
      values (
        'alumnus-fixture-member',
        ${memberId},
        ${MEMBER.name},
        ${MEMBER.email},
        'MBBS'::programme,
        2014,
        'Community physician',
        'BPKIHS',
        'Dharan',
        'Nepal',
        'A fixture member used by the account and directory tests.',
        ARRAY['Public health', 'Medical education']::text[],
        'public'::visibility,
        'public'::visibility,
        'public'::visibility,
        'approved'::approval_status,
        'self_registered'::alumni_source,
        false,
        now(),
        now(),
        now()
      )
      on conflict (id) do update
      set user_id = excluded.user_id,
          full_name = excluded.full_name,
          email = excluded.email,
          expertise = excluded.expertise,
          status = 'approved',
          privacy_profile = 'public',
          photo_url = null,
          photo_consent = false,
          updated_at = now()
    `;

    // An approved profile visible to alumni only. It has no account, so the role-access spec
    // can compare a signed-out visitor, the donor, the member and the administrator against
    // exactly the same record.
    await sql`
      insert into alumni (
        id, user_id, full_name, email, programme, batch_year, city, country,
        privacy_email, privacy_phone, privacy_profile, status, source, placeholder,
        approved_at, created_at, updated_at
      )
      values (
        ${RESTRICTED_ID},
        null,
        ${RESTRICTED_NAME},
        ${RESTRICTED_EMAIL},
        'BDS'::programme,
        2016,
        'Pokhara',
        'Nepal',
        'alumni_only'::visibility,
        'hidden'::visibility,
        'alumni_only'::visibility,
        'approved'::approval_status,
        'csv_import'::alumni_source,
        true,
        now(),
        now(),
        now()
      )
      on conflict (id) do update
      set user_id = null,
          full_name = excluded.full_name,
          email = excluded.email,
          status = 'approved',
          privacy_email = 'alumni_only',
          privacy_profile = 'alumni_only',
          photo_url = null,
          photo_consent = false,
          updated_at = now()
    `;

    // Two confirmed gifts so the public transparency list has a named row and one that
    // proves an anonymous gift never leaks its donor's name.
    await sql`
      insert into donations (
        id, user_id, goal_id, amount_minor, currency, method, status, anonymous, gateway,
        created_at, updated_at
      )
      values (
        'donation-fixture-public',
        ${donorId},
        ${SCHOLARSHIP_GOAL_ID},
        500000,
        'NPR',
        'esewa'::payment_method,
        'succeeded'::donation_status,
        false,
        'esewa'::payment_gateway,
        now() - interval '3 days',
        now()
      ),
      (
        'donation-fixture-anonymous',
        ${donorId},
        null,
        250000,
        'NPR',
        'khalti'::payment_method,
        'succeeded'::donation_status,
        true,
        'khalti'::payment_gateway,
        now() - interval '1 day',
        now()
      )
      on conflict (id) do update
      set user_id = excluded.user_id,
          status = 'succeeded',
          anonymous = excluded.anonymous,
          updated_at = now()
    `;

    // A recorded acceptance run, so Admin → Payments has a real result to show. The script in
    // scripts/connectips-acceptance.ts writes the same row; the admin spec reads it.
    await sql`
      insert into gateway_checks (gateway, status, mode, detail, checked_at)
      values (
        'connectips'::payment_gateway,
        'passed'::gateway_check_status,
        'sandbox',
        'E2E acceptance check: signing form passed; the UAT host accepted the signed token.',
        now() - interval '2 hours'
      )
      on conflict (gateway) do update
      set status = excluded.status,
          mode = excluded.mode,
          detail = excluded.detail,
          checked_at = excluded.checked_at
    `;
  } finally {
    await sql.end();
  }
}
