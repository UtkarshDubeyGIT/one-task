"use client";

import type { SyncStatus } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { cn } from "@/lib/utils";

const META: Record<SyncStatus, { label: string; dot: string; title: string }> = {
  idle: { label: "—", dot: "bg-muted-foreground/40", title: "Idle" },
  syncing: {
    label: "Syncing…",
    dot: "bg-warning animate-pulse",
    title: "Saving to the cloud",
  },
  synced: { label: "Synced", dot: "bg-success", title: "Saved to the cloud" },
  local: {
    label: "Local only",
    dot: "bg-muted-foreground/50",
    title: "No cloud database configured — saved in this browser only",
  },
};

export function SyncStatus() {
  const status = usePlanner((s) => s.syncStatus);
  const m = META[status];
  return (
    <span
      className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
      title={m.title}
    >
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
