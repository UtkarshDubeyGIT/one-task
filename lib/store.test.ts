import { beforeEach, describe, expect, it } from "vitest";

import { migrateState, usePlanner } from "./store";
import { addDaysISO, todayISO } from "./date";

const s = () => usePlanner.getState();

beforeEach(() => {
  // Full reset before each test (the store is a module singleton):
  // restore default areas, then empty tasks/milestones and clear filters.
  s().reseed();
  s().clearTasks();
  s().clearFilters();
});

describe("planner store", () => {
  it("ships the three default areas", () => {
    expect(s().areas.map((a) => a.name)).toEqual([
      "Study",
      "Intern Work",
      "Personal Projects",
    ]);
  });

  it("clearTasks empties tasks and milestones", () => {
    expect(s().tasks).toHaveLength(0);
    expect(s().milestones).toHaveLength(0);
  });

  it("addTask + addMilestone link milestones and assign incremental order", () => {
    const t = s().addTask({
      title: "X",
      areaId: "area_study",
      deadline: addDaysISO(todayISO(), 3),
    });
    s().addMilestone({ taskId: t.id, title: "a", date: todayISO() });
    s().addMilestone({ taskId: t.id, title: "b", date: addDaysISO(todayISO(), 1) });
    const ms = s().milestones.filter((m) => m.taskId === t.id);
    expect(ms).toHaveLength(2);
    expect(ms.map((m) => m.order)).toEqual([0, 1]);
  });

  it("toggleMilestone flips done", () => {
    const t = s().addTask({ title: "X", areaId: "area_study", deadline: todayISO() });
    const m = s().addMilestone({ taskId: t.id, title: "a", date: todayISO() });
    expect(s().milestones.find((x) => x.id === m.id)?.done).toBe(false);
    s().toggleMilestone(m.id);
    expect(s().milestones.find((x) => x.id === m.id)?.done).toBe(true);
  });

  it("removeTask deletes the task and all its milestones", () => {
    const t = s().addTask({ title: "X", areaId: "area_study", deadline: todayISO() });
    s().addMilestone({ taskId: t.id, title: "a", date: todayISO() });
    s().removeTask(t.id);
    expect(s().tasks.find((x) => x.id === t.id)).toBe(undefined);
    expect(s().milestones.filter((m) => m.taskId === t.id)).toHaveLength(0);
  });

  it("distributeMilestones spreads `count` milestones up to the deadline", () => {
    const t = s().addTask({
      title: "X",
      areaId: "area_study",
      deadline: addDaysISO(todayISO(), 3),
    });
    s().distributeMilestones(t.id, { count: 4 });
    const ms = s()
      .milestones.filter((m) => m.taskId === t.id)
      .sort((a, b) => a.order - b.order);
    expect(ms).toHaveLength(4);
    expect(ms.map((m) => m.date)).toEqual([
      todayISO(),
      addDaysISO(todayISO(), 1),
      addDaysISO(todayISO(), 2),
      addDaysISO(todayISO(), 3),
    ]);
  });

  it("removeArea cascades to its tasks + milestones and resets the area filter", () => {
    const t = s().addTask({ title: "X", areaId: "area_intern", deadline: todayISO() });
    s().addMilestone({ taskId: t.id, title: "a", date: todayISO() });
    s().setActiveArea("area_intern");
    s().removeArea("area_intern");
    expect(s().areas.find((a) => a.id === "area_intern")).toBe(undefined);
    expect(s().tasks.find((x) => x.id === t.id)).toBe(undefined);
    expect(s().milestones.filter((m) => m.taskId === t.id)).toHaveLength(0);
    expect(s().activeAreaId).toBe("all");
  });

  it("won't remove the last remaining area", () => {
    s().removeArea("area_study");
    s().removeArea("area_intern");
    expect(s().areas).toHaveLength(1);
    s().removeArea("area_personal");
    expect(s().areas).toHaveLength(1);
  });

  it("ships three default labels", () => {
    expect(s().labels.map((l) => l.name)).toEqual(["feat", "chore", "explore"]);
  });

  it("addLabel / removeLabel manages labels and cascades to tasks + filter", () => {
    const before = s().labels.length;
    const lbl = s().addLabel("urgent", "rose");
    expect(s().labels.length).toBe(before + 1);
    const t = s().addTask({
      title: "X",
      areaId: "area_study",
      deadline: todayISO(),
      labelIds: [lbl.id],
    });
    s().toggleLabelFilter(lbl.id);
    expect(s().activeLabelIds).toEqual([lbl.id]);
    s().removeLabel(lbl.id);
    expect(s().labels.find((x) => x.id === lbl.id)).toBe(undefined);
    expect(s().tasks.find((x) => x.id === t.id)?.labelIds).toEqual([]);
    expect(s().activeLabelIds).toEqual([]);
  });

  it("label filter toggles on and off", () => {
    expect(s().activeLabelIds).toHaveLength(0);
    s().toggleLabelFilter("label_feat");
    expect(s().activeLabelIds).toEqual(["label_feat"]);
    s().toggleLabelFilter("label_feat");
    expect(s().activeLabelIds).toHaveLength(0);
  });

  it("updateTask patches fields", () => {
    const t = s().addTask({ title: "X", areaId: "area_study", deadline: todayISO() });
    s().updateTask(t.id, { title: "Y" });
    expect(s().tasks.find((x) => x.id === t.id)?.title).toBe("Y");
  });

  it("moveMilestone reassigns the day", () => {
    const t = s().addTask({
      title: "X",
      areaId: "area_study",
      deadline: addDaysISO(todayISO(), 2),
    });
    const m = s().addMilestone({ taskId: t.id, title: "a", date: todayISO() });
    s().moveMilestone(m.id, addDaysISO(todayISO(), 2));
    expect(s().milestones.find((x) => x.id === m.id)?.date).toBe(
      addDaysISO(todayISO(), 2),
    );
  });

  it("replaceAll swaps the entire dataset (used by cloud sync)", () => {
    s().replaceAll({
      areas: [{ id: "a", name: "A", color: "indigo" }],
      labels: [{ id: "l", name: "x", color: "rose" }],
      tasks: [
        {
          id: "t",
          title: "T",
          areaId: "a",
          deadline: todayISO(),
          labelIds: ["l"],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      milestones: [],
    });
    expect(s().areas.map((a) => a.id)).toEqual(["a"]);
    expect(s().labels.map((l) => l.id)).toEqual(["l"]);
    expect(s().tasks).toHaveLength(1);
    expect(s().milestones).toHaveLength(0);
  });
});

describe("migrateState (persistence migration)", () => {
  it("upgrades pre-refactor tasks (labels[] → labelIds) and fills gaps", () => {
    const out = migrateState({
      areas: [{ id: "a1", name: "Study", color: "sky" }],
      tasks: [
        {
          id: "t1",
          title: "X",
          areaId: "a1",
          deadline: "2026-06-21",
          labels: ["feat", "chore"],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "t2",
          title: "Y",
          areaId: "a1",
          deadline: "2026-06-22",
          labelIds: ["label_explore"],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      milestones: [],
      activeAreaId: "all",
      activeLabels: ["feat"],
    });
    expect(out.tasks[0].labelIds).toEqual(["label_feat", "label_chore"]);
    // legacy `labels` field is dropped
    expect((out.tasks[0] as unknown as { labels?: unknown }).labels).toBe(
      undefined,
    );
    expect(out.tasks[1].labelIds).toEqual(["label_explore"]);
    expect(out.activeLabelIds).toEqual(["label_feat"]);
    // labels were missing → defaulted
    expect(out.labels).toHaveLength(3);
  });

  it("returns sane defaults for empty / garbage input", () => {
    const out = migrateState(undefined);
    expect(out.areas).toHaveLength(3);
    expect(out.labels).toHaveLength(3);
    expect(out.tasks).toEqual([]);
    expect(out.activeAreaId).toBe("all");
    expect(out.activeLabelIds).toEqual([]);
  });
});
