import { useState, useMemo, useEffect } from "react";
import { C } from "../lib/colors";
import { fmtMoney } from "../lib/format";
import { useT } from "./LangContext";
import { parseCsv, detectColumns, extractColumn, calibrateStrategy } from "../csvCalibrate";

function Toggle({ on, onChange, testId }) {
  return (
    <div className={`fg-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}
         data-testid={testId} role="switch" aria-checked={on} />
  );
}

function StatMini({ label, v, c }) {
  return (
    <div>
      <div style={{ color: C.smoke, fontSize: 9, letterSpacing: 0.25 }}>{label}</div>
      <div style={{ color: c, marginTop: 3, fontWeight: 700 }}>{v}</div>
    </div>
  );
}

export default function CsvModal({ onClose, onApply }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [colIdx, setColIdx] = useState(null);
  const [skipHeader, setSkipHeader] = useState(true);

  const parsed = useMemo(() => text.trim() ? parseCsv(text) : null, [text]);
  const cols = useMemo(() => parsed ? detectColumns(parsed.rows) : [], [parsed]);

  useEffect(() => {
    if (!cols.length) return;
    if (colIdx !== null && colIdx < cols.length) return;
    const withNeg = cols.filter(c => c.hasNegatives && c.numericCount >= 3);
    const candidate = withNeg.length
      ? withNeg.reduce((a, b) => (b.numericCount > a.numericCount ? b : a))
      : [...cols].reverse().find(c => c.numericCount >= 3) || cols[cols.length - 1];
    setColIdx(candidate.index);
  }, [cols, colIdx]);

  const activeCol = colIdx ?? 0;
  const preview = useMemo(() => {
    if (!parsed) return null;
    const values = extractColumn(parsed.rows, activeCol, skipHeader);
    return calibrateStrategy(values);
  }, [parsed, activeCol, skipHeader]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(String(ev.target.result || ""));
    reader.readAsText(file);
  };
  const loadSample = () => {
    const lines = ["day,pnl"];
    for (let i = 1; i <= 90; i++) {
      const isWin = Math.random() < 0.42;
      const pnl = isWin
        ? (400 + (Math.random() - 0.5) * 460).toFixed(2)
        : (-180 + (Math.random() - 0.5) * 60).toFixed(2);
      lines.push(`${i},${pnl}`);
    }
    setText(lines.join("\n"));
  };

  let errorMsg = null;
  if (preview?.error) {
    if (preview.error.startsWith("Need at least")) errorMsg = t("csv_err_samples");
    else if (preview.error === "No winning days found.") errorMsg = t("csv_err_no_wins");
    else if (preview.error === "No losing days found.")  errorMsg = t("csv_err_no_losses");
    else errorMsg = preview.error;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, padding: 20,
    }} onClick={onClose} data-testid="csv-modal">
      <div className="fg-panel" style={{
        width: "min(780px, 100%)", maxHeight: "90vh", overflow: "auto",
        background: C.archive, padding: 20, borderColor: C.brass,
        boxShadow: "0 0 40px rgba(255,184,0,0.25)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: C.bone, fontSize: 14, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" }}>
            {t("csv_title")}
          </div>
          <button className="fg-btn-ghost" onClick={onClose} data-testid="btn-csv-close">{t("btn_csv_close")}</button>
        </div>
        <div style={{ color: C.smoke, fontSize: 11, marginBottom: 14, lineHeight: 1.6 }}>
          {t("csv_help_1")}<br />{t("csv_help_2")}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <label className="fg-btn-ghost" style={{ display: "inline-block", cursor: "pointer" }}>
            {t("btn_csv_upload")}
            <input type="file" accept=".csv,.txt,text/csv" onChange={handleFile}
                   data-testid="csv-file-input" style={{ display: "none" }} />
          </label>
          <button className="fg-btn-ghost" onClick={loadSample} data-testid="btn-csv-sample">{t("btn_csv_sample")}</button>
          <button className="fg-btn-ghost" onClick={() => setText("")} data-testid="btn-csv-clear">{t("btn_csv_clear")}</button>
        </div>
        <textarea className="fg-input" data-testid="csv-textarea"
                  value={text} onChange={(e) => setText(e.target.value)}
                  placeholder={t("csv_placeholder")}
                  style={{ width: "100%", minHeight: 160, fontSize: 12, resize: "vertical", fontFamily: "var(--mono)" }} />

        {parsed && cols.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <label className="fg-label">{t("csv_col_label")}</label>
              <select className="fg-select" style={{ width: 200 }}
                      value={activeCol} onChange={(e) => setColIdx(parseInt(e.target.value))}
                      data-testid="csv-col-select">
                {cols.map(c => (
                  <option key={c.index} value={c.index}>
                    {t("csv_col_option", { header: c.header, n: c.numericCount, neg: c.hasNegatives ? t("csv_col_neg") : "" })}
                  </option>
                ))}
              </select>
              <label className="fg-label" style={{ marginLeft: 10 }}>{t("csv_skip_header")}</label>
              <Toggle on={skipHeader} onChange={setSkipHeader} testId="csv-skip-header" />
            </div>

            {errorMsg && (
              <div style={{ color: C.cinnabar, fontSize: 12, padding: "8px 10px",
                            border: `1px solid ${C.cinnabar}`, background: `${C.cinnabar}10` }}>// {errorMsg}</div>
            )}
            {preview?.stats && (
              <>
                <div style={{ padding: 12, background: C.ink, border: `1px dashed ${C.dust}`, marginBottom: 10 }}>
                  <div style={{ color: C.smoke, fontSize: 10, letterSpacing: 0.3, marginBottom: 6 }}>{t("csv_detected_title")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, fontSize: 11 }}>
                    <StatMini label={t("csv_samples")}  v={preview.stats.nSamples} c={C.bone} />
                    <StatMini label={t("csv_wins")}     v={preview.stats.nWins}    c={C.brass} />
                    <StatMini label={t("csv_losses")}   v={preview.stats.nLosses}  c={C.cinnabar} />
                    <StatMini label={t("csv_total")}    v={fmtMoney(preview.stats.totalPnl)} c={preview.stats.totalPnl >= 0 ? C.brass : C.cinnabar} />
                    <StatMini label={t("csv_avg_day")}  v={fmtMoney(preview.stats.avgDay)}   c={preview.stats.avgDay >= 0 ? C.brass : C.cinnabar} />
                  </div>
                </div>
                <div style={{ padding: 12, background: C.ink, border: `1px dashed ${C.brass}`, marginBottom: 14 }}>
                  <div style={{ color: C.brass, fontSize: 10, letterSpacing: 0.3, marginBottom: 6 }}>{t("csv_calibrated_title")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, fontSize: 11 }}>
                    <StatMini label={t("field_wr")}        v={preview.strategy.wr.toFixed(3)} c={C.bone} />
                    <StatMini label={t("field_mu_win")}    v={fmtMoney(preview.strategy.muWin)}     c={C.brass} />
                    <StatMini label={t("field_sigma_win")} v={fmtMoney(preview.strategy.sigmaWin)}  c={C.linen} />
                    <StatMini label={t("field_mu_loss")}   v={fmtMoney(preview.strategy.muLoss)}    c={C.cinnabar} />
                    <StatMini label={t("field_sigma_loss")} v={fmtMoney(preview.strategy.sigmaLoss)} c={C.linen} />
                    <StatMini label={t("field_tail_prob")} v={preview.strategy.tailProb.toFixed(4)} c={C.cinnabar} />
                    <StatMini label={t("field_tail_mult")} v={preview.strategy.tailMult.toFixed(3)} c={C.cinnabar} />
                  </div>
                </div>
                <button className="fg-btn" onClick={() => onApply(preview.strategy)} data-testid="btn-csv-apply">
                  {t("btn_csv_apply")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
