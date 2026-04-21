import { C } from "../../lib/colors";
import { fmtMoney, fmtPct } from "../../lib/format";
import { useT } from "../LangContext";

export default function CompareResults({ slots, onExportJSON, onExportPNG }) {
  const { t } = useT();
  const ready = slots.filter(s => s.results);
  if (!ready.length) return null;
  const bestPPass = Math.max(...ready.map(s => s.results.pPass));
  const bestEV    = Math.max(...ready.map(s => s.results.ev));
  const bestMean  = Math.min(...ready.filter(s => s.results.nPass > 0).map(s => s.results.meanPass), Infinity);
  const bestBR95  = Math.min(...ready.filter(s => !s.results.passEssentiallyZero).map(s => s.results.br95), Infinity);
  const bestROI   = Math.max(...ready.map(s => {
    const r = s.results;
    return r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : -Infinity;
  }));
  const rows = ready.map(s => {
    const r = s.results;
    const roi = r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : 0;
    return {
      id: s.id, name: `${s.firmName} · ${s.planLabel}`,
      pPass: r.pPass, ev: r.ev, avgCost: r.avgCost,
      meanPass: r.nPass > 0 ? r.meanPass : null,
      p90: r.nPass > 0 ? r.p90Pass : null,
      br95: r.passEssentiallyZero ? null : r.br95,
      roi, payout: r.payout, split: s.plan.profitSplit,
    };
  });
  const ranked = [...rows].sort((a, b) => b.ev - a.ev);
  const headerStyle = { color: C.smoke, fontSize: 10, padding: "10px 10px", letterSpacing: 0.25, textAlign: "right",
                        borderBottom: `1px dashed ${C.haze}`, fontWeight: 600 };
  const cellStyle = { padding: "10px 10px", fontSize: 12, textAlign: "right", borderBottom: `1px dashed ${C.dust}` };
  const winner = (isBest) => isBest
    ? { color: C.brass, fontWeight: 700, textShadow: `0 0 8px ${C.brass}55` }
    : {};
  return (
    <div className="fg-panel" style={{ padding: 16, marginBottom: 16 }} data-testid="compare-results">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: C.bone, fontSize: 13, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" }}>
            {t("compare_results_title")}
          </div>
          <div style={{ color: C.smoke, fontSize: 11, marginTop: 3 }}>› {t("compare_results_sub")}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="fg-btn-ghost" onClick={onExportPNG} data-testid="btn-compare-png">{t("btn_export_png")}</button>
          <button className="fg-btn-ghost" onClick={onExportJSON} data-testid="btn-compare-json">{t("btn_export_json")}</button>
        </div>
      </div>
      <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", minWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, textAlign: "left" }}>{t("compare_col_rank")}</th>
              <th style={headerStyle}>{t("compare_col_ppass")}</th>
              <th style={headerStyle}>{t("compare_col_ev")}</th>
              <th style={headerStyle}>{t("compare_col_cost")}</th>
              <th style={headerStyle}>{t("compare_col_mean")}</th>
              <th style={headerStyle}>{t("compare_col_p90")}</th>
              <th style={headerStyle}>{t("compare_col_br95")}</th>
              <th style={headerStyle}>{t("compare_col_roi")}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => (
              <tr key={r.id}>
                <td style={{ ...cellStyle, textAlign: "left" }}>
                  <span style={{ color: i === 0 ? C.brass : C.smoke, marginRight: 10, fontWeight: 700 }}>
                    {i === 0 ? "★" : `#${i + 1}`}
                  </span>
                  <span style={{ color: C.bone }}>{r.name}</span>
                </td>
                <td style={{ ...cellStyle, ...winner(r.pPass === bestPPass) }}>{fmtPct(r.pPass)}</td>
                <td style={{ ...cellStyle, color: r.ev >= 0 ? C.brass : C.cinnabar, ...winner(r.ev === bestEV) }}>
                  {(r.ev >= 0 ? "+" : "") + fmtMoney(r.ev)}
                </td>
                <td style={{ ...cellStyle, color: C.linen }}>{fmtMoney(r.avgCost)}</td>
                <td style={{ ...cellStyle, ...winner(r.meanPass !== null && r.meanPass === bestMean) }}>
                  {r.meanPass !== null ? Math.round(r.meanPass) + "d" : "—"}
                </td>
                <td style={{ ...cellStyle, color: C.linen }}>
                  {r.p90 !== null ? Math.round(r.p90) + "d" : "—"}
                </td>
                <td style={{ ...cellStyle, ...winner(r.br95 !== null && r.br95 === bestBR95) }}>
                  {r.br95 !== null ? fmtMoney(r.br95) : "—"}
                </td>
                <td style={{ ...cellStyle, color: r.roi >= 0 ? C.brass : C.cinnabar, ...winner(r.roi === bestROI) }}>
                  {r.roi.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, padding: "10px 12px", borderLeft: `2px solid ${C.brass}`,
                    background: `${C.brass}08`, fontSize: 12, color: C.linen, lineHeight: 1.6 }}>
        <span style={{ color: C.brass, fontWeight: 700, marginRight: 6 }}>{t("compare_winner_prefix")}</span>
        <b style={{ color: C.bone }}>{ranked[0].name}</b>
        <span style={{ color: C.smoke }}>{t("compare_winner_ev")}</span>
        <span style={{ color: C.brass }}>{(ranked[0].ev >= 0 ? "+" : "") + fmtMoney(ranked[0].ev)}</span>
        <span style={{ color: C.smoke }}>{t("compare_winner_ppass")}</span>
        <span style={{ color: C.brass }}>{fmtPct(ranked[0].pPass)}</span>
      </div>
    </div>
  );
}
