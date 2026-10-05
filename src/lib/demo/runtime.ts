import "server-only";

/*
 * Server-wide demo records created while the store runs (orders placed by any
 * visitor, reviews awaiting moderation, newsletter sign-ups) so the demo admin
 * can see and act on them. They live in server memory: shared by every
 * visitor, reset when the server restarts. Each feature module owns one
 * registry under its own key.
 *
 * The demo admin is open to anyone with the link, so every registry is capped
 * to keep a public demo's memory bounded.
 */

export const RUNTIME_LIMITS = {
  orders: 500,
  reviews: 500,
  subscribers: 2000,
  /** Products created from the demo admin. */
  products: 50,
  coupons: 50,
} as const;

const holder = globalThis as typeof globalThis & { __auraqDemoRuntime?: Map<string, unknown> };
const registries = (holder.__auraqDemoRuntime ??= new Map<string, unknown>());

/** The registry stored under `key`, created by `init` on first use. */
export function demoRegistry<T>(key: string, init: () => T): T {
  if (!registries.has(key)) registries.set(key, init());
  return registries.get(key) as T;
}

/** Adds to a capped Map registry, dropping the oldest entries past `limit`. */
export function putCapped<K, V>(map: Map<K, V>, key: K, value: V, limit: number): void {
  map.delete(key);
  map.set(key, value);
  while (map.size > limit) {
    const oldest = map.keys().next();
    if (oldest.done) break;
    map.delete(oldest.value);
  }
}
