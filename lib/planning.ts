import { compareISO, eachDayISO } from "./date";

/**
 * Deterministically spread `count` milestones across the days from `startIso`
 * to `deadlineIso` (inclusive), evenly including both endpoints. No AI — pure
 * date math, used by both the store and the task dialog.
 *
 * - If start is after the deadline, everything collapses onto the deadline.
 * - With count === 1 the single date is the deadline.
 * - With more milestones than available days, dates repeat (multiple per day).
 */
export function distributeDates(
  startIso: string,
  deadlineIso: string,
  count: number,
): string[] {
  const start = compareISO(startIso, deadlineIso) > 0 ? deadlineIso : startIso;
  const days = eachDayISO(start, deadlineIso);
  if (days.length === 0) return [];

  const n = Math.max(1, Math.min(Math.floor(count) || 1, 90));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const idx =
      n === 1 ? days.length - 1 : Math.round((i * (days.length - 1)) / (n - 1));
    out.push(days[idx]);
  }
  return out;
}
