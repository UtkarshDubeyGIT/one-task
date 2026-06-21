"use client";

import * as React from "react";
import {
  CalendarClock,
  CalendarRange,
  Check,
  ListChecks,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import type { ID } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { addDaysISO, compareISO, formatMonthDay, todayISO } from "@/lib/date";
import { distributeDates } from "@/lib/planning";
import { labelChipClass } from "@/lib/colors";
import { cn, uid } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaDot } from "./area-dot";

interface Draft {
  key: string;
  id?: string;
  title: string;
  date: string;
  done: boolean;
}

type Panel = null | "area" | "deadline" | "labels" | "milestones";

function spreadDrafts(count: number, deadline: string): Draft[] {
  return distributeDates(todayISO(), deadline, count).map((date) => ({
    key: uid("d"),
    title: "",
    date,
    done: false,
  }));
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  taskId,
  defaultDeadline,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string | null;
  defaultDeadline?: string;
}) {
  const areas = usePlanner((s) => s.areas);
  const storeLabels = usePlanner((s) => s.labels);
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const addTask = usePlanner((s) => s.addTask);
  const updateTask = usePlanner((s) => s.updateTask);
  const removeTask = usePlanner((s) => s.removeTask);
  const addMilestone = usePlanner((s) => s.addMilestone);
  const updateMilestone = usePlanner((s) => s.updateMilestone);
  const removeMilestone = usePlanner((s) => s.removeMilestone);

  const isEdit = Boolean(taskId);
  const task = React.useMemo(
    () => (taskId ? tasks.find((t) => t.id === taskId) : undefined),
    [tasks, taskId],
  );
  const existingMilestones = React.useMemo(
    () =>
      taskId
        ? milestones
            .filter((m) => m.taskId === taskId)
            .sort((a, b) => compareISO(a.date, b.date) || a.order - b.order)
        : [],
    [milestones, taskId],
  );

  const [title, setTitle] = React.useState("");
  const [areaId, setAreaId] = React.useState("");
  const [deadline, setDeadline] = React.useState(addDaysISO(todayISO(), 7));
  const [labelIds, setLabelIds] = React.useState<ID[]>([]);
  const [notes, setNotes] = React.useState("");
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [splitCount, setSplitCount] = React.useState(3);
  const [panel, setPanel] = React.useState<Panel>(null);
  const [createMore, setCreateMore] = React.useState(false);
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setAreaId(task.areaId);
      setDeadline(task.deadline);
      setLabelIds(task.labelIds);
      setNotes(task.notes ?? "");
      setDrafts(
        existingMilestones.map((m) => ({
          key: m.id,
          id: m.id,
          title: m.title,
          date: m.date,
          done: m.done,
        })),
      );
    } else {
      setTitle("");
      setAreaId(activeAreaId !== "all" ? activeAreaId : areas[0]?.id ?? "");
      setDeadline(defaultDeadline ?? addDaysISO(todayISO(), 7));
      setLabelIds([]);
      setNotes("");
      setDrafts([]);
    }
    setPanel(null);
    setSplitCount(3);
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const area = areas.find((a) => a.id === areaId);
  const canSave = title.trim().length > 0 && Boolean(areaId) && Boolean(deadline);

  const toggleLabel = (id: ID) =>
    setLabelIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  const setDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts((cur) => cur.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const addDraft = () =>
    setDrafts((cur) => [
      ...cur,
      { key: uid("d"), title: "", date: deadline, done: false },
    ]);
  const distribute = () =>
    setDrafts((cur) => [
      ...cur.filter((d) => d.title.trim()),
      ...spreadDrafts(splitCount, deadline),
    ]);

  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  const resetForMore = () => {
    setTitle("");
    setNotes("");
    setDrafts([]);
    setPanel(null);
    setTimeout(() => titleRef.current?.focus(), 20);
  };

  const handleSave = () => {
    if (!canSave) return;
    const cleanDrafts = drafts.filter((d) => d.title.trim() || d.id);

    if (isEdit && task) {
      updateTask(task.id, {
        title: title.trim(),
        areaId,
        deadline,
        labelIds,
        notes: notes.trim() || undefined,
      });
      const keptIds = new Set(cleanDrafts.filter((d) => d.id).map((d) => d.id));
      for (const m of existingMilestones) {
        if (!keptIds.has(m.id)) removeMilestone(m.id);
      }
      cleanDrafts.forEach((d, i) => {
        if (d.id) {
          updateMilestone(d.id, {
            title: d.title.trim() || "Untitled",
            date: d.date,
            order: i,
            done: d.done,
          });
        } else if (d.title.trim()) {
          const created = addMilestone({
            taskId: task.id,
            title: d.title.trim(),
            date: d.date,
          });
          updateMilestone(created.id, { order: i, done: d.done });
        }
      });
      onOpenChange(false);
    } else {
      const created = addTask({
        title: title.trim(),
        areaId,
        deadline,
        labelIds,
        notes: notes.trim() || undefined,
      });
      cleanDrafts
        .filter((d) => d.title.trim())
        .forEach((d) =>
          addMilestone({ taskId: created.id, title: d.title.trim(), date: d.date }),
        );
      if (createMore) resetForMore();
      else onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (task) removeTask(task.id);
    onOpenChange(false);
  };

  const onComposeKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const quickDates = [
    { label: "Today", date: todayISO() },
    { label: "Tomorrow", date: addDaysISO(todayISO(), 1) },
    { label: "In 3 days", date: addDaysISO(todayISO(), 3) },
    { label: "Next week", date: addDaysISO(todayISO(), 7) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto p-0 scrollbar-thin">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
              one task
            </span>
            <span aria-hidden>›</span>
            <span>{isEdit ? "Edit task" : "New task"}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Task title"
            className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/50"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={onComposeKey}
            placeholder="Add description…"
            rows={2}
            className="mt-1 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-1 pt-1">
          <Pill active={panel === "area"} onClick={() => togglePanel("area")}>
            {area ? (
              <AreaDot color={area.color} />
            ) : (
              <span className="size-2 rounded-full bg-muted-foreground/40" />
            )}
            {area?.name ?? "Area"}
          </Pill>
          <Pill
            active={panel === "deadline"}
            onClick={() => togglePanel("deadline")}
          >
            <CalendarClock className="size-3.5" /> {formatMonthDay(deadline)}
          </Pill>
          <Pill active={panel === "labels"} onClick={() => togglePanel("labels")}>
            <Tag className="size-3.5" />
            {labelIds.length
              ? `${labelIds.length} label${labelIds.length > 1 ? "s" : ""}`
              : "Labels"}
          </Pill>
          <Pill
            active={panel === "milestones"}
            onClick={() => togglePanel("milestones")}
          >
            <ListChecks className="size-3.5" />
            {drafts.length
              ? `${drafts.length} milestone${drafts.length > 1 ? "s" : ""}`
              : "Milestones"}
          </Pill>
        </div>

        {panel && (
          <div className="mx-4 mb-1 mt-1 rounded-lg border bg-background/50 p-2.5 duration-150 animate-in fade-in-0">
            {panel === "area" && (
              <div className="flex flex-col gap-0.5">
                {areas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAreaId(a.id);
                      setPanel(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                      a.id === areaId && "bg-accent",
                    )}
                  >
                    <AreaDot color={a.color} /> {a.name}
                    {a.id === areaId && (
                      <Check className="ml-auto size-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {panel === "deadline" && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {quickDates.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        setDeadline(q.date);
                        setPanel(null);
                      }}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent",
                        deadline === q.date && "border-primary text-primary",
                      )}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value || deadline)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {panel === "labels" && (
              <div className="flex flex-wrap gap-1.5">
                {storeLabels.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No labels — add some in Areas &amp; labels.
                  </span>
                )}
                {storeLabels.map((l) => {
                  const active = labelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id)}
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-xs lowercase transition-all",
                        active
                          ? labelChipClass(l.color)
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            )}

            {panel === "milestones" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Break into daily milestones
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={splitCount}
                      onChange={(e) =>
                        setSplitCount(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="h-7 w-14 px-2 text-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={distribute}
                    >
                      <CalendarRange /> Distribute
                    </Button>
                  </div>
                </div>
                {drafts.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft(d.key, { done: !d.done })}
                      aria-label={d.done ? "Mark not done" : "Mark done"}
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        d.done
                          ? "border-success bg-success text-success-foreground"
                          : "border-muted-foreground/40 hover:border-primary",
                      )}
                    >
                      {d.done && <Check className="size-3" strokeWidth={3} />}
                    </button>
                    <Input
                      value={d.title}
                      placeholder="Milestone…"
                      onChange={(e) => setDraft(d.key, { title: e.target.value })}
                      className="h-8 flex-1 text-sm"
                    />
                    <Input
                      type="date"
                      value={d.date}
                      onChange={(e) =>
                        setDraft(d.key, { date: e.target.value || d.date })
                      }
                      className="h-8 w-[8.5rem] text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDrafts((cur) => cur.filter((x) => x.key !== d.key))
                      }
                      aria-label="Remove milestone"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDraft}
                  className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Plus className="size-3.5" /> Add milestone
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-2 border-t px-4 py-3">
          {isEdit ? (
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 /> Delete
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setCreateMore((v) => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              title="Keep this open to add more tasks"
            >
              <span
                className={cn(
                  "relative h-4 w-7 rounded-full transition-colors",
                  createMore ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-3 rounded-full bg-white transition-all",
                    createMore ? "left-3.5" : "left-0.5",
                  )}
                />
              </span>
              Create more
            </button>
          )}
          <div className="flex items-center gap-2">
            {!isEdit && (
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                Enter to create
              </span>
            )}
            <Button onClick={handleSave} disabled={!canSave}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
