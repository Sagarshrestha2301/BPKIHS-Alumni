import './load-env';

import { sql } from './client';

/**
 * Fills the alumni directory with realistic Nepali BPKIHS graduates.
 *
 *   npm run db:seed-alumni
 *   COUNT=200 npm run db:seed-alumni    (any positive count, 100 by default)
 *
 * Every row is an approved, self-consistent directory entry: the programme stays inside
 * the database enum, batch years sit inside BPKIHS history (1994 names the first MBBS
 * intake), and positions and organisations are places a BPKIHS graduate would plausibly
 * work. Emails sit on example.org, a reserved domain with no mailboxes, so no real
 * person can ever be reached from a seeded row.
 *
 * Safe to run repeatedly: the seed owns every id prefixed `alumni-seed-` and replaces
 * exactly those rows, so nothing duplicates and hand-made rows are never touched.
 */

const SEED_ID_PREFIX = 'alumni-seed-';
const DEFAULT_COUNT = 100;

type Programme =
  'MBBS' | 'BDS' | 'BMIT' | 'BSc Nursing' | 'Allied Health' | 'MD/MS' | 'MSc' | 'MDS';

interface SeedRow {
  id: string;
  fullName: string;
  email: string;
  programme: Programme;
  batchYear: number;
  furtherStudies: string | null;
  currentPosition: string;
  organisation: string;
  city: string;
  country: string;
  expertise: string[];
}

/* Deterministic helpers: identical COUNT always yields the identical directory. */

function pick<T>(list: readonly T[], index: number): T {
  return list[index % list.length] as T;
}

const GIVEN = [
  'Rajesh',
  'Prakash',
  'Bikash',
  'Sunita',
  'Anjana',
  'Kiran',
  'Nabin',
  'Deepa',
  'Laxmi',
  'Sushil',
  'Ramesh',
  'Gita',
  'Manish',
  'Asmita',
  'Sanjay',
  'Puja',
  'Ram',
  'Krishna',
  'Sarita',
  'Binita',
  'Ashish',
  'Preeti',
  'Roshan',
  'Jyoti',
  'Dipesh',
  'Nirmala',
  'Bijay',
  'Sabina',
  'Hari',
  'Shraddha',
  'Milan',
  'Ishwor',
  'Bhawana',
  'Sabin',
  'Anish',
  'Rekha',
  'Devendra',
  'Mandira',
  'Prem',
  'Umesh',
  'Janaki',
  'Ghanashyam',
  'Sarala',
  'Ujjwal',
  'Bandana',
  'Binod',
  'Kabita',
  'Tara',
] as const;

const FAMILY = [
  'Adhikari',
  'Bhandari',
  'Baral',
  'Basnet',
  'Chapagain',
  'Chaudhary',
  'Dahal',
  'Dhakal',
  'Gautam',
  'Giri',
  'Gurung',
  'Jha',
  'Kafle',
  'Karki',
  'Khanal',
  'Koirala',
  'Lamsal',
  'Limbu',
  'Magar',
  'Mishra',
  'Nepal',
  'Pandey',
  'Paudel',
  'Pokharel',
  'Rai',
  'Rana',
  'Regmi',
  'Sapkota',
  'Sharma',
  'Shrestha',
  'Thakur',
  'Thapa',
  'Upadhyaya',
  'Yadav',
] as const;

const PROGRAMME_CYCLE: readonly Programme[] = [
  'MBBS',
  'MBBS',
  'MBBS',
  'MD/MS',
  'MBBS',
  'BDS',
  'MBBS',
  'BSc Nursing',
  'MD/MS',
  'MBBS',
  'BMIT',
  'MBBS',
  'MSc',
  'MBBS',
  'Allied Health',
  'MD/MS',
  'BDS',
  'MBBS',
  'MDS',
  'BSc Nursing',
];

interface Placement {
  currentPosition: string;
  organisation: string;
  city: string;
  country: string;
}

const HOME_PLACEMENTS: readonly Placement[] = [
  {
    currentPosition: 'Consultant physician',
    organisation: 'BPKIHS, Dharan',
    city: 'Dharan',
    country: 'Nepal',
  },
  {
    currentPosition: 'Resident doctor, internal medicine',
    organisation: 'Nobel Medical College',
    city: 'Biratnagar',
    country: 'Nepal',
  },
  {
    currentPosition: 'Senior registrar, paediatrics',
    organisation: 'Kanti Children’s Hospital',
    city: 'Kathmandu',
    country: 'Nepal',
  },
  {
    currentPosition: 'Medical officer, primary care',
    organisation: 'Phidim Hospital',
    city: 'Phidim',
    country: 'Nepal',
  },
  {
    currentPosition: 'Registrar, obstetrics',
    organisation: 'Maternity Hospital',
    city: 'Kathmandu',
    country: 'Nepal',
  },
  {
    currentPosition: 'Assistant professor, community medicine',
    organisation: 'BPKIHS, Dharan',
    city: 'Dharan',
    country: 'Nepal',
  },
  {
    currentPosition: 'Duty doctor, emergency',
    organisation: 'Biratnagar Provincial Hospital',
    city: 'Biratnagar',
    country: 'Nepal',
  },
  {
    currentPosition: 'Family physician',
    organisation: 'Hetauda Hospital',
    city: 'Hetauda',
    country: 'Nepal',
  },
  {
    currentPosition: 'Registrar, orthopaedics',
    organisation: 'Civil Service Hospital',
    city: 'Kathmandu',
    country: 'Nepal',
  },
  {
    currentPosition: 'District health officer',
    organisation: 'Health Office',
    city: 'Dhankuta',
    country: 'Nepal',
  },
  {
    currentPosition: 'Consultant surgeon',
    organisation: 'Chitwan Medical College',
    city: 'Bharatpur',
    country: 'Nepal',
  },
  {
    currentPosition: 'Resident doctor, anaesthesiology',
    organisation: 'TU Teaching Hospital',
    city: 'Kathmandu',
    country: 'Nepal',
  },
  {
    currentPosition: 'Lecturer, anatomy',
    organisation: 'BPKIHS, Dharan',
    city: 'Dharan',
    country: 'Nepal',
  },
  {
    currentPosition: 'House officer, internal medicine',
    organisation: 'Lumbini Provincial Hospital',
    city: 'Butwal',
    country: 'Nepal',
  },
  {
    currentPosition: 'Registrar, psychiatry',
    organisation: 'Mental Hospital',
    city: 'Latkini',
    country: 'Nepal',
  },
  {
    currentPosition: 'Medical officer, reproductive health',
    organisation: 'Marie Stopes Centre',
    city: 'Itahari',
    country: 'Nepal',
  },
];

const ABROAD_PLACEMENTS: readonly Placement[] = [
  {
    currentPosition: 'Resident, internal medicine',
    organisation: 'Abbott Northwestern Hospital',
    city: 'Minneapolis',
    country: 'United States',
  },
  {
    currentPosition: 'Registrar, emergency medicine',
    organisation: 'Box Hill Hospital',
    city: 'Melbourne',
    country: 'Australia',
  },
  {
    currentPosition: 'Clinical observer',
    organisation: 'National Health Service',
    city: 'London',
    country: 'United Kingdom',
  },
  {
    currentPosition: 'Nurse educator',
    organisation: 'Fraser Health',
    city: 'Vancouver',
    country: 'Canada',
  },
  {
    currentPosition: 'Laboratory technologist',
    organisation: 'Al Jalila Children’s Hospital',
    city: 'Dubai',
    country: 'United Arab Emirates',
  },
  {
    currentPosition: 'Clinical fellow, cardiology',
    organisation: 'Manipal Hospital',
    city: 'Bengaluru',
    country: 'India',
  },
  {
    currentPosition: 'Dental surgeon',
    organisation: 'Ministry of Public Health',
    city: 'Doha',
    country: 'Qatar',
  },
  {
    currentPosition: 'Health policy analyst',
    organisation: 'Australian Institute of Health',
    city: 'Canberra',
    country: 'Australia',
  },
];

const DENTAL_POSITIONS = [
  'Dental surgeon',
  'Consultant prosthodontist',
  'Registrar, oral surgery',
  'Orthodontist',
] as const;
const NURSING_POSITIONS = [
  'Staff nurse',
  'Nursing in-charge',
  'Nursing educator',
  'Midwife supervisor',
] as const;
const ALLIED_POSITIONS = [
  'Radiographer',
  'Physiotherapist',
  'Laboratory technologist',
  'Pharmacist',
  'Optometrist',
] as const;

const EXPERTISE_POOL = [
  'Public health',
  'Emergency medicine',
  'Surgery',
  'Internal medicine',
  'Paediatrics',
  'Obstetrics and gynaecology',
  'Community medicine',
  'Medical education',
  'Radiology',
  'Anaesthesiology',
  'Orthopaedics',
  'Dental public health',
  'Nursing management',
  'Health policy',
  'Epidemiology',
  'Telemedicine',
] as const;

const FURTHER_STUDIES: readonly (string | undefined)[] = [
  undefined,
  undefined,
  undefined,
  'FRCS (Edinburgh)',
  'MPH, Tribhuvan University',
  'Fellowship in minimal-access surgery',
  'PhD epidemiology (in progress)',
];

function placementFor(programme: Programme, home: Placement, index: number): Placement {
  if (programme === 'BDS') {
    return { ...home, currentPosition: pick(DENTAL_POSITIONS, index) };
  }
  if (programme === 'BSc Nursing') {
    return { ...home, currentPosition: pick(NURSING_POSITIONS, index) };
  }
  if (programme === 'BMIT' || programme === 'Allied Health' || programme === 'MSc') {
    return { ...home, currentPosition: pick(ALLIED_POSITIONS, index) };
  }
  return home;
}

function buildSeedRows(count: number): SeedRow[] {
  const rows: SeedRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const programme = pick(PROGRAMME_CYCLE, i);
    const fullName = `${pick(GIVEN, i)} ${pick(FAMILY, Math.floor(i / 3))}`;
    // MBBS started 1994; the postgraduate and allied programmes follow later.
    const baseYear =
      programme.startsWith('M') && programme !== 'MBBS' ? 2003 : programme === 'MBBS' ? 1994 : 2000;
    const batchYear = baseYear + (i % 26);
    // Roughly one in seven qualified and moved abroad.
    const abroad = i % 7 === 6;
    const base = abroad ? pick(ABROAD_PLACEMENTS, i) : pick(HOME_PLACEMENTS, i);
    const placement = placeforPlacement(programme, base, i);
    const expertise = [pick(EXPERTISE_POOL, i), pick(EXPERTISE_POOL, i + 7)].filter(
      (item, index, same) => same.indexOf(item) === index,
    );
    rows.push({
      id: `${SEED_ID_PREFIX}${String(i + 1).padStart(4, '0')}`,
      fullName,
      email: `${SEED_ID_PREFIX}${String(i + 1).padStart(4, '0')}@example.org`,
      programme,
      batchYear,
      furtherStudies: pick(FURTHER_STUDIES, i) ?? null,
      currentPosition: placement.currentPosition,
      organisation: placement.organisation,
      city: placement.city,
      country: placement.country,
      expertise,
    });
  }
  return rows;
}

function placeforPlacement(programme: Programme, base: Placement, index: number): Placement {
  return placementFor(programme, base, index);
}

async function main(): Promise<void> {
  const wanted = Number.parseInt(process.env.COUNT ?? String(DEFAULT_COUNT), 10);
  if (!Number.isFinite(wanted) || wanted < 1) {
    throw new Error('COUNT must be a positive whole number.');
  }

  const rows = buildSeedRows(wanted);
  const now = new Date().toISOString();

  // Deterministic reset: the seed owns its own id range and nothing else.
  await sql`delete from alumni where id like ${`${SEED_ID_PREFIX}%`}`;

  await sql`
    insert into alumni (
      id, user_id, full_name, email, programme, batch_year, further_studies,
      current_position, organisation, city, country, note, expertise,
      privacy_email, privacy_phone, privacy_profile, status, source, placeholder,
      approved_at, created_at, updated_at
    )
    select *
    from jsonb_to_recordset(${JSON.stringify(
      rows.map((row) => ({
        id: row.id,
        user_id: null,
        full_name: row.fullName,
        email: row.email,
        programme: row.programme,
        batch_year: row.batchYear,
        further_studies: row.furtherStudies,
        current_position: row.currentPosition,
        organisation: row.organisation,
        city: row.city,
        country: row.country,
        note: null,
        expertise: row.expertise,
        privacy_email: 'hidden',
        privacy_phone: 'hidden',
        privacy_profile: 'public',
        status: 'approved',
        source: 'csv_import',
        placeholder: false,
        approved_at: now,
        created_at: now,
        updated_at: now,
      })),
    )}::jsonb) as x(
      id text, user_id text, full_name text, email text, programme programme,
      batch_year int, further_studies text, current_position text, organisation text,
      city text, country text, note text, expertise text[],
      privacy_email visibility, privacy_phone visibility, privacy_profile visibility,
      status approval_status, source alumni_source, placeholder boolean,
      approved_at timestamptz, created_at timestamptz, updated_at timestamptz
    )
  `;

  const stats = await sql<{ count: number }[]>`
    select count(*)::int as count from alumni where id like ${`${SEED_ID_PREFIX}%`}
  `;
  const seeded = stats[0]?.count;

  console.log(`Seeded ${rows.length} Nepali alumni rows into the directory.`);
  console.log(`Alumni rows with seed ids now in the database: ${seeded ?? 'unknown'}.`);
  await sql.end({ timeout: 5 });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
