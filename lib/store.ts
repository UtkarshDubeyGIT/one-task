"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Area, AreaColor, AreaFilter, ID, LabelKind, Milestone, Task } from "./types";
import { todayISO } from "./date";
import { distributeDates } from "./planning";
import { defaultAreas, makeSeed } from "./seed";
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
  tasks: Task[];
  milestones: Milestone[];
  activeAreaId: AreaFilter;
  activeLabels: LabelKind[];
}

export interface PlannerState extends PersistedSlice {
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  setActiveArea: (id: AreaFilter) => void;
  toggleLabelFilter: (label: LabelKind) => void;
  clearFilters: () => void;

  addArea: (name: string, color: AreaColor) => Area;
  updateArea: (id: ID, patch: Partial<Omit<Area, "id">>) => void;
  removeArea: (id: ID) => void;

  addTask: (input: {
    title: string;
    areaId: ID;
    deadline: string;
    labels?: LabelKind[];
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
    tasks,
    milestones,
    activeAreaId: "all",
    activeLabels: [],
  };
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...buildInitial(),
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setActiveArea: (id) => set({ activeAreaId: id }),
      toggleLabelFilter: (label) =>
        set((s) => ({
          activeLabels: s.activeLabels.includes(label)
            ? s.activeLabels.filter((l) => l !== label)
            : [...s.activeLabels, label],
        })),
      clearFilters: () => set({ activeAreaId: "all", activeLabels: [] }),

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

      addTask: (input) => {
        const task: Task = {
          id: uid("task"),
          title: input.title.trim(),
          areaId: input.areaId,
          deadline: input.deadline,
          labels: input.labels ?? [],
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
        set({ areas: defaultAreas, tasks, milestones });
      },
      clearTasks: () => set({ tasks: [], milestones: [] }),
    }),
    {
      name: "deadline-task-manager.v1",
      version: 1,
      storage,
      partialize: (s): PersistedSlice => ({
        areas: s.areas,
        tasks: s.tasks,
        milestones: s.milestones,
        activeAreaId: s.activeAreaId,
        activeLabels: s.activeLabels,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
