"use client";

import * as React from "react";
import { Eraser, Plus, RotateCcw, Trash2 } from "lucide-react";

import { usePlanner } from "@/lib/store";
import { AREA_COLORS, type AreaColor } from "@/lib/types";
import { areaDot } from "@/lib/colors";
import { cn } from "@/lib/utils";
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

function ColorPicker({
  value,
  onChange,
}: {
  value: AreaColor;
  onChange: (c: AreaColor) => void;
}) {
  return (
    <div className="flex gap-1">
      {AREA_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          className={cn(
            "size-4 rounded-full ring-offset-2 ring-offset-card transition",
            areaDot[c],
            value === c && "ring-2 ring-foreground",
          )}
        />
      ))}
    </div>
  );
}

export function ManageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const areas = usePlanner((s) => s.areas);
  const tasks = usePlanner((s) => s.tasks);
  const addArea = usePlanner((s) => s.addArea);
  const updateArea = usePlanner((s) => s.updateArea);
  const removeArea = usePlanner((s) => s.removeArea);
  const labels = usePlanner((s) => s.labels);
  const addLabel = usePlanner((s) => s.addLabel);
  const updateLabel = usePlanner((s) => s.updateLabel);
  const removeLabel = usePlanner((s) => s.removeLabel);
  const reseed = usePlanner((s) => s.reseed);
  const clearTasks = usePlanner((s) => s.clearTasks);

  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState<AreaColor>("indigo");
  const [newLabelName, setNewLabelName] = React.useState("");
  const [newLabelColor, setNewLabelColor] = React.useState<AreaColor>("violet");
  const [confirmClear, setConfirmClear] = React.useState(false);

  const add = () => {
    if (!newName.trim()) return;
    addArea(newName, newColor);
    setNewName("");
  };

  const addLbl = () => {
    if (!newLabelName.trim()) return;
    addLabel(newLabelName, newLabelColor);
    setNewLabelName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto scrollbar-thin">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Areas, labels &amp; data</DialogTitle>
          <DialogDescription>
            Manage your areas and labels, or reset the sample data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {areas.map((a) => {
              const count = tasks.filter((t) => t.areaId === a.id).length;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg border p-2"
                >
                  <ColorPicker
                    value={a.color}
                    onChange={(c) => updateArea(a.id, { color: c })}
                  />
                  <Input
                    value={a.name}
                    onChange={(e) => updateArea(a.id, { name: e.target.value })}
                    className="h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeArea(a.id)}
                    title={count ? `Deletes ${count} task(s)` : "Delete area"}
                    aria-label="Delete area"
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t pt-3">
            <ColorPicker value={newColor} onChange={setNewColor} />
            <Input
              value={newName}
              placeholder="New area…"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              className="h-8 flex-1"
            />
            <Button size="sm" onClick={add}>
              <Plus /> Add
            </Button>
          </div>

          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Labels
            </p>
            <div className="flex flex-col gap-2">
              {labels.map((l) => {
                const count = tasks.filter((t) =>
                  t.labelIds.includes(l.id),
                ).length;
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <ColorPicker
                      value={l.color}
                      onChange={(c) => updateLabel(l.id, { color: c })}
                    />
                    <Input
                      value={l.name}
                      onChange={(e) =>
                        updateLabel(l.id, { name: e.target.value })
                      }
                      className="h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLabel(l.id)}
                      title={count ? `Used on ${count} task(s)` : "Delete label"}
                      aria-label="Delete label"
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ColorPicker value={newLabelColor} onChange={setNewLabelColor} />
              <Input
                value={newLabelName}
                placeholder="New label…"
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addLbl();
                }}
                className="h-8 flex-1"
              />
              <Button size="sm" onClick={addLbl}>
                <Plus /> Add
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Sample data
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => reseed()}>
                <RotateCcw /> Reset samples
              </Button>
              {confirmClear ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    clearTasks();
                    setConfirmClear(false);
                  }}
                >
                  <Eraser /> Confirm — clear all
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmClear(true)}
                >
                  <Eraser /> Clear all tasks
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
