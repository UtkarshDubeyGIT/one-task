import { addDaysISO, parseISODate, todayISO } from "./date";

/**
 * Lightweight natural-language Quick Add parser. Extracts a deadline,
 * a #project (area) token, and @label tokens from a single line, returning the
 * remaining text as the title. Dependency-free and pure, so it's easy to test.
 *
 * Supported dates: today, tonight, tomorrow/tmrw, yesterday, next week,
 * "in N days/weeks", weekday names (mon…sun, "next friday"), and "MMM D" / "D MMM".
 */

export interface ParsedTask {
  title: string;
  deadline?: string;
  areaToken?: string;
  labelTokens: string[];
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tues: 2,
  tue: 2,
  wed: 3,
  thurs: 4,
  thur: 4,
  thu: 4,
  fri: 5,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, mIdx: number, d: number) => `${y}-${pad(mIdx + 1)}-${pad(d)}`;

function findDate(
  text: string,
  today: string,
): { iso: string; match: string } | null {
  const lower = text.toLowerCase();

  const simple: [RegExp, () => string][] = [
    [/\b(today|tonight)\b/, () => today],
    [/\b(tomorrow|tmrw|tmr)\b/, () => addDaysISO(today, 1)],
    [/\byesterday\b/, () => addDaysISO(today, -1)],
    [/\bnext week\b/, () => addDaysISO(today, 7)],
  ];
  for (const [re, fn] of simple) {
    const m = lower.match(re);
    if (m) return { iso: fn(), match: m[0] };
  }

  const inN = lower.match(/\bin (\d{1,3}) (days?|weeks?)\b/);
  if (inN) {
    const n = parseInt(inN[1], 10);
    const days = inN[2].startsWith("week") ? n * 7 : n;
    return { iso: addDaysISO(today, days), match: inN[0] };
  }

  const wd = lower.match(
    /\b(?:this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)\b/,
  );
  if (wd) {
    const target = WEEKDAYS[wd[1]];
    const dow = parseISODate(today).getDay();
    let delta = (target - dow + 7) % 7;
    if (delta === 0) delta = 7; // a bare weekday means the upcoming one
    return { iso: addDaysISO(today, delta), match: wd[0] };
  }

  const names = Object.keys(MONTHS).join("|");
  const md = lower.match(new RegExp(`\\b(${names}) (\\d{1,2})\\b`));
  const dm = lower.match(new RegExp(`\\b(\\d{1,2}) (${names})\\b`));
  let monthIdx = -1;
  let day = -1;
  let match = "";
  if (md) {
    monthIdx = MONTHS[md[1]];
    day = parseInt(md[2], 10);
    match = md[0];
  } else if (dm) {
    monthIdx = MONTHS[dm[2]];
    day = parseInt(dm[1], 10);
    match = dm[0];
  }
  if (monthIdx >= 0 && day >= 1 && day <= 31) {
    const year = parseInt(today.slice(0, 4), 10);
    let iso = ymd(year, monthIdx, day);
    if (iso < today) iso = ymd(year + 1, monthIdx, day);
    return { iso, match };
  }

  return null;
}

export function parseTaskInput(raw: string, today: string = todayISO()): ParsedTask {
  let text = raw;

  const labelTokens: string[] = [];
  text = text.replace(/(^|\s)@([A-Za-z0-9][\w-]*)/g, (_m, pre: string, name: string) => {
    labelTokens.push(name);
    return pre;
  });

  let areaToken: string | undefined;
  text = text.replace(/(^|\s)#([A-Za-z0-9][\w-]*)/g, (_m, pre: string, name: string) => {
    if (!areaToken) areaToken = name;
    return pre;
  });

  let deadline: string | undefined;
  const d = findDate(text, today);
  if (d) {
    deadline = d.iso;
    const idx = text.toLowerCase().indexOf(d.match);
    if (idx >= 0) text = text.slice(0, idx) + text.slice(idx + d.match.length);
  }

  const title = text.replace(/\s{2,}/g, " ").trim();
  return { title, deadline, areaToken, labelTokens };
}
