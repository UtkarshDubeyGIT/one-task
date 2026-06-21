import type { Area, AreaFilter, LabelKind, Milestone, Task } from "./types";
import { compareISO, diffDays, todayISO } from "./date";

export interface MilestoneView extends Milestone {
  task: Task;
  area: Area | undefined;
}

/** Join milestones with their task + area, dropping orphans. */
export function joinMilestones(
  milestones: Milestone[],
  tasks: Task[],
  areas: Area[],
): MilestoneView[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const out: MilestoneView[] = [];
  for (const m of milestones) {
    const task = taskMap.get(m.taskId);
    if (!task) continue;
    out.push({ ...m, task, area: areaMap.get(task.areaId) });
  }
  return out;
}

export function taskPassesFilter(
  task: Task,
  areaId: AreaFilter,
  labels: LabelKind[],
): boolean {
  if (areaId !== "all" && task.areaId !== areaId) return false;
  if (labels.length > 0 && !labels.some((l) => task.labels.includes(l))) {
    return false;
  }
  return true;
}

export function filterViews(
  views: MilestoneView[],
  areaId: AreaFilter,
  labels: LabelKind[],
): MilestoneView[] {
  return views.filter((v) => taskPassesFilter(v.task, areaId, labels));
}

/** Canonical ordering: assigned day, then deadline, then intra-day order. */
export function sortByDayThenDeadline(
  a: MilestoneView,
  b: MilestoneView,
): number {
  return (
    compareISO(a.date, b.date) ||
    compareISO(a.task.deadline, b.task.deadline) ||
    a.order - b.order ||
    compareISO(a.createdAt, b.createdAt)
  );
}

export interface WhatsNext {
  overdue: MilestoneView[];
  today: MilestoneView[];
  doneToday: MilestoneView[];
  upNext: MilestoneView | null;
  upcoming: MilestoneView[];
  allClearToday: boolean;
}

/**
 * The core of the app. "What's next" is the earliest pending milestone by its
 * ASSIGNED DAY (then deadline) — not by creation order.
 */
export function computeWhatsNext(views: MilestoneView[]): WhatsNext {
  const today = todayISO();
  const pending = views.filter((v) => !v.done);

  const overdue = pending
    .filter((v) => compareISO(v.date, today) < 0)
    .sort(sortByDayThenDeadline);
  const todayPending = pending
    .filter((v) => v.date === today)
    .sort(sortByDayThenDeadline);
  const future = pending
    .filter((v) => compareISO(v.date, today) > 0)
    .sort(sortByDayThenDeadline);
  const doneToday = views.filter((v) => v.done && v.date === today);

  return {
    overdue,
    today: todayPending,
    doneToday,
    upNext: future[0] ?? null,
    upcoming: future,
    allClearToday: todayPending.length === 0,
  };
}

/** Milestones planned for a given day, done sinking to the bottom. */
export function milestonesForDay(
  dayIso: string,
  views: MilestoneView[],
): MilestoneView[] {
  return views
    .filter((v) => v.date === dayIso)
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        a.order - b.order ||
        compareISO(a.task.deadline, b.task.deadline),
    );
}

export interface Progress {
  done: number;
  total: number;
  pct: number;
}

export function taskProgress(taskId: string, milestones: Milestone[]): Progress {
  const ms = milestones.filter((m) => m.taskId === taskId);
  const total = ms.length;
  const done = ms.filter((m) => m.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export interface KanbanColumn {
  id: string;
  title: string;
  accent: "destructive" | "primary" | "warning" | "muted" | "success";
  items: MilestoneView[];
}

/** Deadline-first board: time buckets, not arbitrary sections. */
export function kanbanColumns(views: MilestoneView[]): KanbanColumn[] {
  const today = todayISO();
  const overdue: MilestoneView[] = [];
  const todayCol: MilestoneView[] = [];
  const week: MilestoneView[] = [];
  const later: MilestoneView[] = [];
  const done: MilestoneView[] = [];

  for (const v of views) {
    if (v.done) {
      done.push(v);
      continue;
    }
    const d = diffDays(v.date, today);
    if (d < 0) overdue.push(v);
    else if (d === 0) todayCol.push(v);
    else if (d <= 6) week.push(v);
    else later.push(v);
  }

  const s = (arr: MilestoneView[]) => arr.sort(sortByDayThenDeadline);
  return [
    { id: "overdue", title: "Overdue", accent: "destructive", items: s(overdue) },
    { id: "today", title: "Today", accent: "primary", items: s(todayCol) },
    { id: "week", title: "This week", accent: "warning", items: s(week) },
    { id: "later", title: "Upcoming", accent: "muted", items: s(later) },
    {
      id: "done",
      title: "Done",
      accent: "success",
      items: done.sort((a, b) => compareISO(b.date, a.date)),
    },
  ];
}

/** Tasks with a deadline within the next `days` days (for weekly planning). */
export function tasksDueWithin(
  tasks: Task[],
  days: number,
  fromIso: string = todayISO(),
): Task[] {
  return tasks
    .filter((t) => {
      const d = diffDays(t.deadline, fromIso);
      return d >= -3 && d <= days; // include slightly overdue too
    })
    .sort((a, b) => compareISO(a.deadline, b.deadline));
}
