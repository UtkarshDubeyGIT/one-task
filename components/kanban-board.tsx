"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { usePlanner } from "@/lib/store";
import {
  filterViews,
  joinMilestones,
  kanbanColumns,
  type MilestoneView,
} from "@/lib/selectors";
import { addDaysISO, relativeDeadline, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useTaskDialog } from "./app-providers";
import { AreaDot } from "./area-dot";
import { TaskLabels } from "./task-labels";

const accentBar: Record<string, string> = {
  destructive: "bg-destructive",
  primary: "bg-primary",
  warning: "bg-warning",
  muted: "bg-muted-foreground/40",
  success: "bg-success",
};

/** What dropping a card into a column does (columns are time buckets). */
function dropPatch(
  colId: string,
  today: string,
): { date?: string; done?: boolean } | null {
  switch (colId) {
    case "today":
      return { date: today, done: false };
    case "week":
      return { date: addDaysISO(today, 2), done: false };
    case "later":
      return { date: addDaysISO(today, 8), done: false };
    case "done":
      return { done: true };
    default:
      return null; // "overdue" isn't a meaningful drop target
  }
}

function KanbanCard({
  view,
  onToggle,
  onOpen,
}: {
  view: MilestoneView;
  onToggle: (id: string) => void;
  onOpen: (taskId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", view.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpen(view.taskId)}
      className="group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-foreground/25 active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(view.id);
          }}
          aria-label={view.done ? "Mark not done" : "Mark done"}
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            view.done
              ? "border-success bg-success text-success-foreground"
              : "border-muted-foreground/40 hover:border-primary",
          )}
        >
          {view.done && <Check className="size-2.5" strokeWidth={3} />}
        </button>
        <p
          className={cn(
            "text-sm leading-snug",
            view.done ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {view.title}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5 pl-6">
        {view.area && <AreaDot color={view.area.color} />}
        <span className="truncate text-xs text-muted-foreground">
          {view.task.title}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1 pl-6">
        <TaskLabels labelIds={view.task.labelIds} />
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
          {relativeDeadline(view.date).replace("due ", "")}
        </span>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const areas = usePlanner((s) => s.areas);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const activeLabelIds = usePlanner((s) => s.activeLabelIds);
  const toggleMilestone = usePlanner((s) => s.toggleMilestone);
  const updateMilestone = usePlanner((s) => s.updateMilestone);
  const { openEdit } = useTaskDialog();

  const [overCol, setOverCol] = React.useState<string | null>(null);
  const today = todayISO();

  const columns = React.useMemo(() => {
    const views = filterViews(
      joinMilestones(milestones, tasks, areas),
      activeAreaId,
      activeLabelIds,
    );
    return kanbanColumns(views);
  }, [milestones, tasks, areas, activeAreaId, activeLabelIds]);

  return (
    <div className="flex flex-col gap-4 duration-300 animate-in fade-in-0">
      <div>
        <h1 className="font-pixel-square text-xl tracking-tight">Board</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Milestones bucketed by deadline — drag a card to reschedule it.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
        {columns.map((col) => {
          const isDropTarget = col.id !== "overdue";
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                if (!isDropTarget) return;
                e.preventDefault();
                if (overCol !== col.id) setOverCol(col.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) {
                  setOverCol((c) => (c === col.id ? null : c));
                }
              }}
              onDrop={(e) => {
                if (!isDropTarget) return;
                e.preventDefault();
                setOverCol(null);
                const id = e.dataTransfer.getData("text/plain");
                const patch = dropPatch(col.id, today);
                if (id && patch) updateMilestone(id, patch);
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-background/40 transition-colors duration-200",
                overCol === col.id &&
                  "border-primary/60 bg-primary/5 ring-1 ring-primary/30",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("size-2 rounded-full", accentBar[col.accent])}
                  />
                  <span className="text-sm font-medium">{col.title}</span>
                </div>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {col.items.length}
                </span>
              </div>
              <div className="flex min-h-[3rem] flex-col gap-2 p-2">
                {col.items.length === 0 ? (
                  <p className="px-1 py-3 text-center text-xs text-muted-foreground/50">
                    {overCol === col.id ? "drop here" : "empty"}
                  </p>
                ) : (
                  col.items.map((v) => (
                    <KanbanCard
                      key={v.id}
                      view={v}
                      onToggle={toggleMilestone}
                      onOpen={openEdit}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
