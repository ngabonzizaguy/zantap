import type { KitchenStage } from "@/lib/types";

/**
 * Functional color treatment per kitchen stage for the dark KDS (ADR-0017).
 * Colors carry meaning, not decoration. These use explicit Tailwind color
 * utilities (not editorial tokens) so they render as-is on the dark surface and
 * are NOT remapped by the `.kds-dark` scope.
 */
export interface KitchenStageStyle {
  /** Pill badge background + text. */
  badge: string;
  /** Small status dot background. */
  dot: string;
  /** Icon tile container background + border. */
  tile: string;
  /** Icon glyph color. */
  icon: string;
}

const STAGE_STYLES: Record<KitchenStage, KitchenStageStyle> = {
  NEW: {
    badge: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
    tile: "border-violet-400/25 bg-violet-500/12",
    icon: "text-violet-300",
  },
  ACCEPTED: {
    badge: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
    tile: "border-violet-400/25 bg-violet-500/12",
    icon: "text-violet-300",
  },
  PREPARING: {
    badge: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
    tile: "border-amber-400/25 bg-amber-500/12",
    icon: "text-amber-300",
  },
  READY: {
    badge: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
    tile: "border-sky-400/25 bg-sky-500/12",
    icon: "text-sky-300",
  },
  OUT_FOR_DELIVERY: {
    badge: "bg-blue-500/15 text-blue-300",
    dot: "bg-blue-400",
    tile: "border-blue-400/25 bg-blue-500/12",
    icon: "text-blue-300",
  },
  COMPLETED: {
    badge: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
    tile: "border-emerald-400/25 bg-emerald-500/12",
    icon: "text-emerald-300",
  },
};

export function kitchenStageStyle(stage: KitchenStage): KitchenStageStyle {
  return STAGE_STYLES[stage];
}

/** Queue filter groups shown as chips above the orders list (ADR-0017). */
export type KdsStageFilter = "all" | "new" | "preparing" | "ready" | "completed";

export const KDS_STAGE_FILTERS: { id: KdsStageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
];

/** Per-filter chip color so the queue chips read as functional status (ADR-0017). */
export interface FilterChipStyle {
  /** Text color (always shown, active or idle). */
  text: string;
  /** Idle subtle background tint in the chip's own color. */
  bg: string;
  /** Active (stronger) background tint. */
  activeBg: string;
}

const FILTER_CHIP_STYLES: Record<KdsStageFilter, FilterChipStyle> = {
  all: {
    text: "text-momo",
    bg: "bg-momo/15",
    activeBg: "bg-momo/30",
  },
  new: {
    text: "text-violet-300",
    bg: "bg-violet-500/15",
    activeBg: "bg-violet-500/30",
  },
  preparing: {
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    activeBg: "bg-amber-500/30",
  },
  ready: {
    text: "text-sky-300",
    bg: "bg-sky-500/15",
    activeBg: "bg-sky-500/30",
  },
  completed: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/15",
    activeBg: "bg-emerald-500/30",
  },
};

export function filterChipStyle(filter: KdsStageFilter): FilterChipStyle {
  return FILTER_CHIP_STYLES[filter];
}

/** Maps a kitchen stage to its chip filter group so every order is reachable. */
export function stageFilterGroup(stage: KitchenStage): KdsStageFilter {
  switch (stage) {
    case "NEW":
    case "ACCEPTED":
      return "new";
    case "PREPARING":
      return "preparing";
    case "READY":
      return "ready";
    case "OUT_FOR_DELIVERY":
    case "COMPLETED":
      return "completed";
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
}
