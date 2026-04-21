import { C } from "../../lib/colors";
import { fmtMoney } from "../../lib/format";
import { useT } from "../LangContext";
import { Warn } from "../shared/ui";
import ResultsDashboard from "./ResultsDashboard";

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
  return (
    <div>
      <Warnings plan={plan} firm={firm} isModified={isModified} />
      {loading && <LoadingState />}
      {!loading && !results && <EmptyState />}
      {!loading && results && (
        <>
          <ResultsDashboard results={results} plan={plan} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button className="fg-btn-ghost" onClick={onExportPNG} data-testid="btn-export-png">{t("btn_export_png")}</button>
            <button className="fg-btn-ghost" onClick={onExportJSON} data-testid="btn-export-json">{t("btn_export_json")}</button>
          </div>
        </>
      )}
    </div>
  );
}
