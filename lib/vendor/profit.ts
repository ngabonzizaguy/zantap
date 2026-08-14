import type { ProfitSnapshot } from "@/lib/vendor/feature-and-profit-types";

/**
 * Compare today's gross to the vendor's recent same-weekday average.
 * Returns a score in [-1, 1] for glow coloring (green above, yellow→red below).
 */
export function computeGlowScore(
  todayGross: number,
  weekdayAverage: number
): number {
  if (weekdayAverage <= 0) {
    return todayGross > 0 ? 1 : 0;
  }
  const delta = (todayGross - weekdayAverage) / weekdayAverage;
  return Math.max(-1, Math.min(1, delta));
}

export function emptyProfitSnapshot(
  todayGrossRwf: number,
  weekdayAverageRwf: number
): ProfitSnapshot {
  return {
    todayGrossRwf,
    weekdayAverageRwf,
    glowScore: computeGlowScore(todayGrossRwf, weekdayAverageRwf),
    periodRevenueRwf: 0,
    periodExpensesRwf: 0,
    periodCostOfGoodsRwf: 0,
    periodProfitRwf: 0,
    itemMargins: [],
  };
}
