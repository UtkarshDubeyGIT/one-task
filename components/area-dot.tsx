import type { AreaColor } from "@/lib/types";
import { areaDot } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function AreaDot({
  color,
  className,
}: {
  color: AreaColor;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", areaDot[color], className)}
    />
  );
}
