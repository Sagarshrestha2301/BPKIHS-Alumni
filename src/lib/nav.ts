export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The page to return to after signing in, taken from `?next=`.
 *
 * Only a path on this site is accepted: never another origin (`//host`, `/\\host`), never a
 * control character that could smuggle something past the browser, and never the sign-in or
 * admin screens, which would either loop or require a different account. Anything else means
 * the caller has no opinion and the member lands on their account page as before.
 */
export function safeReturnPath(value: string | string[] | undefined | null): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  // A newline or a backslash could otherwise slip past the checks above.
  if (/[\u0000-\u001f\\]/.test(raw)) return null;
  if (raw === '/sign-in' || /^\/sign-in[?#/]/.test(raw)) return null;
  if (raw === '/admin' || /^\/admin[?#/]/.test(raw)) return null;
  return raw;
}
