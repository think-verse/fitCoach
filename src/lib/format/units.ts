/**
 * Unit formatting — respects the user's `settings.units` ("metric" | "imperial").
 * Pure functions, no I/O. Storage is always metric (kg / cm); we convert only
 * for display.
 */
export type Units = "metric" | "imperial";

const LB_PER_KG = 2.2046226218;

export function weightUnitLabel(units: Units): string {
  return units === "imperial" ? "lb" : "kg";
}

/** Convert a stored kg value into the display unit (number only). */
export function toDisplayWeight(kg: number, units: Units): number {
  return units === "imperial" ? kg * LB_PER_KG : kg;
}

/** "72.5 kg" / "159.8 lb" / "—" when missing. */
export function formatWeight(
  kg: number | null | undefined,
  units: Units = "metric",
  decimals = 1,
): string {
  if (kg == null || !Number.isFinite(kg)) return "—";
  const v = toDisplayWeight(Number(kg), units);
  return `${v.toFixed(decimals)} ${weightUnitLabel(units)}`;
}

/** "178 cm" / "5'10\"" / "—" when missing. */
export function formatHeight(
  cm: number | null | undefined,
  units: Units = "metric",
): string {
  if (cm == null || !Number.isFinite(cm)) return "—";
  if (units === "imperial") {
    const totalInches = Number(cm) / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches - ft * 12);
    return `${ft}'${inch}"`;
  }
  return `${Math.round(Number(cm))} cm`;
}
