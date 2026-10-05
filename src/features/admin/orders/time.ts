import { STORE_TIME_ZONE } from "./status";

/*
 * Calendar days in the store's time zone. Admin date filters and dashboard
 * days are store-local ("YYYY-MM-DD"), whatever the server's own zone is.
 */

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const partFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string) {
  let f = dayFormatters.get(timeZone);
  if (!f) dayFormatters.set(timeZone, (f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })));
  return f;
}

function partFormatter(timeZone: string) {
  let f = partFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partFormatters.set(timeZone, f);
  }
  return f;
}

/** "YYYY-MM-DD" of an instant in the store's time zone. */
export function zonedDay(date: Date | string | number, timeZone = STORE_TIME_ZONE): string {
  return dayFormatter(timeZone).format(new Date(date));
}

/** Milliseconds the zone is ahead of UTC at an instant. */
function zoneOffset(at: number, timeZone: string): number {
  const p: Record<string, string> = {};
  for (const part of partFormatter(timeZone).formatToParts(new Date(at))) p[part.type] = part.value;
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return local - Math.floor(at / 1000) * 1000;
}

/** The instant a store-local day ("YYYY-MM-DD") begins. */
export function zonedDayStart(day: string, timeZone = STORE_TIME_ZONE): Date {
  const [y, m, d] = day.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d);
  let at = wall - zoneOffset(wall, timeZone);
  // Re-check once in case the offset differs at the result (DST change that day).
  const corrected = wall - zoneOffset(at, timeZone);
  if (corrected !== at) at = corrected;
  return new Date(at);
}

/** Adds whole days to a "YYYY-MM-DD" day. */
export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Whole days between two "YYYY-MM-DD" days (b − a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "5 Oct" for a "YYYY-MM-DD" day. */
export function formatDayShort(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return shortDay.format(new Date(Date.UTC(y, m - 1, d)));
}

/** "Mon, 5 Oct 2026" for a "YYYY-MM-DD" day. */
export function formatDayLong(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return longDay.format(new Date(Date.UTC(y, m - 1, d)));
}

const storeDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: STORE_TIME_ZONE });
const storeDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: STORE_TIME_ZONE,
});

/** "5 Oct 2026" in the store's time zone. */
export function formatStoreDate(iso: string | Date): string {
  return storeDate.format(new Date(iso));
}

/** "5 Oct 2026, 14:32" in the store's time zone. */
export function formatStoreDateTime(iso: string | Date): string {
  return storeDateTime.format(new Date(iso));
}
