import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import { readMultipart } from './multipart';

const BOUNDARY = 'test-boundary';

function multipartBody(parts: string[]): string {
  return [...parts.map((part) => `--${BOUNDARY}\r\n${part}\r\n`), `--${BOUNDARY}--\r\n`].join('');
}

function request(body: string, contentType = `multipart/form-data; boundary=${BOUNDARY}`): Request {
  return new Request('https://alumni.example.org/api/v1/account/photo', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  });
}

function statusOf(run: () => Promise<unknown>): Promise<number> {
  return run().then(
    () => {
      throw new Error('expected the call to throw');
    },
    (error: unknown) => {
      expect(error).toBeInstanceOf(ApiError);
      return (error as ApiError).status;
    },
  );
}

describe('readMultipart', () => {
  it('returns the fields and the uploaded file', async () => {
    const form = await readMultipart(
      request(
        multipartBody([
          'Content-Disposition: form-data; name="consent"\r\n\r\ntrue',
          'Content-Disposition: form-data; name="photo"; filename="a.png"\r\n' +
            'Content-Type: image/png\r\n\r\nnot-really-a-png',
        ]),
      ),
      1024,
    );

    expect(form.get('consent')).toBe('true');
    const photo = form.get('photo') as File;
    // The parsed File comes from the server runtime, not the test DOM, so check its shape.
    expect(photo).toMatchObject({ name: 'a.png', type: 'image/png', size: 16 });
    expect(await photo.text()).toBe('not-really-a-png');
  });

  it('rejects anything that is not multipart', async () => {
    expect(await statusOf(() => readMultipart(request('{}', 'application/json'), 1024))).toBe(415);
  });

  it('rejects a declared length above the limit before reading', async () => {
    const body = multipartBody(['Content-Disposition: form-data; name="a"\r\n\r\nb']);
    const declared = new Request('https://alumni.example.org/api/v1/account/photo', {
      method: 'POST',
      headers: {
        'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
        'content-length': String(body.length + 10_000),
      },
      body,
    });

    expect(await statusOf(() => readMultipart(declared, 64))).toBe(413);
  });

  it('stops a streamed body that grows past the limit', async () => {
    const chunks = ['x'.repeat(32), 'x'.repeat(32), 'x'.repeat(32)];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    });
    const streamed = new Request('https://alumni.example.org/api/v1/account/photo', {
      method: 'POST',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      body: stream,
      duplex: 'half',
    } as RequestInit);

    expect(await statusOf(() => readMultipart(streamed, 64))).toBe(413);
  });

  it('rejects a body that is not valid multipart', async () => {
    expect(
      await statusOf(() => readMultipart(request('garbage', 'multipart/form-data'), 1024)),
    ).toBe(400);
  });
});
