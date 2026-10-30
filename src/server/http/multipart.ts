import { ApiError } from '@/lib/api/errors';

/**
 * Reads one multipart form with a hard byte ceiling.
 *
 * `request.formData()` would buffer an arbitrarily large body before any size check. This
 * reads the stream chunk by chunk, cancels as soon as the limit is crossed, and only then
 * asks the runtime to parse the bounded bytes.
 */
export async function readMultipart(request: Request, maxBytes: number): Promise<FormData> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    throw new ApiError('validation', 'Send the upload as multipart/form-data.', { status: 415 });
  }

  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ApiError('validation', 'That upload is too large.', { status: 413 });
  }

  if (!request.body) throw new ApiError('validation', 'The upload is empty.');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new ApiError('validation', 'That upload is too large.', { status: 413 });
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('validation', 'The upload could not be read. Try again.', { status: 400 });
  }

  try {
    return await new Response(Buffer.concat(chunks, total), {
      headers: { 'content-type': contentType },
    }).formData();
  } catch {
    throw new ApiError('validation', 'The upload could not be read. Try again.', { status: 400 });
  }
}
