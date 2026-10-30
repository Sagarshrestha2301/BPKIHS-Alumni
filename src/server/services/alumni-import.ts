import { inArray, sql } from 'drizzle-orm';

import type { AlumniImportMapping, AlumniImportRequest } from '@/lib/api/admin-schemas';
import { type AlumniImportRow, alumniImportRowSchema } from '@/lib/api/admin-schemas';
import {
  IMPORT_FIELDS,
  IMPORT_MAX_ROWS,
  type ImportPreview,
  type ImportResult,
  type ImportRowPreview,
  normaliseProgramme,
  parseCsv,
} from '@/lib/api/alumni-import';
import { ApiError } from '@/lib/api/errors';

import { db } from '../db/client';
import { alumni, user } from '../db/schema';

/**
 * The written register is imported as approved profiles without accounts.
 *
 * - Every row is re-parsed and validated on the server; the browser preview is only a view.
 * - Email is the identity key. An address that already has a profile, or a donor account without
 *   one, is reported and skipped rather than overwritten. The Association resolves those by hand.
 * - Imported rows are `placeholder` and have no `userId`, so they grant nobody a role. When the
 *   person later registers with that address, `submitRegistration()` claims the row.
 * - Email and phone start hidden. The profile is published only when the admin explicitly
 *   chooses it; otherwise it waits in the review queue, because a register row has not
 *   consented to publication. The person can still claim it by registering.
 */

interface Prepared {
  preview: ImportPreview;
  ready: AlumniImportRow[];
}

type Candidate = { row: number; values: AlumniImportRow };
type Failure = { row: number; fullName: string; email: string; message: string };

function cell(cells: readonly string[], column: number | null): string {
  if (column === null) return '';
  return (cells[column] ?? '').trim();
}

function assertMapping(mapping: AlumniImportMapping, headers: readonly string[]): void {
  for (const field of IMPORT_FIELDS) {
    if (field.required && mapping[field.key] === null) {
      throw new ApiError('validation', `Map the ${field.label.toLowerCase()} column.`);
    }
  }

  for (const field of IMPORT_FIELDS) {
    const column = mapping[field.key];
    if (column !== null && column >= headers.length) {
      throw new ApiError('validation', 'The column mapping does not match this file.');
    }
  }
}

function buildCandidate(cells: readonly string[], mapping: AlumniImportMapping): unknown {
  const programme = normaliseProgramme(cell(cells, mapping.programme));
  const year = cell(cells, mapping.batchYear).replace(/,/g, '');

  return {
    fullName: cell(cells, mapping.fullName),
    email: cell(cells, mapping.email),
    phone: cell(cells, mapping.phone),
    programme: programme ?? '',
    batchYear: year === '' ? Number.NaN : Number(year),
    furtherStudies: cell(cells, mapping.furtherStudies),
    currentPosition: cell(cells, mapping.currentPosition),
    organisation: cell(cells, mapping.organisation),
    city: cell(cells, mapping.city),
    country: cell(cells, mapping.country),
    note: cell(cells, mapping.note),
  };
}

async function existingEmails(emails: string[]): Promise<{
  profiles: Set<string>;
  accounts: Set<string>;
}> {
  if (emails.length === 0) return { profiles: new Set(), accounts: new Set() };

  const [profiles, accounts] = await Promise.all([
    db
      .select({ email: alumni.email })
      .from(alumni)
      .where(inArray(sql`lower(${alumni.email})`, emails)),
    db
      .select({ email: user.email })
      .from(user)
      .where(inArray(sql`lower(${user.email})`, emails)),
  ]);

  return {
    profiles: new Set(profiles.map((row) => row.email.toLowerCase())),
    accounts: new Set(accounts.map((row) => row.email.toLowerCase())),
  };
}

async function prepare(input: AlumniImportRequest): Promise<Prepared> {
  const parsed = parseCsv(input.csv);
  if (parsed.headers.length === 0) {
    throw new ApiError('validation', 'That file has no header row. Add column names first.');
  }
  if (parsed.rows.length > IMPORT_MAX_ROWS) {
    throw new ApiError(
      'validation',
      `Import at most ${IMPORT_MAX_ROWS} rows at a time. Split the file and try again.`,
    );
  }

  assertMapping(input.mapping, parsed.headers);

  const candidates: Candidate[] = [];
  const failures: Failure[] = [];

  for (const row of parsed.rows) {
    const raw = buildCandidate(row.cells, input.mapping);
    const result = alumniImportRowSchema.safeParse(raw);

    if (!result.success) {
      const messages = [...new Set(result.error.issues.map((issue) => issue.message))];
      failures.push({
        row: row.row,
        fullName: cell(row.cells, input.mapping.fullName),
        email: cell(row.cells, input.mapping.email),
        message: messages.join(' '),
      });
      continue;
    }

    candidates.push({ row: row.row, values: result.data });
  }

  const emails = [...new Set(candidates.map((candidate) => candidate.values.email))];
  const existing = await existingEmails(emails);

  // A file that repeats an address would otherwise create two profiles for one person. The
  // first occurrence wins; later ones are reported like any other duplicate.
  const seenInFile = new Set<string>();
  const repeatedInFile = new Set<number>();
  for (const candidate of candidates) {
    if (seenInFile.has(candidate.values.email)) {
      repeatedInFile.add(candidate.row);
    } else {
      seenInFile.add(candidate.values.email);
    }
  }

  const previewRows: ImportRowPreview[] = [];
  const ready: AlumniImportRow[] = [];
  let duplicateRows = 0;

  for (const candidate of candidates) {
    const email = candidate.values.email;
    let message = '';

    if (repeatedInFile.has(candidate.row)) {
      message = 'The same email appears earlier in this file.';
    } else if (existing.profiles.has(email)) {
      message = 'A profile with this email is already on file.';
    } else if (existing.accounts.has(email)) {
      message =
        'A donor account with this email exists without an alumni profile. Resolve it by hand.';
    }

    if (message) {
      duplicateRows += 1;
      previewRows.push({
        row: candidate.row,
        fullName: candidate.values.fullName,
        email,
        status: 'duplicate',
        message,
      });
    } else {
      ready.push(candidate.values);
      previewRows.push({
        row: candidate.row,
        fullName: candidate.values.fullName,
        email,
        status: 'ready',
        message: '',
      });
    }
  }

  for (const failure of failures) {
    previewRows.push({ ...failure, status: 'invalid' });
  }

  previewRows.sort((left, right) => left.row - right.row);

  return {
    ready,
    preview: {
      totalRows: parsed.rows.length,
      readyRows: ready.length,
      duplicateRows,
      invalidRows: failures.length,
      rows: previewRows,
    },
  };
}

export async function previewAlumniImport(input: AlumniImportRequest): Promise<ImportPreview> {
  return (await prepare(input)).preview;
}

export async function importAlumni(
  input: AlumniImportRequest,
  adminId: string,
): Promise<ImportResult> {
  const { ready, preview } = await prepare(input);
  if (ready.length === 0) {
    return { imported: 0, skipped: preview.totalRows, published: input.publish };
  }

  const now = new Date();
  const values = ready.map((row) => ({
    id: `alumnus-${crypto.randomUUID()}`,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || null,
    programme: row.programme,
    batchYear: row.batchYear,
    furtherStudies: row.furtherStudies || null,
    currentPosition: row.currentPosition || null,
    organisation: row.organisation || null,
    city: row.city || null,
    country: row.country,
    note: row.note || null,
    expertise: [] as string[],
    privacyEmail: 'hidden' as const,
    privacyPhone: 'hidden' as const,
    privacyProfile: 'public' as const,
    status: input.publish ? ('approved' as const) : ('pending' as const),
    source: 'csv_import' as const,
    placeholder: true,
    approvedAt: input.publish ? now : null,
    approvedBy: input.publish ? adminId : null,
    createdAt: now,
    updatedAt: now,
  }));

  await db.transaction(async (tx) => {
    for (let index = 0; index < values.length; index += 100) {
      await tx.insert(alumni).values(values.slice(index, index + 100));
    }
  });

  return {
    imported: values.length,
    skipped: preview.totalRows - values.length,
    published: input.publish,
  };
}
