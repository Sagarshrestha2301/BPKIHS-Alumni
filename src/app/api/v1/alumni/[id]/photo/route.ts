import { getSession } from '@/server/auth/session';
import { handle } from '@/server/http/respond';
import { readProfilePhoto } from '@/server/services/photos';

/**
 * GET /api/v1/alumni/[id]/photo : the only way a stored profile photo is served.
 *
 * The database decides whether the record is approved and who may see it. The owner and an
 * administrator can preview pending work; the public directory never learns a file path.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await context.params;
    const session = await getSession();
    const role = session?.user.role;

    const photo = await readProfilePhoto(id, {
      userId: session?.user.id,
      isAlumnus: role === 'alumni' || role === 'admin',
      isAdmin: role === 'admin',
    });

    const headers = new Headers({
      'Content-Type': photo.contentType,
      'Cache-Control': photo.cacheControl,
      ETag: photo.etag,
      'Content-Disposition': 'inline; filename="profile-photo.webp"',
      'X-Robots-Tag': 'noindex',
      Vary: 'Cookie',
    });

    if (request.headers.get('if-none-match') === photo.etag) {
      return new Response(null, { status: 304, headers });
    }

    headers.set('Content-Length', String(photo.data.byteLength));
    return new Response(new Uint8Array(photo.data), { status: 200, headers });
  });
}
