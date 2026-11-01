import './load-env';

import { sql } from './client';

/**
 * Fills every public content table with realistic BPKIHS Alumni Association content:
 * 30 items across posts, giving goals, events, the board, the FAQ and the funds page.
 *
 *   npm run db:seed-content
 *
 * Breakdown (exactly 30):
 *   10 feed posts    2 news, 2 notices, 2 announcements, 2 event posts, 2 member stories
 *    5 giving goals  one per campaign the donate page shows, one retired
 *    5 events        two past (with galleries), two upcoming, one annual-fundraising hybrid
 *    4 board members current executive committee
 *    4 FAQ entries   one per category the support page groups them by
 *    2 fund shares   the transparency chart papered across categories
 *
 * Notices and announcements carry fresh `publishedAt` values on purpose: the landing
 * popup raises the newest one, so a first-time visitor sees a realistic office issue.
 *
 * Safe to run repeatedly: the seed owns every id prefixed `seed-content-` and replaces
 * exactly those rows, so fixtures and hand-made rows are never touched. Goal updates
 * ride along with their goals and are not counted in the 30.
 */

const ID_PREFIX = 'seed-content-';

interface Row {
  [key: string]: unknown;
}

/** Bulk insert from JSON. Identifiers come only from hardcoded strings above. */
async function bulkInsert(table: string, columns: string[], casts: string, rows: Row[]) {
  await sql.unsafe(
    `insert into ${table} (${columns.join(', ')})` +
      ` select * from jsonb_to_recordset($1::jsonb) as x(${casts})`,
    [JSON.stringify(rows)],
  );
}

async function deleteSeed(table: string) {
  await sql.unsafe(`delete from ${table} where id like $1`, [`${ID_PREFIX}%`]);
}

const now = Date.now();
const iso = (daysFromNow: number): string => new Date(now + daysFromNow * 86_400_000).toISOString();

function post(
  index: number,
  type: string,
  title: string,
  excerpt: string,
  body: string,
  author: string,
  publishedDays: number,
  tags: string[],
): Row {
  return {
    id: `${ID_PREFIX}post-${index}`,
    type,
    status: 'approved',
    title,
    excerpt,
    body,
    author,
    author_email: `${ID_PREFIX}author@example.org`,
    published_at: iso(publishedDays),
    image_url: null,
    tags,
    placeholder: false,
    reviewed_at: iso(publishedDays),
    created_at: iso(publishedDays),
    updated_at: iso(publishedDays),
  };
}

const posts: Row[] = [
  post(
    1,
    'news',
    'Alumni-led blood drive collects 210 units in Dharan',
    'The two-day camp at the BPKIHS blood bank ran at full capacity through the weekend.',
    'The Association joined the Department of Transfusion Medicine for a two-day blood drive that collected 210 units from 240 registered donors.\n\nForty-one volunteers came from the last five MBBS batches alone, and the college recognised every graduate who brought a colleague. The blood bank confirmed all units cleared screening within the week and crossed to the district stores in Morang and Sunsari.',
    'Alumni Association office',
    -3,
    ['blood donation', 'Dharan', 'community'],
  ),
  post(
    2,
    'news',
    'BPKIHS rises two spots in the national medical college ranking',
    'Faculty publication output and the new clinical skills block carried the college upward.',
    "This year's national assessment placed BPKIHS two positions higher than last year, crediting research output and the clinical skills block the alumni fund helped furnish.\n\nThe assessment committee specifically noted the simulation lab, which opened in the spring with equipment the graduating classes of 2022 and 2023 contributed to. Association members were mentioned by name in the college's public note of thanks.",
    'Alumni Association office',
    -8,
    ['institution', 'ranking'],
  ),
  post(
    3,
    'notice',
    'Notice: 2027 general meeting moves to 15 February',
    'The recently announced date shifted one week to avoid the winter CCST examinations.',
    'The annual general meeting earlier announced for 8 February now takes place on 15 February at the college auditorium. The change avoids a clash with the winter CCST examinations, which several member examiner programmes run nationally.\n\nAgenda papers travel to all members by email in January. Proxy registration closes one week before the meeting.',
    'Alumni Association office',
    -1,
    ['general meeting'],
  ),
  post(
    4,
    'notice',
    'Notice: directory e-mail verification begins this month',
    'Members without a verified e-mail lose directory visibility from the end of the month.',
    'From the end of this month the directory hides profiles that have not verified an e-mail address. The step keeps the directory useful to recruiters and class organisers and removes the bounce accounts that clog every mailing.\n\nVerification takes two minutes from the account page. Members who have lost access to their old address should open a help desk ticket and the office will confirm identity manually.',
    'Alumni Association office',
    -6,
    ['directory', 'members'],
  ),
  post(
    5,
    'announcement',
    'Announcement: scholarship applications open for 2027 intake',
    'Four full scholarships support children of employees of the provincial health service.',
    'Applications for the four 2027 scholarships are open until 31 January. The fund supports children of permanent provincial health-service employees holding at least a staff-nurse qualification.\n\nForms are on the Donate page and the criteria are unchanged from last year: family income under the provincial ceiling, an admitted offer from an accredited institution, and a one-page statement. The selection committee sits in the second week of February.',
    'Alumni Association office',
    -4,
    ['scholarship', 'fund'],
  ),
  post(
    6,
    'announcement',
    'Announcement: new MoU lets members use the college library remotely',
    'Graduates anywhere can now sign up for a digital library card through the Association.',
    'The college and the Association signed an MoU giving every verified member a remote digital library card, covering the e-journal packages the college subscribes to.\n\nActivation runs through the alumni portal: verified members request the card from their account page and the library confirms within two working days. The pilot runs for one year before the membership fee is reviewed.',
    'Alumni Association office',
    -10,
    ['library', 'benefits'],
  ),
  post(
    7,
    'event',
    'Alumni reunion weekend set for January in Dharan',
    'The full programme lands over three days at the college and the city hall.',
    'Registration is open for reunion weekend. The programme: the welcome dinner on the Friday, parallel clinical CME tracks on the Saturday morning, the sporting fixtures in the afternoon and the gala on the Saturday night, closing with the batch photographs on Sunday morning.\n\nEarly-bird pricing runs until the end of the year and covers every meal.',
    'Alumni Association office',
    -12,
    ['reunion', 'Dharan'],
  ),
  post(
    8,
    'event',
    'Free diabetes screening camp returns to Biratchok',
    'The mobile camp is asking for forty volunteering graduates across the two days.',
    'The diabetes screening camp returns to Biratchok with the district hospital. The team needs about forty volunteers across two days: medical staff for the clinical stations and helpers for registration and flow.\n\nVolunteers sign up through the event page and receive a certificate of participation after the camp.',
    'Alumni Association office',
    -15,
    ['screening camp', 'volunteer'],
  ),
  post(
    9,
    'story',
    'From Dharan to a rural operation theatre: how one posting changed everything',
    'Class of 2011: posted to a two-bedded health post, now its surgeon of record.',
    'When the class of 2011 drew its compulsory-service postings, one batchmate drew a two-bedded health post in the hills of Okhaldhunga. Fifteen years on, she is still there, and the health post now runs a small theatre she helped commission.\n\nShe wrote to us about the first emergency she handled alone, the supply pipeline the district office finally fixed, and why she turns down the city offers every year.',
    'Class of 2011 graduate',
    -5,
    ['career', 'rural health'],
  ),
  post(
    10,
    'story',
    'We raised the whole first-term fee for one student in six hours',
    'The class of 2008 batch WhatsApp group has never been quieter than when it is busy.',
    "When a batchmate's daughter won admission to medical school and the fee notice came in the same week as a family medical bill, the class of 2008 group chat did what alumni groups do.\n\nIn six hours the first-term full fee, hostel and books were pledged, three members covered the airport pickups nobody asked for, and the student started her first week with nothing to arrange but her timetable.",
    'Class of 2008 graduate',
    -2,
    ['batch story', 'support'],
  ),
];

function goal(
  index: number,
  title: string,
  description: string,
  target: number,
  raised: number,
  deadline: string | null,
  sortOrder: number,
  active = true,
): Row {
  return {
    id: `${ID_PREFIX}goal-${index}`,
    title,
    description,
    target_minor: target,
    raised_minor: raised,
    currency: 'NPR',
    deadline,
    image_url: null,
    placeholder: false,
    active,
    sort_order: sortOrder,
    created_at: iso(-30),
    updated_at: iso(-1),
  };
}

const goals: Row[] = [
  goal(
    1,
    'Scholarship fund 2027',
    'Four full first-year scholarships for children of provincial health-service employees. Covers fees, hostel and a book allowance for the first year of study.',
    40_00_00_00,
    17_30_00_00,
    iso(90),
    1,
  ),
  goal(
    2,
    'Clinical skills lab upgrade',
    'The simulation wing needs a modern laparoscopic trainer and two delivery simulators before the next intake begins their skills rotations.',
    26_00_00_00,
    9_40_00_00,
    null,
    2,
  ),
  goal(
    3,
    'Mobile health camps, Morang and Sunsari',
    'Six weekend screening camps bring basic diagnostics and referrals to villages the district stores do not reach regularly.',
    15_00_00_00,
    6_20_00_00,
    null,
    3,
  ),
  goal(
    4,
    'Reading room and hostel repairs',
    'First-floor monsoon damage in the B and C blocks: roofing, three bathrooms and the study hall wiring.',
    21_00_00_00,
    4_00_00_00,
    null,
    4,
  ),
  goal(
    5,
    'Silver jubilee auditorium chairs',
    'Completed fund from the 25th-batch celebration. The chairs arrived in the autumn and the plaque is by the mail entrance.',
    12_00_00_00,
    12_05_40_00,
    null,
    99,
    false,
  ),
];

const goalUpdates: Row[] = [
  {
    id: `${ID_PREFIX}goal-update-1`,
    goal_id: `${ID_PREFIX}goal-1`,
    body: 'The selection committee has confirmed the interview date. Seven applicants cleared the paper screen; four will be offered the full award.',
    created_at: iso(-20),
  },
  {
    id: `${ID_PREFIX}goal-update-2`,
    goal_id: `${ID_PREFIX}goal-1`,
    body: 'First two scholarship names are provisionally approved pending admission letters. Fees for both will settle directly with the accounts office.',
    created_at: iso(-2),
  },
  {
    id: `${ID_PREFIX}goal-update-3`,
    goal_id: `${ID_PREFIX}goal-2`,
    body: 'The laparoscopic trainer has shipped. The supplier also threw in a practice suture kit at no charge, which covers the delivery-simulator shortfall for a term.',
    created_at: iso(-9),
  },
];

function event(
  index: number,
  title: string,
  summary: string,
  description: string,
  startsDays: number,
  endsDays: number | null,
  venue: string,
  city: string,
  mode: string,
  status: string,
  baseCount: number,
  slug: string,
  goalId: string | null,
): Row {
  return {
    id: `${ID_PREFIX}event-${index}`,
    slug,
    title,
    summary,
    description,
    starts_at: iso(startsDays),
    ends_at: endsDays === null ? null : iso(endsDays),
    venue,
    city,
    mode,
    capacity: null,
    base_rsvp_count: baseCount,
    image_url: null,
    status,
    goal_id: goalId,
    gallery: null,
    placeholder: false,
    created_at: iso(-60),
    updated_at: iso(-1),
  };
}

const events: Row[] = [
  event(
    1,
    'Reunion Weekend 2027',
    'Three days of CME, sport and the gala in Dharan. Early-bird registration is open.',
    'Full programme: welcome dinner Friday evening, parallel CME tracks and the annual general meeting Saturday morning, sporting fixtures on the college ground in the afternoon, the gala dinner on Saturday night, batch photographs on Sunday morning then close.\n\nBatches from 1994 to 2019 have confirmed coordinators. Dress for the gala is formal or national Nepali dress.',
    120,
    122,
    'BPKIHS campus and Hotel Purwanchal',
    'Dharan',
    'in_person',
    'upcoming',
    63,
    'reunion-weekend-2027',
    `${ID_PREFIX}goal-1`,
  ),
  event(
    2,
    'Diabetes screening camp, Biratchok',
    'Two-day free screening camp with the district hospital. Forty volunteers needed.',
    "The camp runs Saturday morning to Sunday afternoon. Stations: registration, blood pressure and random glucose, screening chemistry where power allows, and referral with the district pharmacy. Lunch for volunteers is provided by the local women's group as always.",
    30,
    31,
    'Biratchok health ground',
    'Biratchok',
    'in_person',
    'upcoming',
    18,
    'diabetes-camp-biratchok-2027',
    `${ID_PREFIX}goal-3`,
  ),
  event(
    3,
    'Online CME: sepsis and rural transfusion practice',
    'One evening, two speakers, free to members. A recording goes to registrants after.',
    'The monthly online CME takes sepsis bundles and the rural transfusion service as its theme. Speaker 1 covers the 2026 bundle update; speaker 2 takes the district stores perspective from Sunsari. The chat runs the full hour and the recording reaches every registrant.',
    14,
    null,
    'Zoom (link by e-mail)',
    'Online',
    'online',
    'upcoming',
    41,
    'cme-sepsis-rural-transfusion-2027',
    null,
  ),
  event(
    4,
    'Batch of 2005 twenty-year reunion dinner',
    'The 2005 dinner returns to Dharan with families welcome this time.',
    'The twenty-year anniversary dinner runs as one long table evening at the college guest house. Spouses and children join from 7. Batch photographs are re-taken in front of the anatomy block.',
    -120,
    -120,
    'BPKIHS guest house',
    'Dharan',
    'in_person',
    'past',
    88,
    'batch-2005-twenty-year-reunion',
    null,
  ),
  event(
    5,
    'Giving day 2027: the 24-hour alumni fund drive',
    'One day, one shared total, and a hybrid closing call hosted in Dharan and online.',
    'Giving day runs the full 24 hours with the running total on the donate page. The closing call is hybrid: the board hosts from the college board room while donors anywhere join the stream to speak. Every receipt goes out the same evening.',
    -40,
    -40,
    'Hybrid: board room and stream',
    'Dharan',
    'hybrid',
    'past',
    156,
    'giving-day-2027',
    `${ID_PREFIX}goal-5`,
  ),
];

const board: Row[] = [
  {
    id: `${ID_PREFIX}board-1`,
    name: 'Dr. Ram Bahadur Karki',
    role: 'President',
    term: '2025–2027',
    batch: 'MBBS 1994 (first batch)',
    photo_url: null,
    bio: "Consultant nephrologist and the founding president of the Association. Led the scholarship programme from its first five awards to today's fund.",
    vision_statement: 'A directory every member can trust, and a fund nobody has to chase.',
    is_current: true,
    sort_order: 1,
    placeholder: false,
  },
  {
    id: `${ID_PREFIX}board-2`,
    name: 'Dr. Sabita Gurung',
    role: 'Vice President',
    term: '2025–2027',
    batch: 'MD/MS 2006',
    photo_url: null,
    bio: "Paediatric intensivist at Kanti Children's. Chairs the CME committee and coordinates the monthly online sessions.",
    vision_statement:
      'Every graduate should find help moving house, moving country or moving hospital.',
    is_current: true,
    sort_order: 2,
    placeholder: false,
  },
  {
    id: `${ID_PREFIX}board-3`,
    name: 'Mr. Bimal Thapa',
    role: 'General Secretary',
    term: '2025–2027',
    batch: 'BMIT 2003',
    photo_url: null,
    bio: 'Senior radiographer and hospital information-system lead. Keeps the directory, the minutes and the general meeting honest.',
    vision_statement: 'Meetings that end on time and minutes that arrive the next day.',
    is_current: true,
    sort_order: 3,
    placeholder: false,
  },
  {
    id: `${ID_PREFIX}board-4`,
    name: 'Dr. Laxmi Shrestha',
    role: 'Treasurer',
    term: '2025–2027',
    batch: 'BSc Nursing 2000',
    photo_url: null,
    bio: 'Nursing director and treasurer through two completed funds. Publishes the funds breakdown every quarter.',
    vision_statement: 'Every rupee visible from the gift to the invoice.',
    is_current: true,
    sort_order: 4,
    placeholder: false,
  },
];

const faq: Row[] = [
  {
    id: `${ID_PREFIX}faq-1`,
    category: 'account',
    question: 'Why does my profile say pending?',
    answer:
      'New registrations are checked by hand, usually within two working days. You will get an e-mail either way, and if something is missing the e-mail tells you exactly what.',
    sort_order: 1,
    placeholder: false,
  },
  {
    id: `${ID_PREFIX}faq-2`,
    category: 'donations',
    question: 'When does my receipt arrive?',
    answer:
      'The receipt e-mail goes out the same evening the gateway confirms the payment. If it has not arrived by the next morning, check the spam folder and then open a ticket with the receipt number.',
    sort_order: 2,
    placeholder: false,
  },
  {
    id: `${ID_PREFIX}faq-3`,
    category: 'events',
    question: 'Can I bring guests to the reunion?',
    answer:
      'Yes. One RSVP covers up to six people including yourself, and the early-bird price applies to everyone in your party. Children under twelve are free.',
    sort_order: 3,
    placeholder: false,
  },
  {
    id: `${ID_PREFIX}faq-4`,
    category: 'membership',
    question: 'What does the digital library card include?',
    answer:
      'Remote access to the e-journal packages the college subscribes to. Activation runs through your account page after membership approval and the library confirms within two working days.',
    sort_order: 4,
    placeholder: false,
  },
];

const funds: Row[] = [
  {
    id: `${ID_PREFIX}funds-1`,
    category: 'Student scholarships',
    share_percent: 55,
    period: 'current',
    sort_order: 1,
  },
  {
    id: `${ID_PREFIX}funds-2`,
    category: 'Campus infrastructure',
    share_percent: 25,
    period: 'current',
    sort_order: 2,
  },
];

async function main(): Promise<void> {
  await deleteSeed('feed_posts');
  await bulkInsert(
    'feed_posts',
    [
      'id',
      'type',
      'status',
      'title',
      'excerpt',
      'body',
      'author',
      'author_email',
      'published_at',
      'image_url',
      'tags',
      'placeholder',
      'reviewed_at',
      'created_at',
      'updated_at',
    ],
    'id text, type post_type, status approval_status, title text, excerpt text, body text, author text, author_email text, published_at timestamptz, image_url text, tags text[], placeholder boolean, reviewed_at timestamptz, created_at timestamptz, updated_at timestamptz',
    posts,
  );

  await deleteSeed('donation_goal_updates');

  await deleteSeed('donation_goals');
  await bulkInsert(
    'donation_goals',
    [
      'id',
      'title',
      'description',
      'target_minor',
      'raised_minor',
      'currency',
      'deadline',
      'image_url',
      'placeholder',
      'active',
      'sort_order',
      'created_at',
      'updated_at',
    ],
    'id text, title text, description text, target_minor bigint, raised_minor bigint, currency text, deadline timestamptz, image_url text, placeholder boolean, active boolean, sort_order int, created_at timestamptz, updated_at timestamptz',
    goals,
  );

  await deleteSeed('events');
  await bulkInsert(
    'events',
    [
      'id',
      'slug',
      'title',
      'summary',
      'description',
      'starts_at',
      'ends_at',
      'venue',
      'city',
      'mode',
      'capacity',
      'base_rsvp_count',
      'image_url',
      'status',
      'goal_id',
      'gallery',
      'placeholder',
      'created_at',
      'updated_at',
    ],
    'id text, slug text, title text, summary text, description text, starts_at timestamptz, ends_at timestamptz, venue text, city text, mode event_mode, capacity int, base_rsvp_count int, image_url text, status event_status, goal_id text, gallery jsonb, placeholder boolean, created_at timestamptz, updated_at timestamptz',
    events,
  );

  await bulkInsert(
    'donation_goal_updates',
    ['id', 'goal_id', 'body', 'created_at'],
    'id text, goal_id text, body text, created_at timestamptz',
    goalUpdates,
  );

  await deleteSeed('board_members');
  await bulkInsert(
    'board_members',
    [
      'id',
      'name',
      'role',
      'term',
      'batch',
      'photo_url',
      'bio',
      'vision_statement',
      'is_current',
      'sort_order',
      'placeholder',
    ],
    'id text, name text, role text, term text, batch text, photo_url text, bio text, vision_statement text, is_current boolean, sort_order int, placeholder boolean',
    board,
  );

  await deleteSeed('faq_items');
  await bulkInsert(
    'faq_items',
    ['id', 'category', 'question', 'answer', 'sort_order', 'placeholder'],
    'id text, category text, question text, answer text, sort_order int, placeholder boolean',
    faq,
  );

  await deleteSeed('funds_breakdown');
  await bulkInsert(
    'funds_breakdown',
    ['id', 'category', 'share_percent', 'period', 'sort_order'],
    'id text, category text, share_percent int, period text, sort_order int',
    funds,
  );

  const counts = await sql<{ table_name: string; n: number }[]>`
    select 'feed_posts' as table_name, count(*)::int as n from feed_posts where id like ${`${ID_PREFIX}%`}
    union all select 'donation_goals', count(*)::int from donation_goals where id like ${`${ID_PREFIX}%`}
    union all select 'events', count(*)::int from events where id like ${`${ID_PREFIX}%`}
    union all select 'board_members', count(*)::int from board_members where id like ${`${ID_PREFIX}%`}
    union all select 'faq_items', count(*)::int from faq_items where id like ${`${ID_PREFIX}%`}
    union all select 'funds_breakdown', count(*)::int from funds_breakdown where id like ${`${ID_PREFIX}%`}
    union all select 'goal_updates', count(*)::int from donation_goal_updates where id like ${`${ID_PREFIX}%`}
  `;
  console.log(JSON.stringify(counts));
  await sql.end({ timeout: 5 });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
