import { describe, expect, it } from "vitest";

import {
  addDaysISO,
  compareISO,
  diffDays,
  eachDayISO,
  isFutureISO,
  isPastISO,
  isTodayISO,
  rangeISO,
  relativeDeadline,
  todayISO,
} from "./date";

describe("date helpers", () => {
  it("compareISO orders ISO date strings", () => {
    expect(compareISO("2026-01-01", "2026-01-02")).toBe(-1);
    expect(compareISO("2026-01-02", "2026-01-01")).toBe(1);
    expect(compareISO("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("addDaysISO crosses month and year boundaries", () => {
    expect(addDaysISO("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-06-21", 0)).toBe("2026-06-21");
  });

  it("diffDays returns the calendar-day difference (a - b)", () => {
    expect(diffDays("2026-06-21", "2026-06-21")).toBe(0);
    expect(diffDays("2026-06-24", "2026-06-21")).toBe(3);
    expect(diffDays("2026-06-20", "2026-06-21")).toBe(-1);
  });

  it("eachDayISO is inclusive, ordered, and empty when start > end", () => {
    expect(eachDayISO("2026-06-21", "2026-06-24")).toEqual([
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
      "2026-06-24",
    ]);
    expect(eachDayISO("2026-06-21", "2026-06-21")).toEqual(["2026-06-21"]);
    expect(eachDayISO("2026-06-25", "2026-06-21")).toEqual([]);
  });

  it("rangeISO returns N consecutive days", () => {
    expect(rangeISO("2026-06-21", 3)).toEqual([
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
    ]);
  });

  it("today predicates agree with todayISO()", () => {
    const t = todayISO();
    expect(isTodayISO(t)).toBe(true);
    expect(isPastISO(t)).toBe(false);
    expect(isFutureISO(t)).toBe(false);
    expect(isPastISO(addDaysISO(t, -1))).toBe(true);
    expect(isFutureISO(addDaysISO(t, 1))).toBe(true);
  });

  it("relativeDeadline phrases relative to today", () => {
    const t = todayISO();
    expect(relativeDeadline(t)).toBe("due today");
    expect(relativeDeadline(addDaysISO(t, 1))).toBe("due tomorrow");
    expect(relativeDeadline(addDaysISO(t, 3))).toBe("in 3d");
    expect(relativeDeadline(addDaysISO(t, -2))).toBe("2d overdue");
  });
});
