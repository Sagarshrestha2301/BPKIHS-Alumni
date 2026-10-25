/**
 * Creates the e2e fixture accounts and the scholarship goal in the development database.
 *
 *   npm run db:fixtures
 *
 * The browser suite runs this itself before any test; the command exists so a person can put
 * the same rows in place without starting Playwright.
 */
import { seedFixtures } from './fixtures';

seedFixtures()
  .then(() => {
    console.log(
      'Fixture accounts (admin@bpkihs.local, donor@example.com) and goal-scholarship are in place.',
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
