"use client";

import { Plus } from "lucide-react";

import type { MilestoneView } from "@/lib/selectors";
import { formatDayNum, formatWeekdayShort, isPastISO, isTodayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { MilestoneRow } from "./milestone-row";

export function DayCard({
  dayIso,
  views,
  onToggle,
  onOpen,
  onAdd,
  className,
}: {
  dayIso: string;
  views: MilestoneView[];
  onToggle: (id: string) => void;
  onOpen: (taskId: string) => void;
  onAdd?: (dayIso: string) => void;
  className?: string;
}) {
  const today = isTodayISO(dayIso);
  const past = isPastISO(dayIso);
  const total = views.length;
  const done = views.filter((v) => v.done).length;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card/60",
        today && "border-primary/50 ring-1 ring-primary/25",
        past && !today && "opacity-80",
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
            no milestones
          </div>
        ) : (
          views.map((v) => (
            <MilestoneRow
              key={v.id}
              view={v}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
