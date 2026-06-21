"use client";

import * as React from "react";

import type { Label } from "@/lib/types";
import { usePlanner } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LabelChip } from "./label-chip";

/** Resolves a task's labelIds to chips using the current label set. */
export function TaskLabels({
  labelIds,
  className,
}: {
  labelIds: string[];
  className?: string;
}) {
  const labels = usePlanner((s) => s.labels);
  const items = React.useMemo(() => {
    const map = new Map(labels.map((l) => [l.id, l]));
    return labelIds.map((id) => map.get(id)).filter(Boolean) as Label[];
  }, [labels, labelIds]);

  if (items.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {items.map((l) => (
        <LabelChip key={l.id} label={l} />
      ))}
    </div>
  );
}
