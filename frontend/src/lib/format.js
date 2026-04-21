// Formatting helpers shared across the UI.
export function fmtMoney(n, decimals = 0) {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + "$" + abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const fmtPct = (n, d = 2) =>
  !isFinite(n) ? "—" : (n * 100).toFixed(d) + "%";

export const fmtInt = (n) =>
  !isFinite(n) ? "—" : Math.round(n).toLocaleString("en-US");

// Structural compare of a plan vs its preset (used to surface the "modified" badge).
export function isPlanModified(plan, presetPlan) {
  if (!presetPlan) return false;
  const keys = ["capital","target","ddType","ddValue","floorLock","dailyLoss",
    "dailyLossIsFatal","consistency","consistencyType","minDays","maxDays",
    "phases","fee","activationFee","feeType","profitSplit"];
  for (const k of keys) if ((plan[k] ?? null) !== (presetPlan[k] ?? null)) return true;
  if (plan.phases === 2) {
    const a = plan.phase2 || {}, b = presetPlan.phase2 || {};
    if ((a.target ?? null) !== (b.target ?? null)) return true;
    if ((a.minDays ?? null) !== (b.minDays ?? null)) return true;
    if ((a.maxDays ?? null) !== (b.maxDays ?? null)) return true;
  }
  return false;
}
