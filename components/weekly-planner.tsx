"use client";

import * as React from "react";
import { CalendarRange, Check, Sparkles, TriangleAlert } from "lucide-react";

import type { Area, Milestone, Task } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { taskPassesFilter, taskProgress } from "@/lib/selectors";
import {
  compareISO,
  diffDays,
  formatWeekdayShort,
  relativeDeadline,
  todayISO,
} from "@/lib/date";
import { cn, clamp } from "@/lib/utils";
import { useTaskDialog } from "./app-providers";
import { AreaDot } from "./area-dot";
import { TaskLabels } from "./task-labels";
import { ProgressRing } from "./progress-ring";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GlowingBadge } from "@/components/unlumen/glowing-badge";

function DeadlinePill({ deadline }: { deadline: string }) {
  const d = diffDays(deadline, todayISO());
  const variant = d < 0 ? "error" : d <= 1 ? "warning" : "info";
  return <GlowingBadge variant={variant}>{relativeDeadline(deadline)}</GlowingBadge>;
}

function TaskPlanRow({
  task,
  area,
  allMilestones,
  onOpen,
  onDistribute,
  onToggle,
}: {
  task: Task;
  area: Area | undefined;
  allMilestones: Milestone[];
  onOpen: (taskId: string) => void;
  onDistribute: (taskId: string, count: number) => void;
  onToggle: (id: string) => void;
}) {
  const ms = React.useMemo(
    () =>
      allMilestones
        .filter((m) => m.taskId === task.id)
        .sort((a, b) => compareISO(a.date, b.date) || a.order - b.order),
    [allMilestones, task.id],
  );
  const prog = taskProgress(task.id, allMilestones);
  const unplanned = ms.length === 0;
  const [count, setCount] = React.useState(() =>
    clamp(diffDays(task.deadline, todayISO()) + 1, 1, 4),
  );

  return (
    <Card className={cn("p-4", unplanned && "border-warning/30")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {area && <AreaDot color={area.color} />}
            <span>{area?.name ?? "—"}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="mt-1 block text-left text-sm font-medium leading-snug hover:text-primary"
          >
            {task.title}
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DeadlinePill deadline={task.deadline} />
            <TaskLabels labelIds={task.labelIds} />
          </div>
        </div>
        <ProgressRing pct={prog.pct} size={44} stroke={4}>
          <span className="font-mono text-[10px] tabular-nums">
            {prog.done}/{prog.total}
          </span>
        </ProgressRing>
      </div>

      {unplanned ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-warning/40 bg-warning/5 p-2.5">
          <TriangleAlert className="size-4 text-warning" />
          <span className="text-xs font-medium text-foreground">
            Not broken down yet
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              className="h-8 w-14 px-2 text-xs"
            />
            <Button size="sm" onClick={() => onDistribute(task.id, count)}>
              <CalendarRange /> Distribute
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpen(task.id)}>
              Break down
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-0.5">
          {ms.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle(m.id)}
                aria-label={m.done ? "Mark not done" : "Mark done"}
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  m.done
                    ? "border-success bg-success text-success-foreground"
                    : "border-muted-foreground/40 hover:border-primary",
                )}
              >
                {m.done && <Check className="size-2.5" strokeWidth={3} />}
              </button>
              <span
                className={cn(
                  "flex-1 truncate text-sm",
                  m.done && "text-muted-foreground line-through",
                )}
              >
                {m.title}
              </span>
              <span className="shrink-0 rounded border border-border px-1.5 py-px font-mono text-[10px] tabular-nums text-muted-foreground">
                {formatWeekdayShort(m.date)} {m.date.slice(8)}
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="mt-1 w-fit text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Edit breakdown →
          </button>
        </div>
      )}
    </Card>
  );
}

export function WeeklyPlanner() {
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const areas = usePlanner((s) => s.areas);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const activeLabelIds = usePlanner((s) => s.activeLabelIds);
  const distributeMilestones = usePlanner((s) => s.distributeMilestones);
  const toggleMilestone = usePlanner((s) => s.toggleMilestone);
  const { openEdit } = useTaskDialog();

  const [offset, setOffset] = React.useState(0);

  const areaMap = React.useMemo(
    () => new Map(areas.map((a) => [a.id, a])),
    [areas],
  );

  const windowTasks = React.useMemo(() => {
    const today = todayISO();
    return tasks
      .filter((t) => {
        if (!taskPassesFilter(t, activeAreaId, activeLabelIds)) return false;
        const d = diffDays(t.deadline, today);
        return offset === 0 ? d <= 6 : d >= 7 && d <= 13;
      })
      .sort((a, b) => compareISO(a.deadline, b.deadline));
  }, [tasks, activeAreaId, activeLabelIds, offset]);

  const unplannedCount = windowTasks.filter(
    (t) => !milestones.some((m) => m.taskId === t.id),
  ).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 duration-300 animate-in fade-in-0">
      <div>
        <h1 className="font-pixel-square text-xl tracking-tight">
          Weekly planning
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your Sunday ritual: look at the week&apos;s deadlines, break each into
          daily milestones, assign them to days.
        </p>
      </div>

      <Card className="flex items-start gap-3 border-primary/20 bg-primary/[0.04] p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          {unplannedCount > 0 ? (
            <>
              <span className="font-medium text-foreground">
                {unplannedCount} task{unplannedCount > 1 ? "s" : ""}
              </span>{" "}
              in this window still need a daily breakdown. Use{" "}
              <span className="font-medium text-foreground">Distribute</span> to
              spread milestones evenly to the deadline.
            </>
          ) : (
            "Every task in this window is broken down. You're set — adjust days as needed."
          )}
        </p>
      </Card>

      <div className="flex items-center gap-1.5">
        <Button
          variant={offset === 0 ? "default" : "outline"}
          size="sm"
          onClick={() => setOffset(0)}
        >
          This week
        </Button>
        <Button
          variant={offset === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => setOffset(1)}
        >
          Next week
        </Button>
      </div>

      {windowTasks.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          No deadlines in this window.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {windowTasks.map((t) => (
            <TaskPlanRow
              key={t.id}
              task={t}
              area={areaMap.get(t.areaId)}
              allMilestones={milestones}
              onOpen={openEdit}
              onDistribute={(id, count) =>
                distributeMilestones(id, { count })
              }
              onToggle={toggleMilestone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
