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
  const reseed = usePlanner((s) => s.reseed);
  const clearTasks = usePlanner((s) => s.clearTasks);

  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState<AreaColor>("indigo");
  const [confirmClear, setConfirmClear] = React.useState(false);

  const add = () => {
    if (!newName.trim()) return;
    addArea(newName, newColor);
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto scrollbar-thin">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Areas &amp; data</DialogTitle>
          <DialogDescription>
            Rename areas, recolor them, or manage your sample data.
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
