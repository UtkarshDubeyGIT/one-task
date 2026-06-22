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
import { labelChipClass } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { AreaDot } from "./area-dot";
import { InstallButton } from "./install-button";
import { LockButton } from "./lock-button";
import { ManageDialog } from "./manage-dialog";
import { SyncStatus } from "./sync-status";
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
  const storeLabels = usePlanner((s) => s.labels);
  const activeLabelIds = usePlanner((s) => s.activeLabelIds);
  const setActiveArea = usePlanner((s) => s.setActiveArea);
  const toggleLabelFilter = usePlanner((s) => s.toggleLabelFilter);

  const [manageOpen, setManageOpen] = React.useState(false);

  // Live count of OPEN tasks per area. A task is "open" unless it has
  // milestones and they're all done. Recomputes whenever tasks/milestones change.
  const { openByArea, totalOpen } = React.useMemo(() => {
    const progress = new Map<string, { total: number; done: number }>();
    for (const m of milestones) {
      const e = progress.get(m.taskId) ?? { total: 0, done: 0 };
      e.total += 1;
      if (m.done) e.done += 1;
      progress.set(m.taskId, e);
    }
    const byArea = new Map<string, number>();
    let total = 0;
    for (const t of tasks) {
      const p = progress.get(t.id);
      const complete = !!p && p.total > 0 && p.done === p.total;
      if (complete) continue;
      byArea.set(t.areaId, (byArea.get(t.areaId) ?? 0) + 1);
      total += 1;
    }
    return { openByArea: byArea, totalOpen: total };
  }, [tasks, milestones]);

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <div className="flex items-center gap-2 px-2 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="one task logo"
          className="size-7 rounded-md"
        />
        <div className="font-pixel-square text-[13px] tracking-wide">
          one task
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
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 font-pixel-square text-[13px] tracking-wide transition-colors",
                active
                  ? "bg-accent text-foreground"
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
        <div className="mb-1.5 font-pixel-square text-[11px] uppercase tracking-wide text-muted-foreground/70">
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
            {totalOpen > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {totalOpen}
              </span>
            )}
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
              {(openByArea.get(a.id) ?? 0) > 0 && (
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {openByArea.get(a.id)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 px-2">
        <div className="mb-1.5 font-pixel-square text-[11px] uppercase tracking-wide text-muted-foreground/70">
          Labels
        </div>
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {storeLabels.length === 0 && (
            <span className="px-1 text-[11px] text-muted-foreground/70">
              none yet
            </span>
          )}
          {storeLabels.map((l) => {
            const active = activeLabelIds.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleLabelFilter(l.id)}
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[10px] lowercase transition-all",
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
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pt-3">
        <div className="px-1">
          <InstallButton />
        </div>
        <div className="px-2">
          <SyncStatus />
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <Settings2 className="size-4" />
            Areas &amp; labels
          </button>
          <div className="flex items-center gap-1">
            <LockButton />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <ManageDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}
