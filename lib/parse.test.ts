import { describe, expect, it } from "vitest";

import { parseISODate } from "./date";
import { parseTaskInput } from "./parse";

const TODAY = "2026-06-21";

describe("parseTaskInput", () => {
  it("extracts tomorrow + #area + @label and cleans the title", () => {
    const r = parseTaskInput(
      "Ship landing page tomorrow #Personal @urgent",
      TODAY,
    );
    expect(r.title).toBe("Ship landing page");
    expect(r.deadline).toBe("2026-06-22");
    expect(r.areaToken).toBe("Personal");
    expect(r.labelTokens).toEqual(["urgent"]);
  });

  it("handles today and multiple labels", () => {
    const r = parseTaskInput("Call mom today @home @phone", TODAY);
    expect(r.deadline).toBe("2026-06-21");
    expect(r.title).toBe("Call mom");
    expect(r.labelTokens).toEqual(["home", "phone"]);
  });

  it("parses 'in N days' and 'MMM D'", () => {
    expect(parseTaskInput("submit report in 3 days", TODAY).deadline).toBe(
      "2026-06-24",
    );
    const r = parseTaskInput("Pay rent jun 28", TODAY);
    expect(r.deadline).toBe("2026-06-28");
    expect(r.title).toBe("Pay rent");
  });

  it("rolls a passed month/day into next year", () => {
    expect(parseTaskInput("Taxes jan 5", TODAY).deadline).toBe("2027-01-05");
  });

  it("resolves a weekday to the upcoming one", () => {
    const r = parseTaskInput("Review PR friday #Work", TODAY);
    expect(parseISODate(r.deadline!).getDay()).toBe(5); // Friday
    expect(r.areaToken).toBe("Work");
    expect(r.title).toBe("Review PR");
  });

  it("leaves a plain title untouched", () => {
    const r = parseTaskInput("Buy milk", TODAY);
    expect(r.title).toBe("Buy milk");
    expect(r.deadline).toBe(undefined);
    expect(r.areaToken).toBe(undefined);
    expect(r.labelTokens).toEqual([]);
  });

  it("does not treat a bare 'may' as a date", () => {
    const r = parseTaskInput("you may relax", TODAY);
    expect(r.deadline).toBe(undefined);
    expect(r.title).toBe("you may relax");
  });
});
