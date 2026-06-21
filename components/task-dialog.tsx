"use client";

import * as React from "react";
import { CalendarRange, Check, Plus, Trash2 } from "lucide-react";

import type { ID } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { addDaysISO, compareISO, todayISO } from "@/lib/date";
import { distributeDates } from "@/lib/planning";
import { labelChipClass } from "@/lib/colors";
import { cn, uid } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface Draft {
  key: string;
  id?: string;
  title: string;
  date: string;
  done: boolean;
}

function spreadDrafts(count: number, deadline: string): Draft[] {
  return distributeDates(todayISO(), deadline, count).map((date) => ({
    key: uid("d"),
    title: "",
    date,
    done: false,
  }));
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

  // (Re)initialize whenever the dialog opens or the target task changes.
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
    setSplitCount(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

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

  const distribute = () => {
    const generated = spreadDrafts(splitCount, deadline);
    // Keep any existing rows the user already filled in, then append the spread.
    setDrafts((cur) => [...cur.filter((d) => d.title.trim()), ...generated]);
  };

  const canSave = title.trim().length > 0 && areaId && deadline;

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
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (task) removeTask(task.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto scrollbar-thin">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Set a deadline, then break it into milestones assigned to specific
            days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Task
            </label>
            <Input
              autoFocus
              value={title}
              placeholder="e.g. Integrate Sarvam AI + Twilio + LiveKit"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Area
              </label>
              <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Deadline
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value || deadline)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {storeLabels.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No labels yet — create some in Areas &amp; labels.
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
                      "rounded-md border px-2.5 py-1 font-mono text-xs lowercase transition-all",
                      active
                        ? labelChipClass(l.color)
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <Textarea
              value={notes}
              placeholder="Optional context…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Milestone breakdown */}
          <div className="rounded-lg border bg-background/40 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Daily milestones
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
                  title="Spread evenly from today to the deadline"
                >
                  <CalendarRange /> Distribute
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {drafts.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  No milestones yet. Add one, or auto-distribute across the days
                  up to your deadline.
                </p>
              )}
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
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="size-3.5" /> Add milestone
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {isEdit ? (
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
