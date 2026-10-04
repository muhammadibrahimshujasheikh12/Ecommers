import "server-only";
import { cookies } from "next/headers";
import type { z } from "zod";
import type { DemoCookieName } from "./constants";

/*
 * Demo-mode visitor state is kept in httpOnly cookies as base64url JSON, so it
 * survives restarts and works on serverless hosts without a database. Values
 * are always re-validated on read — a cookie is user-controlled input.
 */

/** Stay safely under the ~4 KB per-cookie browser limit. */
const MAX_COOKIE_BYTES = 3800;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
const decode = (raw: string): unknown => JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));

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
  const encoded = encode(value);
  if (encoded.length > MAX_COOKIE_BYTES) return false;
  (await cookies()).set(name, encoded, cookieOptions);
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
  while (kept.length && encode(wrap(kept)).length > MAX_COOKIE_BYTES) kept.pop();
  await writeDemoCookie(name, wrap(kept));
  return kept;
}

export async function clearDemoCookie(name: DemoCookieName): Promise<void> {
  (await cookies()).delete(name);
}
