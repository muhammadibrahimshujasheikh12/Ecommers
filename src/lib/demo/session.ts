import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { DEMO_COOKIES } from "./constants";
import { clearDemoCookie, readDemoCookie, writeDemoCookie } from "./cookies";

/*
 * Demo accounts: no passwords are checked or stored. Signing in with any email
 * creates a cookie-held profile for this browser only. The id is derived from
 * the email so the same address always maps to the same demo customer.
 */

const demoUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(3),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export type DemoUser = z.infer<typeof demoUserSchema>;

export function demoUserId(email: string): string {
  const h = createHash("sha1").update(`auraq-demo:${email.trim().toLowerCase()}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** The signed-in demo customer for this request, if any. */
export const getDemoUser = cache(async (): Promise<DemoUser | null> => {
  return readDemoCookie<DemoUser | null>(DEMO_COOKIES.user, demoUserSchema, null);
});

/** Signs the browser in as (or updates the profile of) a demo customer. Server Actions only. */
export async function setDemoUser(user: DemoUser): Promise<void> {
  await writeDemoCookie(DEMO_COOKIES.user, user);
}

export async function signOutDemoUser(): Promise<void> {
  await clearDemoCookie(DEMO_COOKIES.user);
}

/** Shapes a demo customer like a Supabase Auth user so shared code paths work unchanged. */
export function toAuthUser(user: DemoUser): User {
  return {
    id: user.id,
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    phone: user.phone ?? undefined,
    created_at: user.createdAt,
    updated_at: user.createdAt,
    email_confirmed_at: user.createdAt,
    confirmed_at: user.createdAt,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { first_name: user.firstName, last_name: user.lastName, phone: user.phone },
    identities: [],
    is_anonymous: false,
  };
}

export async function getDemoAuthUser(): Promise<User | null> {
  const user = await getDemoUser();
  return user ? toAuthUser(user) : null;
}
