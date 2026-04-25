import { useT } from "../LangContext";
import ResultsPanel from "./ResultsPanel";
import CompareResults from "../compare/CompareResults";

export default function OracleTab({
  results, loading, planDraft, selectedFirm, isModified,
  resultsRef, compareRef, compareSlots,
  exportJSON, exportPNG, exportCompareJSON,
  setActiveTab,
}) {
  const { t } = useT();
  return (
    <div className="pf-tab-body fg-fadein" data-testid="pane-oracle">
      <div className="pf-tab-head">
        <div className="pf-tab-watermark">03</div>
        <div className="pf-tab-kicker">03 · results</div>
        <h2 className="pf-tab-title">{t("tab_03_title")}</h2>
        <div className="pf-tab-hint">{t("tab_03_hint")}</div>
      </div>

      {!results && !loading && (
        <div className="oracle-empty" data-testid="oracle-empty">
          {t("tab_03_empty")}
          <div style={{ marginTop: 16 }}>
            <button className="btn-secondary" onClick={() => setActiveTab("strategy")}>
              ← {t("tab_02")}
            </button>
          </div>
        </div>
      )}

      {(results || loading) && (
        <div ref={resultsRef}>
          <ResultsPanel results={results} loading={loading}
                        plan={planDraft} firm={selectedFirm} isModified={isModified}
                        onExportJSON={exportJSON}
                        onExportPNG={() => exportPNG(resultsRef, `propforge-${selectedFirm?.id}-${planDraft?.planId}`)}
          />
        </div>
      )}

      {compareSlots.some(s => s.results) && (
        <div ref={compareRef} style={{ marginTop: 36 }}>
          <CompareResults slots={compareSlots}
                          onExportJSON={exportCompareJSON}
                          onExportPNG={() => exportPNG(compareRef, "propforge-compare")} />
        </div>
      )}
    </div>
  );
}
