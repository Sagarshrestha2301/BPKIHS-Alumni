/**
 * Generates the branding assets the site links from its metadata:
 *
 *   public/og-image.jpg        1200 × 630 link-preview image
 *   public/icons/icon-192.png  PWA icons
 *   public/icons/icon-512.png
 *   public/icons/maskable-512.png
 *   public/apple-touch-icon.png
 *   src/app/favicon.ico        32 px + 16 px PNG-in-ICO
 *
 * Everything is derived from two files that already exist : `public/bp-koirala_logo.png` and
 * `public/hero-bpkihs-campus.jpg` : so replacing the photograph or the logo is a re-run:
 *
 *   npx tsx scripts/generate-brand-assets.ts
 *
 * The og image repeats the photograph's credit in the artwork itself, because a shared
 * preview travels without the page that carries the on-page credit.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const ROOT = path.resolve(process.cwd());
const OUT_PUBLIC = path.join(ROOT, 'public');
const OUT_ICONS = path.join(OUT_PUBLIC, 'icons');
const OUT_FAVICON = path.join(ROOT, 'src', 'app', 'favicon.ico');

/** From `src/content/home.ts` : keep the two in sync when the copy or the photo changes. */
const HEADLINE = 'Connected by BPKIHS. Wherever life takes us.';
const MISSION =
  'A place to find old classmates, hear what alumni are doing and stay connected with the institute in Dharan.';
const CREDIT = 'Photo: B.P. Koirala Institute of Health Sciences, Dharan (bpkihs.edu)';

const NAVY = '#0b2a4a';
const CREAM = '#e6eef7';

/**
 * Scales an SVG through sharp's font stack. Georgia is the closest system match to the site's
 * Source Serif; the fallbacks keep the layout usable on a machine without it.
 */
function svg(inner: string, width: number, height: number): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`,
  );
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Wraps to a maximum line length so the headline breaks where it should at 1200 px. */
function wrap(text: string, maxCharacters: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildOgImage(): Promise<void> {
  const hero = await readFile(path.join(OUT_PUBLIC, 'hero-bpkihs-campus.jpg'));
  const logo = await readFile(path.join(OUT_PUBLIC, 'bp-koirala_logo.png'));

  const background = await sharp(hero)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .toBuffer();

  // Same treatment as the hero band: a flat wash for contrast, then a left-to-right gradient
  // so the campus still opens up behind the copy.
  const overlay = svg(
    `<rect width="1200" height="630" fill="${NAVY}" fill-opacity="0.5"/>
     <rect width="1200" height="630" fill="url(#g)"/>
     <defs>
       <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0" stop-color="${NAVY}" stop-opacity="0.95"/>
         <stop offset="0.55" stop-color="${NAVY}" stop-opacity="0.75"/>
         <stop offset="1" stop-color="${NAVY}" stop-opacity="0.3"/>
       </linearGradient>
     </defs>`,
    1200,
    630,
  );

  const headlineLines = wrap(HEADLINE, 26);
  const headline = headlineLines
    .map(
      (line, index) =>
        `<text x="72" y="${300 + index * 66}" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`,
    )
    .join('');
  const missionTop = 300 + headlineLines.length * 66 + 24;

  const copy = svg(
    `<text x="72" y="170" font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="5" fill="${CREAM}">${escapeXml('BPKIHS ALUMNI ASSOCIATION')}</text>
     ${headline}
     <text x="72" y="${missionTop}" font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="27" fill="${CREAM}">${escapeXml(MISSION)}</text>
     <text x="72" y="576" font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="17" fill="${CREAM}" fill-opacity="0.75">${escapeXml(CREDIT)}</text>`,
    1200,
    630,
  );

  // The seal reads as an official stamp on white, and white keeps it legible on any surface.
  // The circle is composited before the seal, and sits above the headline's line box.
  const badge = svg(`<circle cx="1064" cy="142" r="92" fill="#ffffff"/>`, 1200, 630);
  const seal = await sharp(logo).resize(146, 146).png().toBuffer();

  await sharp(background)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: badge, top: 0, left: 0 },
      { input: seal, top: 69, left: 991 },
      { input: copy, top: 0, left: 0 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(OUT_PUBLIC, 'og-image.jpg'));

  console.log('public/og-image.jpg');
}

/** The seal on white, padded by `pad` on each side : the maskable safe zone wants 20 %. */
async function buildIcon(size: number, padRatio: number, background: string): Promise<Buffer> {
  const logo = await readFile(path.join(OUT_PUBLIC, 'bp-koirala_logo.png'));
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([
      { input: await sharp(logo).resize(inner, inner).png().toBuffer(), top: pad, left: pad },
    ])
    .png()
    .toBuffer();
}

async function buildIcons(): Promise<void> {
  await mkdir(OUT_ICONS, { recursive: true });

  await buildIcon(192, 0.08, '#ffffff').then((b) =>
    writeFile(path.join(OUT_ICONS, 'icon-192.png'), b),
  );
  await buildIcon(512, 0.08, '#ffffff').then((b) =>
    writeFile(path.join(OUT_ICONS, 'icon-512.png'), b),
  );
  // Maskable icons lose anything outside the inner 80 %, so the seal stays fully visible.
  await buildIcon(512, 0.2, '#ffffff').then((b) =>
    writeFile(path.join(OUT_ICONS, 'maskable-512.png'), b),
  );
  await buildIcon(180, 0.08, '#ffffff').then((b) =>
    writeFile(path.join(OUT_PUBLIC, 'apple-touch-icon.png'), b),
  );
  console.log('public/icons/*, public/apple-touch-icon.png');
}

/**
 * A minimal ICO container: the header plus one directory entry per PNG payload. Windows and
 * every browser since IE9 accept PNG-compressed entries, so no re-encoding is needed.
 */
async function buildFavicon(): Promise<void> {
  const logo = await readFile(path.join(OUT_PUBLIC, 'bp-koirala_logo.png'));
  const sizes = [32, 16];
  const images: Buffer[] = [];

  for (const size of sizes) {
    images.push(
      await sharp({
        create: { width: size, height: size, channels: 4, background: '#ffffff' },
      })
        .composite([
          {
            input: await sharp(logo)
              .resize(Math.round(size * 0.86), Math.round(size * 0.86))
              .png()
              .toBuffer(),
            top: Math.round(size * 0.07),
            left: Math.round(size * 0.07),
          },
        ])
        .png()
        .toBuffer(),
    );
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries: Buffer[] = [];

  images.forEach((image, index) => {
    const size = sizes.at(index) ?? 32;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += image.length;
  });

  await writeFile(OUT_FAVICON, Buffer.concat([header, ...entries, ...images]));
  console.log('src/app/favicon.ico');
}

async function main() {
  await buildOgImage();
  await buildIcons();
  await buildFavicon();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
