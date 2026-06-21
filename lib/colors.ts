import type { AreaColor, LabelKind } from "./types";

/**
 * Literal class maps (Tailwind needs the full class strings at build time —
 * never build these by concatenation).
 */
export const areaDot: Record<AreaColor, string> = {
  indigo: "bg-indigo-400",
  violet: "bg-violet-400",
  sky: "bg-sky-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  cyan: "bg-cyan-400",
  slate: "bg-slate-400",
};

export const areaText: Record<AreaColor, string> = {
  indigo: "text-indigo-300",
  violet: "text-violet-300",
  sky: "text-sky-300",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  cyan: "text-cyan-300",
  slate: "text-slate-300",
};

export const areaSoftBg: Record<AreaColor, string> = {
  indigo: "bg-indigo-500/10",
  violet: "bg-violet-500/10",
  sky: "bg-sky-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  rose: "bg-rose-500/10",
  cyan: "bg-cyan-500/10",
  slate: "bg-slate-500/10",
};

export const areaBorder: Record<AreaColor, string> = {
  indigo: "border-indigo-500/30",
  violet: "border-violet-500/30",
  sky: "border-sky-500/30",
  emerald: "border-emerald-500/30",
  amber: "border-amber-500/30",
  rose: "border-rose-500/30",
  cyan: "border-cyan-500/30",
  slate: "border-slate-500/30",
};

export const areaBarBg: Record<AreaColor, string> = {
  indigo: "bg-indigo-400",
  violet: "bg-violet-400",
  sky: "bg-sky-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  cyan: "bg-cyan-400",
  slate: "bg-slate-400",
};

export const labelMeta: Record<LabelKind, { className: string }> = {
  feat: { className: "bg-violet-500/15 text-violet-300 border-violet-500/25" },
  chore: { className: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  explore: { className: "bg-sky-500/15 text-sky-300 border-sky-500/25" },
};
