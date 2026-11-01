import { readFileSync } from 'node:fs';

const BASE = process.env.CHECK_BASE ?? 'http://localhost:3000';
const routes = [
  '/',
  '/about',
  '/about/board',
  '/about/how-we-work',
  '/community',
  '/community/newsletter',
  '/events',
  '/donate',
  '/donate/checkout',
  '/donate/transparency',
  '/donate/tribute',
  '/directory',
  '/support',
  '/support/faq',
  '/sign-in',
  '/register',
  '/legal/privacy',
  '/legal/terms',
  '/legal/accessibility',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.webmanifest',
  '/api/health',
];

const seen = new Map();
const jobs = [];
const okPages = [],
  badPages = [],
  badAssets = [];

function walkHtml(html, origin, depth) {
  const urls = new Set();
  for (const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) urls.add(m[1]);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/g)) {
    for (const part of m[1].split(',')) urls.add(part.trim().split(' ')[0]);
  }
  for (const m of html.matchAll(/url\((?:"|')?([^)"']+)/g)) urls.add(m[1]);
  for (const raw of urls) {
    if (raw.startsWith('data:')) continue;
    let u;
    try {
      u = new URL(raw, origin);
    } catch {
      continue;
    }
    if (u.origin !== origin && !u.hostname.endsWith('bpkihs.edu')) continue;
    if (seen.has(u.href)) continue;
    seen.set(u.href, depth);
    if (
      /\.(png|jpe?g|webp|svg|ico|gif)(\?|$)/i.test(u.pathname) ||
      u.pathname.startsWith('/_next/image')
    ) {
      jobs.push({ kind: 'asset', url: u.href, referer: origin });
    } else if (
      depth < 1 &&
      u.pathname.startsWith(origin && '/') &&
      !u.pathname.startsWith('/api/')
    ) {
      if (u.search || u.href.startsWith(basePages(u))) continue;
    } else if (depth < 1 && routes.length) {
      // collect internal page links for extra crawl
      if (u.level ?? (u.level = 1)) {
      }
    }
    if (
      depth < 1 &&
      u.pathname.startsWith('/') &&
      /^\//.test(u.pathname) &&
      !u.pathname.startsWith('/api/') &&
      !u.pathname.startsWith('/_next/')
    ) {
      extraRoutes.add(u.pathname);
    } else if (
      depth < 1 &&
      u.origin === origin &&
      !u.pathname.startsWith('/_next/') &&
      !u.pathname.startsWith('/api/')
    ) {
      extraRoutes.add(u.pathname);
    }
  }
}

const extraRoutes = new Set();
function basePages() {
  return '';
}

let body;
try {
  body = readFileSync(new URL(import.meta.url), 'utf8');
} catch {}
let htmlOut = '';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'img-crawler' } });
  return { res, text: await res.text().catch(() => '') };
}

for (const r of routes) {
  const url = BASE + r;
  try {
    const { res, text } = await fetchText(url);
    if (res.ok || res.status < 400) {
      okPages.push(`${res.status} ${r}`);
      if ((res.headers.get('content-type') || '').includes('html')) {
        htmlOut = text;
        const urls = new Set();
        for (const m of text.matchAll(/(?:src|href)=["']([^"']+)["']/g))
          urls.add(m[1].replace(/&amp;/g, '&'));
        for (const m of text.matchAll(/srcset=["']([^"']+)["']/g)) {
          for (const part of m[1].split(','))
            urls.add(part.trim().split(' ')[0].replace(/&amp;/g, '&'));
        }
        for (const m of text.matchAll(/url\((?:"|')?([^)"']+)/g)) urls.add(m[1]);
        for (const raw of urls) {
          if (raw.startsWith('data:')) continue;
          let u;
          try {
            u = new URL(raw, url);
          } catch {
            continue;
          }
          if (u.hostname.endsWith('bpkihs.edu')) u = u;
          if (u.origin !== BASE && !u.hostname.endsWith('bpkihs.edu')) continue;
          if (seen.has(u.href)) continue;
          seen.set(u.href, 1);
          const isImg =
            /\.(png|jpe?g|webp|svg|ico|gif)(\?|$)/i.test(u.pathname) ||
            u.pathname.startsWith('/_next/image');
          if (isImg) jobs.push({ kind: 'asset', url: u.href, referer: url });
          else if (
            u.origin === BASE &&
            u.pathname.startsWith('/') &&
            !u.pathname.startsWith('/_next/') &&
            !u.pathname.startsWith('/api/')
          )
            extraRoutes.add(u.pathname.split('?')[0]);
        }
      }
    } else badPages.push(`${res.status} ${r}`);
  } catch (e) {
    badPages.push(`ERR ${r}: ${String(e).slice(0, 120)}`);
  }
}

console.log('extra routes discovered:', [...extraRoutes].slice(0, 40).join(' '));

let counted = 0;
const CONC = 12;
for (let i = 0; i < jobs.length; i += CONC) {
  const slice = jobs.slice(i, i + CONC);
  await Promise.all(
    slice.map(async (j) => {
      try {
        const res = await fetch(j.url, { headers: { 'user-agent': 'img-crawler' } });
        counted++;
        if (res.status >= 400) badAssets.push(`${res.status} ${j.url}`);
      } catch (e) {
        badAssets.push(`ERR ${j.url}: ${String(e).slice(0, 80)}`);
      }
    }),
  );
}

console.log(`\npages checked: ${routes.length} (ok ${okPages.length}, bad ${badPages.length})`);
if (badPages.length) console.log('FALLEN PAGES:\n' + badPages.join('\n'));
console.log(`assets checked (followed fetch): ${counted}`);
console.log(`unique href/src scanned: ${seen.size}`);
console.log(`image/asset urls total: ${jobs.length}`);
if (badAssets.length) console.log('BROKEN ASSETS:\n' + badAssets.join('\n'));
else console.log('BROKEN ASSETS: none');
