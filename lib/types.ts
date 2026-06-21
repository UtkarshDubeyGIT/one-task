export type ID = string;

/** Todoist-style task labels. */
export type LabelKind = "feat" | "chore" | "explore";

export const LABELS: LabelKind[] = ["feat", "chore", "explore"];

export type AreaColor =
  | "indigo"
  | "violet"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "slate";

export const AREA_COLORS: AreaColor[] = [
  "indigo",
  "violet",
  "sky",
  "emerald",
  "amber",
  "rose",
  "cyan",
  "slate",
];

/** A top-level bucket: Study, Intern Work, Personal Projects, ... */
export interface Area {
  id: ID;
  name: string;
  color: AreaColor;
}

/** A deadline-bearing item that breaks down into daily milestones. */
export interface Task {
  id: ID;
  title: string;
  areaId: ID;
  /** Final deadline, ISO date (yyyy-MM-dd). */
  deadline: string;
  labels: LabelKind[];
  notes?: string;
  createdAt: string;
}

/** A daily sub-task of a Task, assigned to a specific day. */
export interface Milestone {
  id: ID;
  taskId: ID;
  title: string;
  /** The day this milestone is planned for, ISO date (yyyy-MM-dd). */
  date: string;
  done: boolean;
  /** Ordering within a given day. */
  order: number;
  createdAt: string;
}

export type AreaFilter = ID | "all";

export type ViewKey = "next" | "timeline" | "board" | "planning";
