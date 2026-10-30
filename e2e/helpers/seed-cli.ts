/**
 * Creates the fixture rows the browser suite needs in the development database: two accounts,
 * three giving goals, three upcoming events, three published posts and board members.
 *
 *   npm run db:fixtures
 *
 * The browser suite runs this itself before any test; the command exists so a person can put
 * the same rows in place without starting Playwright.
 */
import { seedFixtures } from './fixtures';

seedFixtures()
  .then(() => {
    console.log('Fixture accounts and content are in place.');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
