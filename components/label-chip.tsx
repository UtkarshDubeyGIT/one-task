import type { Label } from "@/lib/types";
import { labelChipClass } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function LabelChip({
  label,
  className,
}: {
  label: Label;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-px font-mono text-[10px] font-medium lowercase tracking-wide",
        labelChipClass(label.color),
        className,
      )}
    >
      {label.name}
    </span>
  );
}
