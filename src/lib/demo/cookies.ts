import "server-only";
import { cookies } from "next/headers";
import type { z } from "zod";
import { DEMO_COOKIES, type DemoCookieName } from "./constants";

/*
 * Demo-mode visitor state is kept in httpOnly cookies as base64url JSON, so it
 * survives restarts and works on serverless hosts without a database. Values
 * are always re-validated on read — a cookie is user-controlled input.
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

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
const decode = (raw: string): unknown => JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));

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
 * Writes a list (newest first), dropping the oldest entries until it fits.
 * `wrap` builds the stored value from the kept items. Returns the items kept.
 */
export async function writeDemoList<T>(
  name: DemoCookieName,
  items: T[],
  wrap: (items: T[]) => unknown = (kept) => kept,
): Promise<T[]> {
  const kept = [...items];
  while (kept.length && !fitsDemoCookie(name, wrap(kept))) kept.pop();
  await writeDemoCookie(name, wrap(kept));
  return kept;
}

export async function clearDemoCookie(name: DemoCookieName): Promise<void> {
  (await cookies()).delete(name);
}
