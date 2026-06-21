"use client";

import * as React from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  ListChecks,
  Plus,
  Sparkles,
} from "lucide-react";

import { usePlanner } from "@/lib/store";
import {
  computeWhatsNext,
  filterViews,
  joinMilestones,
  taskProgress,
  type MilestoneView,
} from "@/lib/selectors";
import { diffDays, formatFull, formatWeekdayLong, relativeDeadline, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useTaskDialog } from "./app-providers";
import { MilestoneRow } from "./milestone-row";
import { AreaDot } from "./area-dot";
import { TaskLabels } from "./task-labels";
import { ProgressRing } from "./progress-ring";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/unlumen/count-up";
import { GlowingBadge } from "@/components/unlumen/glowing-badge";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
          accent,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold leading-none tabular-nums">
          <CountUp to={value} duration={1.1} />
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const d = diffDays(deadline, todayISO());
  const variant = d < 0 ? "error" : d <= 1 ? "warning" : "info";
  return <GlowingBadge variant={variant}>{relativeDeadline(deadline)}</GlowingBadge>;
}

function FeaturedNext({
  view,
  pct,
  done,
  total,
  onToggle,
  onOpen,
  clear,
}: {
  view: MilestoneView;
  pct: number;
  done: number;
  total: number;
  onToggle: (id: string) => void;
  onOpen: (taskId: string) => void;
  clear: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/[0.07] via-card to-card">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {clear ? "Today's clear — up next" : "Up next"}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onOpen(view.taskId)}
              className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {view.area && <AreaDot color={view.area.color} />}
              <span className="truncate">{view.task.title}</span>
              <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            <h2 className="mt-1.5 text-balance text-xl font-semibold leading-snug">
              {view.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DeadlineBadge deadline={view.task.deadline} />
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3" />
                {formatWeekdayLong(view.date)}
              </span>
              <TaskLabels labelIds={view.task.labelIds} />
            </div>
          </div>

          {total > 0 && (
            <ProgressRing pct={pct} size={52} stroke={4}>
              <span className="font-mono text-[11px] font-medium tabular-nums">
                {done}/{total}
              </span>
            </ProgressRing>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={() => onToggle(view.id)}>
            <CheckCircle2 /> Mark done
          </Button>
          <Button variant="outline" onClick={() => onOpen(view.taskId)}>
            Open task
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function WhatsNext() {
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const areas = usePlanner((s) => s.areas);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const activeLabelIds = usePlanner((s) => s.activeLabelIds);
  const toggleMilestone = usePlanner((s) => s.toggleMilestone);
  const { openCreate, openEdit } = useTaskDialog();

  const views = React.useMemo(
    () =>
      filterViews(
        joinMilestones(milestones, tasks, areas),
        activeAreaId,
        activeLabelIds,
      ),
    [milestones, tasks, areas, activeAreaId, activeLabelIds],
  );
  const wn = React.useMemo(() => computeWhatsNext(views), [views]);

  const today = todayISO();
  const weekLeft = views.filter((v) => {
    if (v.done) return false;
    const d = diffDays(v.date, today);
    return d >= 0 && d <= 6;
  }).length;

  const featured = wn.upNext;
  const featuredProg = featured
    ? taskProgress(featured.taskId, milestones)
    : null;

  const comingUp = wn.upcoming.filter((v) => v.id !== featured?.id).slice(0, 6);
  const nothing =
    wn.overdue.length === 0 &&
    wn.today.length === 0 &&
    wn.doneToday.length === 0 &&
    wn.upcoming.length === 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 duration-300 animate-in fade-in-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatFull(today)}</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus /> New task
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="due today"
          value={wn.today.length}
          accent="bg-primary/15 text-primary"
          icon={<ListChecks />}
        />
        <StatCard
          label="overdue"
          value={wn.overdue.length}
          accent="bg-destructive/15 text-destructive"
          icon={<Flame />}
        />
        <StatCard
          label="this week"
          value={weekLeft}
          accent="bg-warning/15 text-warning"
          icon={<CalendarClock />}
        />
      </div>

      {nothing && (
        <EmptyState
          icon={<Sparkles />}
          title="Nothing planned yet"
          description="Create a task with a deadline, then break it into daily milestones to see what to work on next."
          action={
            <Button onClick={() => openCreate()}>
              <Plus /> New task
            </Button>
          }
        />
      )}

      {wn.overdue.length > 0 && (
        <Card className="border-destructive/30">
          <div className="flex items-center gap-2 border-b border-destructive/20 px-4 py-3">
            <Flame className="size-4 text-destructive" />
            <span className="text-sm font-medium">Overdue</span>
            <GlowingBadge variant="error">{wn.overdue.length}</GlowingBadge>
          </div>
          <div className="p-1.5">
            {wn.overdue.map((v) => (
              <MilestoneRow
                key={v.id}
                view={v}
                onToggle={toggleMilestone}
                onOpen={openEdit}
              />
            ))}
          </div>
        </Card>
      )}

      {wn.today.length > 0 && (
        <Card>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-primary" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {wn.doneToday.length}/{wn.doneToday.length + wn.today.length} done
            </span>
          </div>
          <div className="p-1.5">
            {wn.today.map((v) => (
              <MilestoneRow
                key={v.id}
                view={v}
                onToggle={toggleMilestone}
                onOpen={openEdit}
              />
            ))}
            {wn.doneToday.map((v) => (
              <MilestoneRow
                key={v.id}
                view={v}
                onToggle={toggleMilestone}
                onOpen={openEdit}
              />
            ))}
          </div>
        </Card>
      )}

      {featured && featuredProg && (
        <FeaturedNext
          view={featured}
          pct={featuredProg.pct}
          done={featuredProg.done}
          total={featuredProg.total}
          onToggle={toggleMilestone}
          onOpen={openEdit}
          clear={wn.allClearToday}
        />
      )}

      {!featured && wn.today.length === 0 && !nothing && (
        <Card className="border-success/30 bg-success/5">
          <div className="flex items-center gap-3 p-5">
            <CheckCircle2 className="size-5 text-success" />
            <div>
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-sm text-muted-foreground">
                No pending milestones ahead. Add a task or enjoy the breathing
                room.
              </p>
            </div>
          </div>
        </Card>
      )}

      {comingUp.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 px-1">
            <CalendarClock className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Coming up
            </h3>
          </div>
          <Card className="p-1.5">
            {comingUp.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <MilestoneRow
                    view={v}
                    onToggle={toggleMilestone}
                    onOpen={openEdit}
                  />
                </div>
                <span className="shrink-0 pr-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {relativeDeadline(v.date).replace("due ", "")}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
