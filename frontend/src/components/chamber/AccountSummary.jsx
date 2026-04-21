import { C } from "../../lib/colors";
import { fmtMoney } from "../../lib/format";
import { useT } from "../LangContext";

export default function AccountSummary({ plan, firm, isModified }) {
  const { t } = useT();
  const lines = [];
  const pct = ((plan.target / plan.capital) * 100).toFixed(1);
  lines.push(t("summary_objective", { tgt: fmtMoney(plan.target), cap: fmtMoney(plan.capital), pct }));

  if (plan.ddType === "static") {
    lines.push(t("summary_dd_static", { dd: fmtMoney(plan.ddValue), floor: fmtMoney(plan.capital - plan.ddValue) }));
  } else if (plan.ddType === "trailing_eod") {
    lines.push(t("summary_dd_trailing_eod", { dd: fmtMoney(plan.ddValue) }));
  } else {
    lines.push(t("summary_dd_trailing_intraday", { dd: fmtMoney(plan.ddValue) }));
  }

  if (plan.ddType !== "static") {
    if (plan.floorLock === "none") lines.push(t("summary_floor_none"));
    else if (plan.floorLock === "at_capital") lines.push(t("summary_floor_at_cap", { cap: fmtMoney(plan.capital) }));
    else if (plan.floorLock === "at_target_level") lines.push(t("summary_floor_at_target", { level: fmtMoney(plan.capital + plan.target) }));
    else if (plan.floorLock === "at_capital_plus_100") lines.push(t("summary_floor_cap100"));
  }

  if (plan.dailyLoss) {
    lines.push(plan.dailyLossIsFatal
      ? t("summary_dll_fatal", { v: fmtMoney(plan.dailyLoss) })
      : t("summary_dll_soft", { v: fmtMoney(plan.dailyLoss) }));
  } else {
    lines.push(t("summary_dll_none"));
  }

  if (plan.consistency && plan.consistencyType) {
    const pctC = (plan.consistency * 100).toFixed(0);
    lines.push(plan.consistencyType === "vs_target"
      ? t("summary_cons_target", { pct: pctC })
      : t("summary_cons_total",  { pct: pctC }));
  } else {
    lines.push(t("summary_cons_none"));
  }

  const min = plan.minDays || 0, max = plan.maxDays;
  if (min > 0 && max)      lines.push(t("summary_days_both",    { min, max }));
  else if (min > 0)        lines.push(t("summary_days_min_only", { min }));
  else if (max)            lines.push(t("summary_days_max_only", { max }));
  else                     lines.push(t("summary_days_none"));

  const hasAct = plan.activationFee && plan.activationFee > 0;
  if (plan.feeType === "monthly") {
    lines.push(hasAct
      ? t("summary_fee_monthly_act", { f: fmtMoney(plan.fee), a: fmtMoney(plan.activationFee) })
      : t("summary_fee_monthly",     { f: fmtMoney(plan.fee) }));
  } else {
    lines.push(hasAct
      ? t("summary_fee_onetime_act", { f: fmtMoney(plan.fee), a: fmtMoney(plan.activationFee) })
      : t("summary_fee_onetime",     { f: fmtMoney(plan.fee) }));
  }
  lines.push(t("summary_split", { pct: (plan.profitSplit * 100).toFixed(0) }));

  if (plan.phases === 2 && plan.phase2) {
    lines.push(plan.phase2.maxDays
      ? t("summary_phase2",      { tgt: fmtMoney(plan.phase2.target), min: plan.phase2.minDays ?? 0, max: plan.phase2.maxDays })
      : t("summary_phase2_nomax", { tgt: fmtMoney(plan.phase2.target), min: plan.phase2.minDays ?? 0 })
    );
  }

  return (
    <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }} data-testid="account-summary">
      <div className="fg-panel" style={{ padding: 16, borderColor: C.haze }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ color: C.brass, fontSize: 11, letterSpacing: 0.3, fontWeight: 700, textTransform: "uppercase" }}>
              › {t("account_summary_title")}
            </div>
            <div style={{ color: C.smoke, fontSize: 11, marginTop: 3 }}>› {t("account_summary_intro")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.smoke, fontSize: 10, letterSpacing: 0.25 }}>{t("selected_plan_label")}</div>
            <div style={{ color: C.bone, fontSize: 14, fontWeight: 700, marginTop: 3, letterSpacing: 0.02 }}>
              {firm.name.toUpperCase()}
              <span style={{ color: C.smoke, margin: "0 8px" }}>·</span>
              {plan.label}
              {isModified && <span style={{ marginLeft: 8, color: C.cinnabar, fontSize: 9,
                                             padding: "1px 5px", border: `1px solid ${C.cinnabar}`,
                                             background: `${C.cinnabar}15`, letterSpacing: 0.2 }}>
                {t("modified_badge")}
              </span>}
            </div>
          </div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", color: C.linen, fontSize: 12.5, lineHeight: 1.9 }}>
          {lines.map((l, i) => (
            <li key={i} style={{ borderBottom: i < lines.length - 1 ? `1px dashed ${C.dust}` : "none",
                                 padding: "4px 0" }}>
              <span style={{ color: C.brass, marginRight: 8 }}>›</span>{l}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
