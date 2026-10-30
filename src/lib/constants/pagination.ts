/**
 * Page sizes shared by the browser and the server.
 *
 * These live outside `src/server/config.ts` because client components and the pure query
 * helpers need them at build time, and a server module would pull `process.env` reads into the
 * browser bundle. The server reads the same numbers through `config.pagination`, so a change
 * here moves the API and the UI together.
 */

/** Default page length for public lists and search results. */
export const DEFAULT_PAGE_SIZE = 12;

/** Largest page a client may request from any list endpoint. */
export const MAX_PAGE_SIZE = 100;

/** Rows per page on admin queues (registrations, posts, tickets, subscribers). */
export const ADMIN_PAGE_SIZE = 20;

/** Rows per page on the donation ledger, which is wider than the other admin tables. */
export const DONATION_PAGE_SIZE = 25;

/** Posts added by one "Show more" click in the community feed. */
export const FEED_PAGE_SIZE = 6;

/** Confirmed gifts shown on the public transparency page. */
export const DONOR_PAGE_SIZE = 8;

/** Most recent audit entries the dashboard shows; the table is read-only. */
export const AUDIT_LOG_LIMIT = 200;
