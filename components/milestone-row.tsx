"use client";

import { Check } from "lucide-react";

import type { MilestoneView } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { AreaDot } from "./area-dot";

export function MilestoneRow({
  view,
  onToggle,
  onOpen,
  showContext = true,
  className,
}: {
  view: MilestoneView;
  onToggle: (id: string) => void;
  onOpen?: (taskId: string) => void;
  showContext?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(view.id)}
        aria-label={view.done ? "Mark not done" : "Mark done"}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          view.done
            ? "border-success bg-success text-success-foreground"
            : "border-muted-foreground/40 hover:border-primary",
        )}
      >
        {view.done && <Check className="size-3" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen?.(view.taskId)}
          className={cn(
            "block w-full truncate text-left text-sm transition-colors",
            view.done
              ? "text-muted-foreground line-through"
              : "text-foreground hover:text-primary",
          )}
        >
          {view.title}
        </button>
        {showContext && (
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {view.area && <AreaDot color={view.area.color} />}
            <span className="truncate">{view.task.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
