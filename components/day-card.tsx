"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import type { MilestoneView } from "@/lib/selectors";
import {
  formatDayNum,
  formatWeekdayShort,
  isPastISO,
  isTodayISO,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { MilestoneRow } from "./milestone-row";

export function DayCard({
  dayIso,
  views,
  onToggle,
  onOpen,
  onAdd,
  onDropMilestone,
  className,
}: {
  dayIso: string;
  views: MilestoneView[];
  onToggle: (id: string) => void;
  onOpen: (taskId: string) => void;
  onAdd?: (dayIso: string) => void;
  onDropMilestone?: (milestoneId: string, dayIso: string) => void;
  className?: string;
}) {
  const today = isTodayISO(dayIso);
  const past = isPastISO(dayIso);
  const total = views.length;
  const done = views.filter((v) => v.done).length;
  const [isOver, setIsOver] = React.useState(false);

  const draggable = Boolean(onDropMilestone);

  return (
    <div
      onDragOver={
        onDropMilestone
          ? (e) => {
              e.preventDefault();
              if (!isOver) setIsOver(true);
            }
          : undefined
      }
      onDragLeave={
        onDropMilestone
          ? (e) => {
              if (e.currentTarget === e.target) setIsOver(false);
            }
          : undefined
      }
      onDrop={
        onDropMilestone
          ? (e) => {
              e.preventDefault();
              setIsOver(false);
              const id = e.dataTransfer.getData("text/plain");
              if (id) onDropMilestone(id, dayIso);
            }
          : undefined
      }
      className={cn(
        "flex flex-col rounded-xl border bg-card/60 transition-all duration-200",
        today && "border-primary/50 ring-1 ring-primary/25",
        past && !today && "opacity-80",
        isOver && "border-primary bg-primary/10 ring-2 ring-primary/40",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3 py-2",
          today && "bg-primary/5",
        )}
      >
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wide",
              today ? "text-primary" : "text-muted-foreground",
            )}
          >
            {formatWeekdayShort(dayIso)}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatDayNum(dayIso)}
          </span>
          {today && (
            <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-medium text-primary">
              today
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {total > 0 && (
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {done}/{total}
            </span>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={() => onAdd(dayIso)}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Add a task due this day"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-1.5">
        {total === 0 ? (
          <div className="flex flex-1 items-center justify-center px-2 py-5 text-center text-[11px] text-muted-foreground/50">
            {isOver ? "drop here" : "no milestones"}
          </div>
        ) : (
          views.map((v) => (
            <div
              key={v.id}
              draggable={draggable}
              onDragStart={
                draggable
                  ? (e) => {
                      e.dataTransfer.setData("text/plain", v.id);
                      e.dataTransfer.effectAllowed = "move";
                    }
                  : undefined
              }
              className={cn(draggable && "cursor-grab active:cursor-grabbing")}
            >
              <MilestoneRow view={v} onToggle={onToggle} onOpen={onOpen} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
