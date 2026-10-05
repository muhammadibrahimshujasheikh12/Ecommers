import "server-only";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { Profile } from "@/lib/data/account";
import type { profileSchema, savedAddressSchema } from "@/lib/validation/schemas";
import type { ActionResult, Address } from "@/types/domain";
import { daysAgo, demoData, demoDb, type DemoCoupon } from "./db";
import { demoUserId, getDemoUser, setDemoUser, type DemoUser } from "./session";
import {
  DEMO_MAX_ADDRESSES,
  demoOrdersForCurrentUser,
  fitsDemoAddresses,
  readDemoAddresses,
  readDemoWishlist,
  writeDemoAddresses,
  type DemoAddress,
} from "./store";

/*
 * Demo-mode accounts: no passwords are checked or stored, any valid email
 * signs in. The customers behind the seeded order history (demoData.orders)
 * sign in with their own names and see those orders (matched by email).
 * Profile and address book live in this browser's cookies (see ./store.ts).
 */

/** Demo accounts have no passwords, so there is nothing to change or reset. */
export const DEMO_PASSWORD_NOTE = "Demo store — passwords aren’t stored, so any password signs you in.";


type SeededCustomer = { firstName: string; lastName: string; phone: string | null; firstOrderDaysAgo: number };

/** Seeded customers by lower-cased email, built from their order rows. */
const seededCustomers = new Map<string, SeededCustomer>();
for (const order of demoData.orders) {
  const email = order.email.toLowerCase();
  const known = seededCustomers.get(email);
  if (known) {
    known.firstOrderDaysAgo = Math.max(known.firstOrderDaysAgo, order.created_days_ago);
    continue;
  }
  seededCustomers.set(email, {
    firstName: order.shipping_address.first_name,
    lastName: order.shipping_address.last_name,
    phone: order.phone || order.shipping_address.phone || null,
    firstOrderDaysAgo: order.created_days_ago,
  });
}

/** A seeded customer with order history, suggested on the demo sign-in page. */
export const DEMO_SAMPLE_EMAIL: string | undefined = seededCustomers.has("hira.a@example.com")
  ? "hira.a@example.com"
  : seededCustomers.keys().next().value;

/** "sara.malik92@…" → "Sara". Empty when the local part has no usable word. */
function firstNameFromEmail(email: string): string {
  const word = (email.split("@")[0].match(/[a-z]+/gi) ?? []).find((w) => w.length >= 2);
  return word ? word[0].toUpperCase() + word.slice(1, 40).toLowerCase() : "";
}

// ---------------------------------------------------------------------------
// Sign in / register (emails arrive trimmed and lower-cased by emailSchema)
// ---------------------------------------------------------------------------

/** Signs this browser in as the demo customer for `email`. Server Actions only. */
export async function demoSignIn(email: string): Promise<DemoUser> {
  const seeded = seededCustomers.get(email);
  const user: DemoUser = {
    id: demoUserId(email),
    email,
    firstName: seeded?.firstName ?? firstNameFromEmail(email),
    lastName: seeded?.lastName ?? "",
    phone: seeded?.phone ?? null,
    createdAt: seeded ? daysAgo(seeded.firstOrderDaysAgo) : new Date().toISOString(),
  };
  await setDemoUser(user);
  return user;
}

/** Creates the demo account and signs in straight away (there is no email to verify). */
export async function demoRegister(input: { email: string; firstName: string; lastName: string }): Promise<ActionResult<DemoUser>> {
  if (seededCustomers.has(input.email)) {
    return { ok: false, error: "An account with this email already exists. Try signing in instead." };
  }
  const user: DemoUser = {
    id: demoUserId(input.email),
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: null,
    createdAt: new Date().toISOString(),
  };
  await setDemoUser(user);
  return { ok: true, data: user };
}

// ---------------------------------------------------------------------------
// Account data
// ---------------------------------------------------------------------------

export async function demoGetProfile(userId: string, email: string): Promise<Profile> {
  const user = await getDemoUser();
  const own = user?.id === userId ? user : null;
  return {
    id: userId,
    firstName: own?.firstName || null,
    lastName: own?.lastName || null,
    phone: own?.phone || null,
    email,
  };
}

/** Default first, then newest first (the book is stored newest first). */
export async function demoGetMyAddresses(): Promise<Address[]> {
  const book = await readDemoAddresses();
  return [...book.filter((a) => a.isDefault), ...book.filter((a) => !a.isDefault)];
}

export async function demoGetAccountStats(userId: string) {
  const user = await getDemoUser();
  if (!user || user.id !== userId) return { orders: 0, wishlist: 0, addresses: 0 };
  const email = user.email.toLowerCase();
  const [placed, wishlist, addresses] = await Promise.all([demoOrdersForCurrentUser(), readDemoWishlist(), readDemoAddresses()]);
  return {
    orders: placed.length + demoData.orders.filter((o) => o.email.toLowerCase() === email).length,
    // Saved ids can outlive a regenerated sample catalogue.
    wishlist: wishlist.filter((id) => demoDb.product(id)).length,
    addresses: addresses.length,
  };
}

/** A sample coupon while it can be redeemed (within its dates, as checkout checks), for the account welcome panel. */
export function demoGetCoupon(code: string): DemoCoupon | null {
  const now = Date.now();
  const coupon = demoData.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon || (coupon.starts_at && Date.parse(coupon.starts_at) > now) || (coupon.expires_at && Date.parse(coupon.expires_at) <= now)) return null;
  return coupon;
}

// ---------------------------------------------------------------------------
// Account actions (input is validated and the user checked by the caller)
// ---------------------------------------------------------------------------

export async function demoUpdateProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const user = await getDemoUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  await setDemoUser({ ...user, firstName: input.firstName, lastName: input.lastName, phone: input.phone || null });
  revalidatePath("/account", "layout");
  return { ok: true, data: undefined, message: "Profile saved." };
}


export async function demoSaveAddress(input: z.infer<typeof savedAddressSchema>, addressId?: string): Promise<ActionResult<{ id: string }>> {
  const user = await getDemoUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const book = await readDemoAddresses();
  const existing = addressId ? book.find((a) => a.id === addressId) : undefined;
  if (addressId && !existing) return { ok: false, error: "We couldn't save this address." };
  if (!existing && book.length >= DEMO_MAX_ADDRESSES) {
    return { ok: false, error: `The demo store keeps up to ${DEMO_MAX_ADDRESSES} addresses. Remove one to add another.` };
  }

  // First address becomes the default; there is always exactly one default,
  // so unticking it on the current default keeps it until another is chosen.
  const makeDefault = input.isDefault || !book.length || Boolean(existing?.isDefault);
  const address: DemoAddress = {
    id: existing?.id ?? randomUUID(),
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || null,
    city: input.city,
    province: input.province || null,
    postalCode: input.postalCode || null,
    country: input.country,
    isDefault: makeDefault,
  };
  const others = book.map((a) => (makeDefault && a.isDefault ? { ...a, isDefault: false } : a));
  const next = existing ? others.map((a) => (a.id === address.id ? address : a)) : [address, ...others];
  if (!fitsDemoAddresses(user.id, next)) {
    return {
      ok: false,
      error: existing
        ? "This address is too long for the demo store. Please shorten it."
        : "Your demo address book is full. Remove an address to add another.",
    };
  }

  await writeDemoAddresses(next);
  revalidatePath("/account/addresses");
  return { ok: true, data: { id: address.id }, message: "Address saved." };
}

export async function demoDeleteAddress(addressId: string): Promise<ActionResult> {
  const book = await readDemoAddresses();
  const removed = book.find((a) => a.id === addressId);
  if (removed) {
    const rest = book.filter((a) => a.id !== addressId);
    // Keep exactly one default: the newest remaining address takes over.
    if (removed.isDefault && rest.length) rest[0] = { ...rest[0], isDefault: true };
    await writeDemoAddresses(rest);
  }
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined, message: "Address removed." };
}

export async function demoSetDefaultAddress(addressId: string): Promise<ActionResult> {
  const book = await readDemoAddresses();
  if (!book.some((a) => a.id === addressId)) return { ok: false, error: "We couldn't update your default address." };
  await writeDemoAddresses(book.map((a) => ({ ...a, isDefault: a.id === addressId })));
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined, message: "Default address updated." };
}
