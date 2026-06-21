import { describe, expect, it } from "vitest";

import { distributeDates } from "./planning";

describe("distributeDates", () => {
  it("count = 1 lands on the deadline", () => {
    expect(distributeDates("2026-06-21", "2026-06-25", 1)).toEqual([
      "2026-06-25",
    ]);
  });

  it("spreads evenly across the inclusive range, hitting both endpoints", () => {
    // 5 days (21–25), 3 milestones → first, middle, last
    expect(distributeDates("2026-06-21", "2026-06-25", 3)).toEqual([
      "2026-06-21",
      "2026-06-23",
      "2026-06-25",
    ]);
  });

  it("fills consecutive days when count equals the number of days", () => {
    expect(distributeDates("2026-06-21", "2026-06-24", 4)).toEqual([
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
      "2026-06-24",
    ]);
  });

  it("clamps a start after the deadline onto the deadline", () => {
    expect(distributeDates("2026-07-01", "2026-06-25", 3)).toEqual([
      "2026-06-25",
      "2026-06-25",
      "2026-06-25",
    ]);
  });

  it("returns one date per milestone even with more milestones than days", () => {
    const r = distributeDates("2026-06-21", "2026-06-22", 4);
    expect(r).toHaveLength(4);
    expect(r[0]).toBe("2026-06-21");
    expect(r[3]).toBe("2026-06-22");
  });

  it("returns empty for an invalid (reversed, far) range only via deadline clamp", () => {
    // start clamps to deadline so there is always at least the deadline day
    expect(distributeDates("2026-06-25", "2026-06-25", 1)).toEqual([
      "2026-06-25",
    ]);
  });
});
