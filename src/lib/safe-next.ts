const BASE = "http://local.invalid";

/**
 * A same-site path to redirect to after sign-in or an email link, or undefined
 * (prevents open redirects). The value goes through the WHATWG URL parser, as
 * the browser would: "//host", "/\host" and paths hiding TAB/CR/LF (which the
 * parser strips, e.g. "/\t/host") resolve to another origin and are refused.
 * The normalised path is returned, so a Location header never carries them.
 */
export function safeNext(next: unknown): string | undefined {
  if (typeof next !== "string" || !next.startsWith("/")) return undefined;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return undefined;
    // Dot segments can normalise to a leading "//" ("/.//host"), which is protocol-relative again.
    return `${url.pathname.replace(/^\/+/, "/")}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}
