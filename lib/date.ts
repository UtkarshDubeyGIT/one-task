import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

/**
 * All dates in the app are handled as date-only ISO strings (yyyy-MM-dd),
 * parsed/formatted in local time. Because that format sorts lexicographically,
 * plain string comparison is a valid chronological comparison.
 */

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseISODate(iso: string): Date {
  return parseISO(iso);
}

export function addDaysISO(iso: string, n: number): string {
  return toISO(addDays(parseISO(iso), n));
}

/** Calendar-day difference: diffDays(a, b) = a - b. */
export function diffDays(aIso: string, bIso: string): number {
  return differenceInCalendarDays(parseISO(aIso), parseISO(bIso));
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isTodayISO(iso: string): boolean {
  return iso === todayISO();
}

export function isPastISO(iso: string): boolean {
  return compareISO(iso, todayISO()) < 0;
}

export function isFutureISO(iso: string): boolean {
  return compareISO(iso, todayISO()) > 0;
}

/** Inclusive list of every day from start to end. */
export function eachDayISO(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  if (compareISO(startIso, endIso) > 0) return out;
  let cur = startIso;
  let guard = 0;
  while (compareISO(cur, endIso) <= 0 && guard < 400) {
    out.push(cur);
    cur = addDaysISO(cur, 1);
    guard++;
  }
  return out;
}

/** `count` consecutive days starting at startIso. */
export function rangeISO(startIso: string, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(addDaysISO(startIso, i));
  return out;
}

/** Sunday-anchored start of the week containing iso (weekStartsOn: 0 = Sunday). */
export function startOfWeekISO(iso: string, weekStartsOn: 0 | 1 = 0): string {
  return toISO(startOfWeek(parseISO(iso), { weekStartsOn }));
}

export function formatDayNum(iso: string): string {
  return format(parseISO(iso), "d");
}

export function formatWeekdayShort(iso: string): string {
  return format(parseISO(iso), "EEE");
}

export function formatWeekdayLong(iso: string): string {
  return format(parseISO(iso), "EEEE");
}

export function formatMonthDay(iso: string): string {
  return format(parseISO(iso), "MMM d");
}

export function formatFull(iso: string): string {
  return format(parseISO(iso), "EEEE, MMM d");
}

/** Human, compact deadline phrasing relative to today. */
export function relativeDeadline(iso: string): string {
  const d = diffDays(iso, todayISO());
  if (d === 0) return "due today";
  if (d === 1) return "due tomorrow";
  if (d === -1) return "1d overdue";
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d < 7) return `in ${d}d`;
  if (d < 14) return "next week";
  return `in ${Math.round(d / 7)}w`;
}

/** First day of the month containing iso, as yyyy-MM-01. */
export function startOfMonthISO(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Shift by whole months; returns the first day of the resulting month. */
export function addMonthsISO(iso: string, n: number): string {
  const [y, m] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

export function formatMonthYear(iso: string): string {
  return format(parseISODate(iso), "MMMM yyyy");
}

export function sameMonthISO(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}
