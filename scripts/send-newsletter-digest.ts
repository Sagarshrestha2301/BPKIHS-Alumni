/**
 * Sends the monthly digest to every subscribed newsletter address.
 *
 * Run from cron on the application host, for example on the first morning of the month:
 *   5 7 1 * *  cd /srv/bpkihs-alumni && npm run newsletter:digest >> /var/log/bpkihs-newsletter.log 2>&1
 *
 * Preview without sending or writing a campaign:
 *   npm run newsletter:digest -- --dry-run
 *
 * A campaign with this month's subject that already sent is skipped, so a repeated run or a
 * cron retry cannot mail the list twice.
 */
import '../src/server/db/load-env';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { sendMonthlyDigest } = await import('../src/server/services/newsletter');
  const { sql } = await import('../src/server/db/client');

  try {
    const result = await sendMonthlyDigest({ dryRun });
    if (result.skipped) {
      console.log(`Digest already sent this month (${result.subject}); nothing to do.`);
      return;
    }
    if (dryRun) {
      console.log(`Dry run: ${result.subject}`);
      console.log(`${result.recipients} subscribed recipient(s); nothing was sent.`);
      console.log('');
      console.log(result.body);
      return;
    }
    console.log(
      `${result.subject}: ${result.sent} sent, ${result.failed} failed of ${result.recipients}.`,
    );
    if (result.failed > 0) process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
