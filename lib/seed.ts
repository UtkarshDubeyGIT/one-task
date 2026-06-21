import type { Area, Label, Milestone, Task } from "./types";
import { uid } from "./utils";
import { addDaysISO, todayISO } from "./date";

export const defaultAreas: Area[] = [
  { id: "area_study", name: "Study", color: "sky" },
  { id: "area_intern", name: "Intern Work", color: "violet" },
  { id: "area_personal", name: "Personal Projects", color: "emerald" },
];

export const defaultLabels: Label[] = [
  { id: "label_feat", name: "feat", color: "violet" },
  { id: "label_chore", name: "chore", color: "amber" },
  { id: "label_explore", name: "explore", color: "sky" },
];

interface SeedData {
  tasks: Task[];
  milestones: Milestone[];
}

/**
 * Deterministic sample data anchored to "today" so the timeline always looks
 * current. Demonstrates overdue / today / upcoming, progress, gaps & clusters.
 */
export function makeSeed(): SeedData {
  const t = todayISO();
  const now = new Date().toISOString();
  const tasks: Task[] = [];
  const milestones: Milestone[] = [];

  const addTask = (task: Omit<Task, "createdAt">): Task => {
    const full: Task = { ...task, createdAt: now };
    tasks.push(full);
    return full;
  };
  const addM = (
    taskId: string,
    title: string,
    date: string,
    done: boolean,
    order: number,
  ) => {
    milestones.push({
      id: uid("m"),
      taskId,
      title,
      date,
      done,
      order,
      createdAt: now,
    });
  };

  // 1. Personal Projects — the headline feature, due in 4 days.
  const sarvam = addTask({
    id: "task_sarvam",
    title: "Integrate Sarvam AI + Twilio + LiveKit",
    areaId: "area_personal",
    deadline: addDaysISO(t, 4),
    labelIds: ["label_feat"],
    notes: "Voice agent MVP: phone call in → LiveKit room → Sarvam STT/TTS.",
  });
  addM(sarvam.id, "LiveKit room + token server", t, true, 0);
  addM(sarvam.id, "Twilio voice webhook → SIP bridge", addDaysISO(t, 1), false, 1);
  addM(sarvam.id, "Sarvam AI STT + TTS streaming", addDaysISO(t, 2), false, 2);
  addM(sarvam.id, "End-to-end call test + deploy", addDaysISO(t, 4), false, 3);

  // 2. Intern Work — due in 2 days.
  const dash = addTask({
    id: "task_dashboard",
    title: "Ship analytics dashboard v2",
    areaId: "area_intern",
    deadline: addDaysISO(t, 2),
    labelIds: ["label_feat", "label_chore"],
  });
  addM(dash.id, "Fix date-range filter bug", t, false, 0);
  addM(dash.id, "Add cohort retention chart", addDaysISO(t, 1), false, 1);
  addM(dash.id, "PR review + deploy to staging", addDaysISO(t, 2), false, 2);

  // 3. Intern Work — has an OVERDUE milestone (yesterday).
  const docs = addTask({
    id: "task_apidocs",
    title: "Write API docs for auth service",
    areaId: "area_intern",
    deadline: addDaysISO(t, 1),
    labelIds: ["label_chore"],
  });
  addM(docs.id, "Draft endpoint reference", addDaysISO(t, -1), false, 0);
  addM(docs.id, "Examples + error codes", addDaysISO(t, 1), false, 1);

  // 4. Study — due in 6 days, some progress made.
  const dsa = addTask({
    id: "task_dsa",
    title: "DSA: Graphs module",
    areaId: "area_study",
    deadline: addDaysISO(t, 6),
    labelIds: ["label_explore"],
  });
  addM(dsa.id, "Watch BFS / DFS lecture", t, true, 0);
  addM(dsa.id, "Solve 5 graph problems", addDaysISO(t, 2), false, 1);
  addM(dsa.id, "Revise + make flashcards", addDaysISO(t, 5), false, 2);
  addM(dsa.id, "Timed mock test", addDaysISO(t, 6), false, 3);

  // 5. Personal Projects — later, shows a gap then a cluster.
  const portfolio = addTask({
    id: "task_portfolio",
    title: "Portfolio site refresh",
    areaId: "area_personal",
    deadline: addDaysISO(t, 9),
    labelIds: ["label_feat", "label_explore"],
  });
  addM(portfolio.id, "New hero + case-study layout", addDaysISO(t, 3), false, 0);
  addM(portfolio.id, "Dark mode + page transitions", addDaysISO(t, 6), false, 1);
  addM(portfolio.id, "Deploy + SEO pass", addDaysISO(t, 9), false, 2);

  return { tasks, milestones };
}
