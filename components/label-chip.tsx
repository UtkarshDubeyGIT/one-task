import type { LabelKind } from "@/lib/types";
import { labelMeta } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function LabelChip({
  label,
  className,
}: {
  label: LabelKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-px font-mono text-[10px] font-medium lowercase tracking-wide",
        labelMeta[label].className,
        className,
      )}
    >
      {label}
    </span>
  );
}
