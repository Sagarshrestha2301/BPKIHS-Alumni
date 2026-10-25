/**
 * Pre-deploy check: `npm run check:env`.
 * Reads `.env.local` for local runs; in CI/deploy the real environment variables win.
 */
import './db/load-env';

import { productionEnvProblems } from './env';

const problems = productionEnvProblems();

if (problems.length > 0) {
  console.error('The production environment is not ready:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('Production environment looks complete.');
