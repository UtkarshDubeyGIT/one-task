"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { usePlanner } from "@/lib/store";
import { filterViews, joinMilestones, milestonesForDay } from "@/lib/selectors";
import {
  addDaysISO,
  addMonthsISO,
  formatMonthDay,
  formatMonthYear,
  isTodayISO,
  sameMonthISO,
  startOfMonthISO,
  startOfWeekISO,
  todayISO,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { useTaskDialog } from "./app-providers";
import { AreaDot } from "./area-dot";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TimelineView() {
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const areas = usePlanner((s) => s.areas);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const activeLabelIds = usePlanner((s) => s.activeLabelIds);
  const moveMilestone = usePlanner((s) => s.moveMilestone);
  const { openEdit, openCreate } = useTaskDialog();

  const [mode, setMode] = React.useState<"month" | "week">("month");
  const [anchor, setAnchor] = React.useState(() => startOfMonthISO(todayISO()));
  const [overDay, setOverDay] = React.useState<string | null>(null);

  const views = React.useMemo(
    () =>
      filterViews(
        joinMilestones(milestones, tasks, areas),
        activeAreaId,
        activeLabelIds,
      ),
    [milestones, tasks, areas, activeAreaId, activeLabelIds],
  );

  const { days, label } = React.useMemo(() => {
    if (mode === "week") {
      const start = startOfWeekISO(anchor, 0);
      const d = Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
      return { days: d, label: `Week of ${formatMonthDay(start)}` };
    }
    const first = startOfMonthISO(anchor);
    const gridStart = startOfWeekISO(first, 0);
    const d = Array.from({ length: 42 }, (_, i) => addDaysISO(gridStart, i));
    return { days: d, label: formatMonthYear(first) };
  }, [mode, anchor]);

  const maxVisible = mode === "week" ? 12 : 3;

  const go = (dir: number) =>
    setAnchor((a) => (mode === "week" ? addDaysISO(a, dir * 7) : addMonthsISO(a, dir)));
  const goToday = () =>
    setAnchor(mode === "week" ? todayISO() : startOfMonthISO(todayISO()));

  return (
    <div className="flex flex-col gap-4 duration-300 animate-in fade-in-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-pixel-square text-xl tracking-tight">Timeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {label}
            <span className="ml-2 hidden text-muted-foreground/60 sm:inline">
              · drag to reschedule
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-md border p-0.5">
            {(["month", "week"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded px-2.5 py-1 font-pixel-square text-xs capitalize transition-colors",
                  mode === m
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => go(-1)}
            aria-label="Previous"
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => go(1)}
            aria-label="Next"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-border">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="bg-card px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}

          {days.map((day) => {
            const dayViews = milestonesForDay(day, views);
            const today = isTodayISO(day);
            const inMonth = mode === "week" || sameMonthISO(day, anchor);
            const isOver = overDay === day;
            const visible = dayViews.slice(0, maxVisible);
            const extra = dayViews.length - visible.length;

            return (
              <div
                key={day}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overDay !== day) setOverDay(day);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) {
                    setOverDay((d) => (d === day ? null : d));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverDay(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveMilestone(id, day);
                }}
                className={cn(
                  "group relative flex flex-col gap-1 bg-card p-1.5 transition-colors",
                  mode === "week" ? "min-h-[18rem]" : "min-h-[5.75rem] sm:min-h-[7rem]",
                  !inMonth && "bg-card/40",
                  isOver && "bg-primary/10 ring-1 ring-inset ring-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-xs tabular-nums",
                      today
                        ? "bg-primary font-semibold text-primary-foreground"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/40",
                    )}
                  >
                    {day.slice(8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreate({ deadline: day })}
                    aria-label="Add a task due this day"
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5">
                  {visible.map((v) => (
                    <button
                      key={v.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", v.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => openEdit(v.taskId)}
                      title={`${v.title} — ${v.task.title}`}
                      className={cn(
                        "flex cursor-grab items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight transition-colors hover:bg-accent active:cursor-grabbing",
                        v.done && "opacity-50",
                      )}
                    >
                      {v.area && <AreaDot color={v.area.color} className="size-1.5" />}
                      <span className={cn("truncate", v.done && "line-through")}>
                        {v.title}
                      </span>
                    </button>
                  ))}
                  {extra > 0 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{extra} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
