/**
 * Reading the Association's written register.
 *
 * The importer accepts any column names: the admin maps them to these fields once, the server
 * validates every row with the same rules the public form uses, and the browser only displays
 * the preview. Nothing here trusts a cell.
 *
 * This module is shared by the client (to read the header row and guess the mapping) and the
 * server (which parses the whole file again). It must stay free of Node-only imports.
 */
import { type Programme, PROGRAMMES } from '@/lib/constants/domain';

/** One import cannot exceed these; the admin splits a larger register into several files. */
export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_MAX_BYTES = 1024 * 1024;

export const IMPORT_FIELDS = [
  { key: 'fullName', label: 'Full name', required: true },
  { key: 'email', label: 'Email address', required: true },
  { key: 'programme', label: 'Programme', required: true },
  { key: 'batchYear', label: 'Batch year', required: true },
  { key: 'country', label: 'Country', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'currentPosition', label: 'Current position', required: false },
  { key: 'organisation', label: 'Organisation', required: false },
  { key: 'furtherStudies', label: 'Further studies', required: false },
  { key: 'note', label: 'Note', required: false },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]['key'];
export type ImportMapping = Record<ImportField, number | null>;

export interface ParsedRow {
  /** 1-based row number in the file, including the header. */
  row: number;
  cells: string[];
}

export interface ParsedCsv {
  headers: string[];
  rows: ParsedRow[];
}

export interface ImportRowPreview {
  row: number;
  fullName: string;
  email: string;
  status: 'ready' | 'duplicate' | 'invalid';
  message: string;
}

export interface ImportPreview {
  totalRows: number;
  readyRows: number;
  duplicateRows: number;
  invalidRows: number;
  rows: ImportRowPreview[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  /** True when the rows were approved for the directory; false when held for review. */
  published: boolean;
}

/**
 * A small RFC 4180-style reader. It handles a BOM, quoted fields, doubled quotes, commas and
 * newlines inside quotes, and CRLF or LF line endings. It deliberately does not trim cells:
 * the caller decides what whitespace means for each field.
 */
export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^\uFEFF/, '');
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else if (char === '\r') {
      if (text[index + 1] === '\n') continue;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const headerIndex = records.findIndex((cells) => cells.some((cell) => cell.trim() !== ''));
  if (headerIndex < 0) return { headers: [], rows: [] };

  const headers = (records[headerIndex] ?? []).map((cell) => cell.trim());
  const rows: ParsedRow[] = [];
  for (let index = headerIndex + 1; index < records.length; index += 1) {
    const cells = records[index] ?? [];
    if (!cells.some((cell) => cell.trim() !== '')) continue;
    rows.push({ row: index + 1, cells });
  }

  return { headers, rows };
}

/* ---------- mapping ---------- */

const HEADER_ALIASES: Record<ImportField, readonly string[]> = {
  fullName: [
    'full name',
    'name',
    'alumnus',
    'alumnus name',
    'alumni name',
    'member name',
    'student name',
  ],
  email: ['email', 'email address', 'e mail', 'mail'],
  programme: ['programme', 'program', 'course', 'degree', 'course name'],
  batchYear: [
    'batch',
    'batch year',
    'graduation year',
    'year of graduation',
    'passing year',
    'year',
  ],
  country: ['country', 'country of residence', 'current country'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'contact', 'contact number'],
  city: ['city', 'town', 'location', 'current city'],
  currentPosition: ['position', 'current position', 'designation', 'job title', 'role'],
  organisation: [
    'organisation',
    'organization',
    'institution',
    'workplace',
    'employer',
    'hospital',
  ],
  furtherStudies: ['further studies', 'higher studies', 'postgraduate studies', 'specialisation'],
  note: ['note', 'notes', 'bio', 'about', 'about you'],
};

function normaliseHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Guesses a column index for each field. The admin can change every guess in the UI. */
export function detectMapping(headers: readonly string[]): ImportMapping {
  const normalised = headers.map(normaliseHeader);
  const used = new Set<number>();
  const mapping = {} as ImportMapping;

  for (const field of IMPORT_FIELDS) {
    const aliases = HEADER_ALIASES[field.key];
    const index = normalised.findIndex(
      (header, column) => !used.has(column) && aliases.includes(header),
    );
    mapping[field.key] = index >= 0 ? index : null;
    if (index >= 0) used.add(index);
  }

  return mapping;
}

/* ---------- programmes ---------- */

const PROGRAMME_ALIASES: Record<string, Programme> = {
  mbbs: 'MBBS',
  bds: 'BDS',
  bmit: 'BMIT',
  'bsc nursing': 'BSc Nursing',
  'bachelor of nursing': 'BSc Nursing',
  'allied health': 'Allied Health',
  allied: 'Allied Health',
  'md ms': 'MD/MS',
  'md/ms': 'MD/MS',
  md: 'MD/MS',
  ms: 'MD/MS',
  msc: 'MSc',
  mds: 'MDS',
  'dm mch': 'DM/MCh',
  'dm/mch': 'DM/MCh',
  dm: 'DM/MCh',
  mch: 'DM/MCh',
  phd: 'PhD',
  fellowship: 'Fellowship',
};

/**
 * Maps what a register usually writes ("B.Sc. Nursing", "MD", "M.Ch") to the programme enum.
 * Returns null for anything unrecognised so the row is reported rather than guessed.
 */
export function normaliseProgramme(value: string): Programme | null {
  const key = value.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  if (!key) return null;

  const alias = PROGRAMME_ALIASES[key];
  if (alias) return alias;

  return PROGRAMMES.find((programme) => programme.toLowerCase() === key) ?? null;
}
