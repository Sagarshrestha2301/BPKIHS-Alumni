import { photoCopy } from '@/content/photo';
import { ApiError } from '@/lib/api/errors';
import { PHOTO_FORM_OVERHEAD_BYTES } from '@/lib/constants/photo';
import { requireSession } from '@/server/auth/session';
import { revalidateDirectory } from '@/server/cache';
import { config } from '@/server/config';
import { assertCsrf } from '@/server/http/csrf';
import { readMultipart } from '@/server/http/multipart';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok } from '@/server/http/respond';
import { removeOwnPhoto, saveOwnPhoto } from '@/server/services/photos';

const MAX_FORM_BYTES = config.photos.maxBytes + PHOTO_FORM_OVERHEAD_BYTES;

/**
 * POST /api/v1/account/photo : upload or replace the signed-in member's photo.
 *
 * The profile is found from the session, never from a supplied id, so one member cannot write
 * to another's record. The route is CSRF-checked, origin-checked and limited before the body
 * is read; `readMultipart` then caps the upload well below the global JSON limit.
 */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'photo');
    const session = await requireSession();

    const form = await readMultipart(request, MAX_FORM_BYTES);
    const photo = form.get('photo');
    if (!(photo instanceof File)) {
      throw new ApiError('validation', 'Choose a photo to upload.', {
        fieldErrors: { photo: photoCopy.errors.empty },
      });
    }

    const result = await saveOwnPhoto(session.user.id, photo, form.get('consent') === 'true');
    revalidateDirectory();
    return ok(result, 201);
  });
}

/** DELETE /api/v1/account/photo : remove the photo and withdraw publication consent. */
export async function DELETE(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'photo');
    const session = await requireSession();

    const result = await removeOwnPhoto(session.user.id);
    revalidateDirectory();
    return ok(result);
  });
}
