/**
 * The allowlist for remote images.
 *
 * `next/image` fetches an allowlisted host **from the server**, so a misconfigured
 * `IMAGE_HOSTS` would turn the optimiser into a request forwarder: `localhost`,
 * `169.254.169.254` or an internal hostname would reach services the browser cannot. Only a
 * public DNS name is accepted, whatever the environment says.
 */
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const PRIVATE_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa'];

export function isPublicImageHost(host: string): boolean {
  const value = host.trim().toLowerCase();
  if (!value) return false;
  // Letters, digits, dots and hyphens only: no wildcard, port, scheme, bracket or slash.
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(value)) return false;
  if (value === 'localhost') return false;
  if (IPV4.test(value)) return false;
  return !PRIVATE_SUFFIXES.some((suffix) => value.endsWith(suffix));
}
