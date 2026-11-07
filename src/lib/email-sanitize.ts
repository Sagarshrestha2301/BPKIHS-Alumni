/** Header values are single-line by definition. A tribute name, a post title or a campaign
 * subject can reach a Subject line, and a `\r\n` in one of them is header injection: an extra
 * `Bcc:` or `Reply-To:` added to our own message. Providers usually reject that, but this is
 * the layer we control, so every header is flattened before it leaves the process. */
export function sanitizeHeaderValue(value: string, maxLength = 998): string {
  return value
    .replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}
