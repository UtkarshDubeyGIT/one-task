"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { usePlanner } from "@/lib/store";
import { filterViews, joinMilestones, milestonesForDay } from "@/lib/selectors";
import { addDaysISO, formatMonthDay, rangeISO, todayISO } from "@/lib/date";
import { useTaskDialog } from "./app-providers";
import { DayCard } from "./day-card";
import { Button } from "@/components/ui/button";

const DAYS = 14;

export function TimelineView() {
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const areas = usePlanner((s) => s.areas);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const activeLabelIds = usePlanner((s) => s.activeLabelIds);
  const toggleMilestone = usePlanner((s) => s.toggleMilestone);
  const moveMilestone = usePlanner((s) => s.moveMilestone);
  const { openEdit, openCreate } = useTaskDialog();

  const [start, setStart] = React.useState(todayISO());

  const views = React.useMemo(
    () =>
      filterViews(
        joinMilestones(milestones, tasks, areas),
        activeAreaId,
        activeLabelIds,
      ),
    [milestones, tasks, areas, activeAreaId, activeLabelIds],
  );
  const days = React.useMemo(() => rangeISO(start, DAYS), [start]);
  const byDay = React.useMemo(
    () => days.map((d) => ({ day: d, items: milestonesForDay(d, views) })),
    [days, views],
  );

  return (
    <div className="flex flex-col gap-4 duration-300 animate-in fade-in-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Timeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatMonthDay(days[0])} – {formatMonthDay(days[days.length - 1])}
            <span className="ml-2 text-muted-foreground/70">
              · gaps and clusters at a glance
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setStart(addDaysISO(start, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStart(todayISO())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setStart(addDaysISO(start, 7))}
            aria-label="Next week"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap lg:flex-nowrap lg:overflow-x-auto lg:pb-3 scrollbar-thin">
        {byDay.map(({ day, items }) => (
          <DayCard
            key={day}
            dayIso={day}
            views={items}
            onToggle={toggleMilestone}
            onOpen={openEdit}
            onAdd={(d) => openCreate({ deadline: d })}
            onDropMilestone={(id, d) => moveMilestone(id, d)}
            className="md:w-[calc(50%-0.375rem)] lg:w-60 lg:shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
