import { C } from "../../lib/colors";
import { fmtMoney } from "../../lib/format";
import { useT } from "../LangContext";

export default function PlanCard({ plan, firm, selected, onClick }) {
  const { t } = useT();
  const isPopular = plan.capital === 50000 && firm.id !== "custom";
  const isCustom = firm.id === "custom";
  const ddPct = ((plan.ddValue / plan.capital) * 100).toFixed(1);
  const tgtPct = ((plan.target / plan.capital) * 100).toFixed(1);
  const ddTag = { trailing_eod: "TRAILING·EOD", trailing_intraday: "TRAILING·INTRADAY", static: "STATIC" }[plan.ddType];
  const ddCol = { trailing_eod: C.brass, trailing_intraday: C.cinnabar, static: C.smoke }[plan.ddType];
  return (
    <div className={`fg-panel fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`plan-${plan.planId}`}
         style={{ padding: 14, position: "relative" }}>
      {isPopular && (
        <span style={{ position: "absolute", top: -1, right: -1, fontSize: 9,
                       padding: "2px 8px", background: C.brass, color: C.ink,
                       fontWeight: 700, letterSpacing: 0.2 }}>{t("popular_badge")}</span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.bone, letterSpacing: -0.02 }}>
          {isCustom ? t("configure_word") : (plan.capital >= 1000 ? `$${(plan.capital / 1000).toFixed(0)}K` : fmtMoney(plan.capital))}
        </div>
        <div style={{ textAlign: "right", fontSize: 11 }}>
          {plan.feeType === "monthly" ? (
            <>
              <div style={{ color: C.cinnabar, fontSize: 9, letterSpacing: 0.2 }}>{t("monthly_badge")}</div>
              <div style={{ color: C.bone, marginTop: 2 }}>${plan.fee}<span style={{ color: C.smoke }}>/mo</span></div>
            </>
          ) : (
            <div style={{ color: C.bone }}>${plan.fee}</div>
          )}
        </div>
      </div>
      {!isCustom && (
        <>
          <div style={{ fontSize: 10.5, color: C.smoke, marginTop: 4, letterSpacing: 0.1 }}>› {plan.label}</div>
          <div className="fg-row-divider" style={{ margin: "10px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
            <div>
              <div style={{ color: C.smoke, fontSize: 9, letterSpacing: 0.2 }}>{t("summary_target")}</div>
              <div style={{ color: C.brass, marginTop: 2 }}>{fmtMoney(plan.target)}
                <span style={{ color: C.smoke }}> · {tgtPct}%</span></div>
            </div>
            <div>
              <div style={{ color: C.smoke, fontSize: 9, letterSpacing: 0.2 }}>{t("summary_dd")}</div>
              <div style={{ color: C.cinnabar, marginTop: 2 }}>{fmtMoney(plan.ddValue)}
                <span style={{ color: C.smoke }}> · {ddPct}%</span></div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10, letterSpacing: 0.15 }}>
            <span style={{ color: ddCol }}>◆ {ddTag}</span>
            {plan.phases === 2 && <span style={{ color: C.cinnabar }}>{t("two_phase_badge")}</span>}
          </div>
        </>
      )}
    </div>
  );
}
