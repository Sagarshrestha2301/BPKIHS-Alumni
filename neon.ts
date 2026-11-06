import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  // Declare your Neon services here
  preview: {
    realtime: true,
  },
  auth: true,
  functions: {
    cleanup: {
      name: 'Nightly cleanup + report',
      // Runs at 03:30 UTC every day = 09:15 Nepal time (NPT = UTC+5:45).
      // Declared on the production branch of the `post` project, so every query below
      // lands on the same database the live Vercel app reads and writes.
      source: './neon-functions/nightly-cleanup.ts',
    },
  },
  triggers: {
    nightly: {
      type: 'schedule',
      function: 'cleanup',
      cron: '30 3 * * *',
      functionPath: '/',
    },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: '7d' };
    }
    // Existing branch: no changes
    return {};
  },
});
