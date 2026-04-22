import { useState } from "react";
import { C } from "../../lib/colors";
import { fmtMoney } from "../../lib/format";
import { useT } from "../LangContext";
import { useUserPlan } from "../UserPlanContext";
import { Warn } from "../shared/ui";
import ResultsDashboard from "./ResultsDashboard";
import UpgradeModal from "../UpgradeModal";

function Warnings({ plan, firm, isModified }) {
  const { t } = useT();
  const warns = [];
  if (isModified) warns.push({ color: C.cinnabar, msg: t("warn_modified") });
  if (plan.feeType === "monthly") warns.push({ color: C.brass, msg: t("warn_monthly_fee", { fee: fmtMoney(plan.fee) }) });
  if (firm.id === "apex_eod" || firm.id === "apex_intraday") warns.push({ color: C.cinnabar, msg: t("warn_apex") });
  if (firm.id === "topstep") warns.push({ color: C.linen, msg: t("warn_topstep") });
  if (plan.consistency && plan.consistencyType === "vs_target") warns.push({ color: C.brass, msg: t("warn_cons_vs_target", { pct: (plan.consistency * 100).toFixed(0) }) });
  if (plan.consistency && plan.consistencyType === "vs_total")  warns.push({ color: C.brass, msg: t("warn_cons_vs_total",  { pct: (plan.consistency * 100).toFixed(0) }) });
  if (plan.phases === 2 && plan.phase2) warns.push({ color: C.cinnabar, msg: t("warn_two_phase", { t1: fmtMoney(plan.target), t2: fmtMoney(plan.phase2.target) }) });
  if (!warns.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      {warns.map((w, i) => <Warn key={i} color={w.color}>{w.msg}</Warn>)}
    </div>
  );
}

function LoadingState() {
  const { t } = useT();
  return (
    <div className="fg-panel" style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 26, color: C.cinnabar, letterSpacing: 0.3 }}>
        [ <span className="fg-dots">···</span>&nbsp;{t("btn_running").replace(/[[\]]/g, "").trim().toUpperCase()}&nbsp;<span className="fg-dots">···</span> ]
      </div>
      <div style={{ color: C.smoke, marginTop: 14, fontSize: 11, letterSpacing: 0.2 }}>
        › {t("loading_msg", { n: "monte-carlo" })}
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="fg-panel" style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 32, color: C.haze }}>◇</div>
      <div style={{ marginTop: 12, fontSize: 13, color: C.linen }}>
        {t("empty_configure")}<span style={{ color: C.brass }}>{t("btn_run")}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.smoke }}>› {t("empty_render_here")}</div>
    </div>
  );
}

export default function ResultsPanel({ results, loading, plan, firm, isModified, onExportJSON, onExportPNG }) {
  const { t } = useT();
  const { canAccess } = useUserPlan();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const exportLocked = !canAccess('export');

  const handleExport = (fn) => {
    if (exportLocked) {
      setShowUpgrade(true);
      return;
    }
    fn();
  };

  return (
    <div>
      <Warnings plan={plan} firm={firm} isModified={isModified} />
      {loading && <LoadingState />}
      {!loading && !results && <EmptyState />}
      {!loading && results && (
        <>
          <ResultsDashboard results={results} plan={plan} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button className="fg-btn-ghost" onClick={() => handleExport(onExportPNG)} data-testid="btn-export-png"
                    style={{ position: 'relative' }}>
              {exportLocked && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="2"
                     style={{ marginRight: 6 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              {t("btn_export_png")}
            </button>
            <button className="fg-btn-ghost" onClick={() => handleExport(onExportJSON)} data-testid="btn-export-json"
                    style={{ position: 'relative' }}>
              {exportLocked && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="2"
                     style={{ marginRight: 6 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              {t("btn_export_json")}
            </button>
          </div>
        </>
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
