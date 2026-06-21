import { describe, expect, it } from "vitest";

import type { Area, Milestone, Task } from "./types";
import { addDaysISO, todayISO } from "./date";
import {
  computeWhatsNext,
  filterViews,
  joinMilestones,
  kanbanColumns,
  milestonesForDay,
  taskProgress,
} from "./selectors";

const T = todayISO();
const CREATED = "2026-01-01T00:00:00.000Z";

const areas: Area[] = [
  { id: "a1", name: "Study", color: "sky" },
  { id: "a2", name: "Work", color: "violet" },
];

const tasks: Task[] = [
  {
    id: "t1",
    title: "Task One",
    areaId: "a1",
    deadline: addDaysISO(T, 5),
    labels: ["feat"],
    createdAt: CREATED,
  },
  {
    id: "t2",
    title: "Task Two",
    areaId: "a2",
    deadline: addDaysISO(T, 2),
    labels: ["chore"],
    createdAt: CREATED,
  },
];

const milestones: Milestone[] = [
  { id: "m_over", taskId: "t1", title: "overdue", date: addDaysISO(T, -1), done: false, order: 0, createdAt: CREATED },
  { id: "m_today_done", taskId: "t1", title: "today done", date: T, done: true, order: 1, createdAt: CREATED },
  { id: "m_today", taskId: "t2", title: "today pending", date: T, done: false, order: 0, createdAt: CREATED },
  { id: "m_future_t1", taskId: "t1", title: "future t1", date: addDaysISO(T, 1), done: false, order: 0, createdAt: CREATED },
  { id: "m_future_t2", taskId: "t2", title: "future t2", date: addDaysISO(T, 1), done: false, order: 0, createdAt: CREATED },
];

const allViews = () => joinMilestones(milestones, tasks, areas);

describe("joinMilestones", () => {
  it("joins task + area and drops orphans", () => {
    const views = allViews();
    expect(views).toHaveLength(5);
    const over = views.find((v) => v.id === "m_over");
    expect(over?.task.id).toBe("t1");
    expect(over?.area?.name).toBe("Study");

    const withOrphan = joinMilestones(
      [
        ...milestones,
        { id: "orph", taskId: "nope", title: "x", date: T, done: false, order: 0, createdAt: CREATED },
      ],
      tasks,
      areas,
    );
    expect(withOrphan).toHaveLength(5);
  });
});

describe("filterViews", () => {
  it("filters by area", () => {
    const v = filterViews(allViews(), "a2", []);
    expect(v).toHaveLength(2);
    expect(v.every((x) => x.task.areaId === "a2")).toBe(true);
  });

  it("filters by label", () => {
    const v = filterViews(allViews(), "all", ["feat"]);
    expect(v).toHaveLength(3);
    expect(v.every((x) => x.task.labels.includes("feat"))).toBe(true);
  });
});

describe("computeWhatsNext", () => {
  it("splits overdue / today / done-today and is not clear when today has pending", () => {
    const wn = computeWhatsNext(allViews());
    expect(wn.overdue.map((v) => v.id)).toEqual(["m_over"]);
    expect(wn.today.map((v) => v.id)).toEqual(["m_today"]);
    expect(wn.doneToday.map((v) => v.id)).toEqual(["m_today_done"]);
    expect(wn.allClearToday).toBe(false);
  });

  it("orders upNext by assigned day, then by deadline", () => {
    const wn = computeWhatsNext(allViews());
    // Both future milestones share a day; t2 has the nearer deadline → first.
    expect(wn.upNext?.id).toBe("m_future_t2");
    expect(wn.upcoming.map((v) => v.id)).toEqual(["m_future_t2", "m_future_t1"]);
  });

  it("reports allClearToday when nothing is pending today", () => {
    const futureOnly = joinMilestones(
      milestones.filter((m) => m.id.startsWith("m_future")),
      tasks,
      areas,
    );
    const wn = computeWhatsNext(futureOnly);
    expect(wn.allClearToday).toBe(true);
    expect(wn.today).toHaveLength(0);
    expect(wn.upNext?.id).toBe("m_future_t2");
  });
});

describe("milestonesForDay", () => {
  it("returns a day's milestones with done ones sinking to the bottom", () => {
    const day = milestonesForDay(T, allViews());
    expect(day.map((v) => v.id)).toEqual(["m_today", "m_today_done"]);
  });
});

describe("taskProgress", () => {
  it("computes done / total / pct", () => {
    const p1 = taskProgress("t1", milestones);
    expect(p1.total).toBe(3);
    expect(p1.done).toBe(1);
    expect(p1.pct).toBe(33);

    const p2 = taskProgress("t2", milestones);
    expect(p2.total).toBe(2);
    expect(p2.done).toBe(0);
    expect(p2.pct).toBe(0);
  });
});

describe("kanbanColumns", () => {
  it("buckets milestones by deadline distance", () => {
    const cols = kanbanColumns(allViews());
    const byId = Object.fromEntries(cols.map((c) => [c.id, c]));
    expect(byId.overdue.items.map((v) => v.id)).toEqual(["m_over"]);
    expect(byId.today.items.map((v) => v.id)).toEqual(["m_today"]);
    expect(byId.week.items.map((v) => v.id)).toEqual([
      "m_future_t2",
      "m_future_t1",
    ]);
    expect(byId.done.items.map((v) => v.id)).toEqual(["m_today_done"]);
    expect(byId.later.items).toHaveLength(0);
  });
});
