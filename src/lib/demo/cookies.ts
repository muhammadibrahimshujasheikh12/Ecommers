import "server-only";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { cookies } from "next/headers";
import type { z } from "zod";
import { DEMO_COOKIES, type DemoCookieName } from "./constants";

/*
 * Demo-mode visitor state is kept in httpOnly cookies as base64url JSON
 * (deflated when that is shorter), so it survives restarts and works on
 * serverless hosts without a database. Values are always re-validated on
 * read — a cookie is user-controlled input.
 */

/**
 * Encoded size budget per cookie. Each stays under the ~4 KB browser limit and
 * together they stay well under Node's 16 KB request-header limit (HTTP 431).
 */
const BUDGETS: Record<DemoCookieName, number> = {
  [DEMO_COOKIES.user]: 800,
  [DEMO_COOKIES.cart]: 2400,
  [DEMO_COOKIES.addresses]: 2400,
  [DEMO_COOKIES.orders]: 3600,
  [DEMO_COOKIES.wishlist]: 1500,
  [DEMO_COOKIES.reviews]: 1800,
};

/**
 * Browsers drop Secure cookies over plain HTTP on any host but localhost, which
 * silently signs visitors out and empties their bag. Production builds set
 * Secure unless DEMO_COOKIE_SECURE=false (e.g. a demo opened over the LAN).
 */
const secureOverride = process.env.DEMO_COOKIE_SECURE;
export const DEMO_COOKIE_SECURE =
  secureOverride === "true" ? true : secureOverride === "false" ? false : process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: DEMO_COOKIE_SECURE,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Marks a deflated value ("." is never part of base64url). */
const DEFLATED = ".";
/** Caps what a (possibly crafted) deflated cookie may expand to. */
const MAX_JSON_BYTES = 64 * 1024;

function encode(value: unknown): string {
  const json = Buffer.from(JSON.stringify(value), "utf8");
  const plain = json.toString("base64url");
  if (json.length > MAX_JSON_BYTES) return plain; // over every budget
  const packed = DEFLATED + deflateRawSync(json).toString("base64url");
  return packed.length < plain.length ? packed : plain;
}

function decode(raw: string): unknown {
  const json = raw.startsWith(DEFLATED)
    ? inflateRawSync(Buffer.from(raw.slice(DEFLATED.length), "base64url"), { maxOutputLength: MAX_JSON_BYTES })
    : Buffer.from(raw, "base64url");
  return JSON.parse(json.toString("utf8"));
}

/** Whether a value fits in the named cookie's budget. */
export function fitsDemoCookie(name: DemoCookieName, value: unknown): boolean {
  return encode(value).length <= BUDGETS[name];
}

/** Reads and validates a demo cookie. Missing or malformed values return the fallback. */
export async function readDemoCookie<T>(name: DemoCookieName, schema: z.ZodType<T>, fallback: T): Promise<T> {
  const raw = (await cookies()).get(name)?.value;
  if (!raw) return fallback;
  try {
    const parsed = schema.safeParse(decode(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Writes a demo cookie. Only call from Server Actions or Route Handlers.
 * Returns false (writing nothing) if the value would exceed the cookie size limit.
 */
export async function writeDemoCookie(name: DemoCookieName, value: unknown): Promise<boolean> {
  if (!fitsDemoCookie(name, value)) return false;
  (await cookies()).set(name, encode(value), cookieOptions);
  return true;
}

/**
 * The items of a list (newest first) that fit in the named cookie, dropping the
 * oldest. `wrap` builds the stored value from the kept items.
 */
export function fitDemoList<T>(name: DemoCookieName, items: T[], wrap: (items: T[]) => unknown = (kept) => kept): T[] {
  const kept = [...items];
  while (kept.length && !fitsDemoCookie(name, wrap(kept))) kept.pop();
  return kept;
}

/**
 * Writes a list (newest first), dropping the oldest entries until it fits.
 * `wrap` builds the stored value from the kept items. Returns the items kept.
 */
export async function writeDemoList<T>(
  name: DemoCookieName,
  items: T[],
  wrap: (items: T[]) => unknown = (kept) => kept,
): Promise<T[]> {
  const kept = fitDemoList(name, items, wrap);
  await writeDemoCookie(name, wrap(kept));
  return kept;
}

export async function clearDemoCookie(name: DemoCookieName): Promise<void> {
  (await cookies()).delete(name);
}
