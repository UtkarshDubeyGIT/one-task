"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  KanbanSquare,
  Settings2,
  Sparkles,
} from "lucide-react";

import { usePlanner } from "@/lib/store";
import { LABELS } from "@/lib/types";
import { labelMeta } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { AreaDot } from "./area-dot";
import { ManageDialog } from "./manage-dialog";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "What's next", icon: Sparkles },
  { href: "/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/planning", label: "Planning", icon: CalendarRange },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const areas = usePlanner((s) => s.areas);
  const tasks = usePlanner((s) => s.tasks);
  const milestones = usePlanner((s) => s.milestones);
  const activeAreaId = usePlanner((s) => s.activeAreaId);
  const activeLabels = usePlanner((s) => s.activeLabels);
  const setActiveArea = usePlanner((s) => s.setActiveArea);
  const toggleLabelFilter = usePlanner((s) => s.toggleLabelFilter);

  const [manageOpen, setManageOpen] = React.useState(false);

  const pendingByArea = React.useMemo(() => {
    const taskArea = new Map(tasks.map((t) => [t.id, t.areaId]));
    const counts = new Map<string, number>();
    for (const m of milestones) {
      if (m.done) continue;
      const aid = taskArea.get(m.taskId);
      if (!aid) continue;
      counts.set(aid, (counts.get(aid) ?? 0) + 1);
    }
    return counts;
  }, [tasks, milestones]);
  const totalPending = milestones.filter((m) => !m.done).length;

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div className="text-sm font-semibold tracking-tight">
          Deadline<span className="text-primary">.</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 px-2">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          Areas
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveArea("all");
              onNavigate?.();
            }}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
              activeAreaId === "all"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <span>All areas</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {totalPending}
            </span>
          </button>
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setActiveArea(a.id);
                onNavigate?.();
              }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                activeAreaId === a.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <AreaDot color={a.color} />
                <span className="truncate">{a.name}</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {pendingByArea.get(a.id) ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 px-2">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
          Labels
        </div>
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {LABELS.map((l) => {
            const active = activeLabels.includes(l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => toggleLabelFilter(l)}
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[10px] lowercase transition-all",
                  active
                    ? labelMeta[l].className
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-3">
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <Settings2 className="size-4" />
          Areas &amp; data
        </button>
        <ThemeToggle />
      </div>

      <ManageDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}
