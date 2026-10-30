import { createHmac } from 'node:crypto';

/**
 * Generates the six-digit code an authenticator app would show for a base32 secret.
 *
 * The implementation is deliberately small and test-only: standard TOTP (RFC 6238) with the
 * defaults Better Auth uses : SHA-1, 30-second period, six digits. Nothing here ships to the
 * browser or the server bundle.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(value: string): Buffer {
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];

  for (const character of value.replace(/=+$/, '').toUpperCase()) {
    const index = ALPHABET.indexOf(character);
    if (index < 0) continue;

    buffer = (buffer << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function totp(secret: string, at: number = Date.now()): string {
  const counter = Math.floor(at / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac('sha1', base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;

  return String(binary % 1_000_000).padStart(6, '0');
}
