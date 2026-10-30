/**
 * Runs before `next dev` and reports the two things that otherwise surface as a broken page:
 * a port that is already taken, and a database that is not reachable.
 *
 * The port is fatal. The site stays on 3000 because `APP_URL` and Better Auth's origin check
 * both expect `http://localhost:3000`, and `next dev` would otherwise answer a busy port with a
 * raw `EADDRINUSE` stack.
 *
 * The database is only a warning: Next can start while Postgres boots, and `npm run db:up`
 * fixes it without restarting the server. Saying so here means the first page load is not the
 * thing that reports it.
 *
 * This runs as its own step (`npm run dev` chains it with `&&`), not as a wrapper around Next,
 * so the long-lived process tree stays npm → next — the shape Playwright's `webServer` knows
 * how to shut down.
 */
import { lookup } from 'node:dns/promises';
import { connect, createServer } from 'node:net';

import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

const PORT = 3000;
/** Next binds IPv4 and IPv6, so a port taken on either family is taken. */
const HOSTS = ['0.0.0.0', '::'];
const DB_TIMEOUT_MS = 1000;

/** True when this process can bind the port. Non-EADDRINUSE errors (e.g. EACCES) go to Next. */
function canBind(host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.once('error', (error) => resolve(error.code !== 'EADDRINUSE'));
    server.listen({ port: PORT, host, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function portIsFree() {
  for (const host of HOSTS) {
    if (!(await canBind(host))) return false;
  }
  return true;
}

/** One TCP connection attempt; the check only needs to know whether anything answers. */
function canConnect(address, port) {
  return new Promise((resolve) => {
    const socket = connect({ host: address, port });
    const finish = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(DB_TIMEOUT_MS);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

/**
 * Checks the configured database without a query: a refused or silent port is exactly what a
 * page read would report. `localhost` can resolve to `::1` first while Docker publishes IPv4
 * only, so every resolved address is tried rather than just the first.
 */
async function databaseCheck() {
  const url = process.env.DATABASE_URL;
  if (!url) return { ok: false, target: 'the database', detail: 'DATABASE_URL is not set' };

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, target: 'the database', detail: 'DATABASE_URL is not a valid URL' };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  const port = Number(parsed.port || 5432);
  const target = `${host}:${port}`;
  const resolved = await lookup(host, { all: true }).catch(() => []);
  const addresses = resolved.slice(0, 2).map((entry) => entry.address);

  for (const address of addresses.length > 0 ? addresses : [host]) {
    if (await canConnect(address, port)) return { ok: true, target };
  }
  return { ok: false, target, detail: 'no connection on any resolved address' };
}

const database = await databaseCheck();
if (!database.ok) {
  console.warn(
    [
      '',
      `Postgres is not reachable at ${database.target}.`,
      '',
      `  ${database.detail}. Pages that read the database will fail until it is up.`,
      '',
      'Start it with `npm run db:up`, then check http://localhost:3000/api/health.',
      '',
    ].join('\n'),
  );
}

// Checked after the database so both facts are reported: a busy port hides nothing about a
// database that is also down.
if (!(await portIsFree())) {
  console.error(
    [
      '',
      `Port ${PORT} is already in use.`,
      '',
      'Another dev server is probably still running. Stop it, then run `npm run dev` again.',
      `The site stays on http://localhost:${PORT} because the app and Better Auth only accept`,
      'that origin, so it will not move to another port.',
      '',
      'Find the process:',
      `  Windows:      netstat -ano | findstr :${PORT}   then  taskkill /PID <pid> /F`,
      `  macOS/Linux:  lsof -i :${PORT}`,
      '',
    ].join('\n'),
  );
  process.exit(1);
}
