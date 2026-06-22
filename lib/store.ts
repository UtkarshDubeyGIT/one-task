"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  Area,
  AreaColor,
  AreaFilter,
  ID,
  Label,
  Milestone,
  Snapshot,
  SyncStatus,
  Task,
} from "./types";
import { todayISO } from "./date";
import { distributeDates } from "./planning";
import { defaultAreas, defaultLabels, makeSeed } from "./seed";
import { uid } from "./utils";

/**
 * ── Persistence layer ────────────────────────────────────────────────────────
 * State persists to localStorage today. Every mutation goes through the actions
 * below, so swapping this for a remote/synced backend later means changing only
 * (a) the `storage` adapter here and (b) wrapping these actions in async API
 * calls — the components never touch storage directly.
 */
const storage = createJSONStorage<PersistedSlice>(() =>
  typeof window !== "undefined"
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
);

interface PersistedSlice {
  areas: Area[];
  labels: Label[];
  tasks: Task[];
  milestones: Milestone[];
  activeAreaId: AreaFilter;
  activeLabelIds: ID[];
}

const LABEL_KIND_TO_ID: Record<string, string> = {
  feat: "label_feat",
  chore: "label_chore",
  explore: "label_explore",
};

/**
 * Normalizes any older persisted shape to the current slice. Critically it
 * repairs pre-`labelIds` data: tasks saved before the labels refactor carried a
 * `labels: string[]` field and no `labelIds`, which crashed label rendering.
 * Idempotent — already-current data passes through unchanged.
 */
export function migrateState(persisted: unknown): PersistedSlice {
  const s = (persisted && typeof persisted === "object"
    ? persisted
    : {}) as Record<string, unknown>;

  const areas = Array.isArray(s.areas) ? (s.areas as Area[]) : [];
  const labels = Array.isArray(s.labels) ? (s.labels as Label[]) : [];
  const milestones = Array.isArray(s.milestones)
    ? (s.milestones as Milestone[])
    : [];

  const rawTasks = Array.isArray(s.tasks)
    ? (s.tasks as Record<string, unknown>[])
    : [];
  const tasks: Task[] = rawTasks.map((t) => {
    const labelIds = Array.isArray(t.labelIds)
      ? (t.labelIds as string[])
      : Array.isArray(t.labels)
        ? (t.labels as string[]).map((k) => LABEL_KIND_TO_ID[k]).filter(Boolean)
        : [];
    const { labels: _legacy, ...rest } = t;
    return { ...(rest as Record<string, unknown>), labelIds } as unknown as Task;
  });

  // Backfill: any task with no milestones gets one on its deadline, so every
  // todo stays visible in the views (which render milestones, not tasks).
  const milestoneTaskIds = new Set(milestones.map((m) => m.taskId));
  const milestonesWithBackfill: Milestone[] = [...milestones];
  for (const t of tasks) {
    if (!milestoneTaskIds.has(t.id)) {
      milestonesWithBackfill.push({
        id: uid("m"),
        taskId: t.id,
        title: t.title,
        date: t.deadline,
        done: false,
        order: 0,
        createdAt: t.createdAt ?? new Date().toISOString(),
      });
    }
  }

  const activeLabelIds = Array.isArray(s.activeLabelIds)
    ? (s.activeLabelIds as string[])
    : (Array.isArray(s.activeLabels) ? (s.activeLabels as string[]) : [])
        .map((k) => LABEL_KIND_TO_ID[k])
        .filter(Boolean);

  return {
    areas: areas.length ? areas : defaultAreas,
    labels: labels.length ? labels : defaultLabels,
    tasks,
    milestones: milestonesWithBackfill,
    activeAreaId:
      typeof s.activeAreaId === "string" ? (s.activeAreaId as AreaFilter) : "all",
    activeLabelIds,
  };
}

export interface PlannerState extends PersistedSlice {
  hasHydrated: boolean;
  syncStatus: SyncStatus;

  setHasHydrated: (v: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  replaceAll: (snapshot: Snapshot) => void;
  setActiveArea: (id: AreaFilter) => void;
  toggleLabelFilter: (labelId: ID) => void;
  clearFilters: () => void;

  addArea: (name: string, color: AreaColor) => Area;
  updateArea: (id: ID, patch: Partial<Omit<Area, "id">>) => void;
  removeArea: (id: ID) => void;

  addLabel: (name: string, color: AreaColor) => Label;
  updateLabel: (id: ID, patch: Partial<Omit<Label, "id">>) => void;
  removeLabel: (id: ID) => void;

  addTask: (input: {
    title: string;
    areaId: ID;
    deadline: string;
    labelIds?: ID[];
    notes?: string;
  }) => Task;
  updateTask: (id: ID, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  removeTask: (id: ID) => void;

  addMilestone: (input: { taskId: ID; title: string; date: string }) => Milestone;
  updateMilestone: (
    id: ID,
    patch: Partial<Omit<Milestone, "id" | "taskId" | "createdAt">>,
  ) => void;
  toggleMilestone: (id: ID) => void;
  removeMilestone: (id: ID) => void;
  moveMilestone: (id: ID, date: string) => void;

  /** Deterministically spread N milestones evenly from a start day → deadline. */
  distributeMilestones: (
    taskId: ID,
    opts: { titles?: string[]; count?: number; startDate?: string },
  ) => void;

  reseed: () => void;
  clearTasks: () => void;
}

function buildInitial(): PersistedSlice {
  const { tasks, milestones } = makeSeed();
  return {
    areas: defaultAreas,
    labels: defaultLabels,
    tasks,
    milestones,
    activeAreaId: "all",
    activeLabelIds: [],
  };
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...buildInitial(),
      hasHydrated: false,
      syncStatus: "idle",

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      replaceAll: (snapshot) =>
        set((s) => ({
          // Never let a malformed/empty remote snapshot wipe areas or labels,
          // and guarantee every task has a labelIds array.
          areas:
            Array.isArray(snapshot.areas) && snapshot.areas.length
              ? snapshot.areas
              : s.areas,
          labels:
            Array.isArray(snapshot.labels) && snapshot.labels.length
              ? snapshot.labels
              : s.labels,
          milestones: Array.isArray(snapshot.milestones)
            ? snapshot.milestones
            : s.milestones,
          tasks: Array.isArray(snapshot.tasks)
            ? snapshot.tasks.map((t) => ({
                ...t,
                labelIds: Array.isArray(t.labelIds) ? t.labelIds : [],
              }))
            : s.tasks,
        })),
      setActiveArea: (id) => set({ activeAreaId: id }),
      toggleLabelFilter: (labelId) =>
        set((s) => ({
          activeLabelIds: s.activeLabelIds.includes(labelId)
            ? s.activeLabelIds.filter((l) => l !== labelId)
            : [...s.activeLabelIds, labelId],
        })),
      clearFilters: () => set({ activeAreaId: "all", activeLabelIds: [] }),

      addArea: (name, color) => {
        const area: Area = { id: uid("area"), name: name.trim() || "Untitled", color };
        set((s) => ({ areas: [...s.areas, area] }));
        return area;
      },
      updateArea: (id, patch) =>
        set((s) => ({
          areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeArea: (id) =>
        set((s) => {
          // Never remove the last area — tasks always need a home.
          if (s.areas.length <= 1) return s;
          const taskIds = new Set(
            s.tasks.filter((t) => t.areaId === id).map((t) => t.id),
          );
          return {
            areas: s.areas.filter((a) => a.id !== id),
            tasks: s.tasks.filter((t) => t.areaId !== id),
            milestones: s.milestones.filter((m) => !taskIds.has(m.taskId)),
            activeAreaId: s.activeAreaId === id ? "all" : s.activeAreaId,
          };
        }),

      addLabel: (name, color) => {
        const label: Label = {
          id: uid("label"),
          name: name.trim() || "label",
          color,
        };
        set((s) => ({ labels: [...s.labels, label] }));
        return label;
      },
      updateLabel: (id, patch) =>
        set((s) => ({
          labels: s.labels.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      removeLabel: (id) =>
        set((s) => ({
          labels: s.labels.filter((l) => l.id !== id),
          tasks: s.tasks.map((t) =>
            t.labelIds.includes(id)
              ? { ...t, labelIds: t.labelIds.filter((x) => x !== id) }
              : t,
          ),
          activeLabelIds: s.activeLabelIds.filter((x) => x !== id),
        })),

      addTask: (input) => {
        const task: Task = {
          id: uid("task"),
          title: input.title.trim(),
          areaId: input.areaId,
          deadline: input.deadline,
          labelIds: input.labelIds ?? [],
          notes: input.notes?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          milestones: s.milestones.filter((m) => m.taskId !== id),
        })),

      addMilestone: (input) => {
        const order =
          get().milestones.filter((m) => m.taskId === input.taskId).length;
        const milestone: Milestone = {
          id: uid("m"),
          taskId: input.taskId,
          title: input.title.trim(),
          date: input.date,
          done: false,
          order,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ milestones: [...s.milestones, milestone] }));
        return milestone;
      },
      updateMilestone: (id, patch) =>
        set((s) => ({
          milestones: s.milestones.map((m) =>
            m.id === id ? { ...m, ...patch } : m,
          ),
        })),
      toggleMilestone: (id) =>
        set((s) => ({
          milestones: s.milestones.map((m) =>
            m.id === id ? { ...m, done: !m.done } : m,
          ),
        })),
      removeMilestone: (id) =>
        set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) })),
      moveMilestone: (id, date) =>
        set((s) => ({
          milestones: s.milestones.map((m) =>
            m.id === id ? { ...m, date } : m,
          ),
        })),

      distributeMilestones: (taskId, opts) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const titles =
          opts.titles && opts.titles.length > 0 ? opts.titles : null;
        const n = titles ? titles.length : Math.max(1, opts.count ?? 4);
        const dates = distributeDates(
          opts.startDate ?? todayISO(),
          task.deadline,
          n,
        );
        if (dates.length === 0) return;

        const existing = state.milestones.filter(
          (m) => m.taskId === taskId,
        ).length;
        const now = new Date().toISOString();
        const created: Milestone[] = dates.map((date, i) => ({
          id: uid("m"),
          taskId,
          title: titles
            ? titles[i].trim() || `Milestone ${i + 1}`
            : `Milestone ${i + 1}`,
          date,
          done: false,
          order: existing + i,
          createdAt: now,
        }));
        set((s) => ({ milestones: [...s.milestones, ...created] }));
      },

      reseed: () => {
        const { tasks, milestones } = makeSeed();
        set({
          areas: defaultAreas,
          labels: defaultLabels,
          tasks,
          milestones,
        });
      },
      clearTasks: () => set({ tasks: [], milestones: [] }),
    }),
    {
      name: "deadline-task-manager.v1",
      version: 3,
      storage,
      migrate: (persisted) => migrateState(persisted) as unknown as PlannerState,
      partialize: (s): PersistedSlice => ({
        areas: s.areas,
        labels: s.labels,
        tasks: s.tasks,
        milestones: s.milestones,
        activeAreaId: s.activeAreaId,
        activeLabelIds: s.activeLabelIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
