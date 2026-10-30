import { alumniImportRequestSchema } from '@/lib/api/admin-schemas';
import { IMPORT_MAX_BYTES } from '@/lib/api/alumni-import';
import { revalidateDirectory } from '@/server/cache';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { importAlumni, previewAlumniImport } from '@/server/services/alumni-import';
import { writeAudit } from '@/server/services/audit';

/**
 * POST /api/v1/admin/alumni/import
 *
 * `dryRun: true` validates and reports; `dryRun: false` imports every ready row. Both modes
 * re-read the CSV server-side, so the preview a browser saw is never trusted as input.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    // JSON escaping can make the body larger than the CSV itself; the schema still caps the
    // CSV text at IMPORT_MAX_BYTES. The route is admin-only, CSRF-checked and rate-limited.
    const input = await parseBody(request, alumniImportRequestSchema, {
      maxBytes: IMPORT_MAX_BYTES * 2,
    });

    if (input.dryRun) {
      return ok(await previewAlumniImport(input));
    }

    const result = await importAlumni(input, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'import',
      entity: 'alumni',
      detail: {
        filename: input.filename ?? 'register.csv',
        imported: result.imported,
        skipped: result.skipped,
        published: result.published,
      },
    });
    revalidateDirectory();
    return ok(result);
  });
}
