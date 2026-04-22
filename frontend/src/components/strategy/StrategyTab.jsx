import { useState } from "react";
import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import { useUserPlan } from "../UserPlanContext";
import { SectionBar } from "../shared/ui";
import AccountEditor from "../account/AccountEditor";
import CompareRack from "../compare/CompareRack";
import PaywallGate from "../PaywallGate";
import UpgradeModal from "../UpgradeModal";
import {
  ModeSelector, PnLDistributionSection, IntradayRiskSection,
  CostsSection, BehavioralSection, PostPassSection,
} from "./StrategySections";

export default function StrategyTab({
  planDraft, strategy, setStrategy,
  selectedFirm, isCustomMode, isModified,
  showAccountEditor, setShowAccountEditor,
  customUnlocked, setCustomUnlocked,
  presetPlan, selectPlan, updateDraft, updatePhase2,
  nSims, setNSims, loading, handleRun,
  compareSlots, addToCompare, removeFromCompare, clearCompare, runAllCompare, compareLoading,
  setShowCsvModal,
  setActiveTab,
}) {
  const { t } = useT();
  const { canAccess } = useUserPlan();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleAddCompare = () => {
    if (!canAccess('compare')) {
      setShowUpgrade(true);
      return;
    }
    addToCompare();
  };

  return (
    <>
      <div className="pf-tab-body fg-fadein" data-testid="pane-strategy">
        <div className="pf-tab-head">
          <div className="pf-tab-watermark">02</div>
          <div className="pf-tab-kicker">02 · strategy</div>
          <h2 className="pf-tab-title">{t("tab_02_title")}</h2>
          <div className="pf-tab-hint">{t("tab_02_hint")}</div>
        </div>

        {!planDraft && (
          <div className="oracle-empty" data-testid="strategy-empty">
            {t("strategy_empty")}
            <div className="ignite-block-hint" data-testid="ignite-hint" style={{ marginTop: 16, justifyContent: "center" }}>
              <span className="hint-icon">※</span>
              <span>{t("hint_no_chamber")}</span>
              <button className="hint-link" onClick={() => setActiveTab("chamber")}
                      data-testid="ignite-hint-link">
                → {t("tab_01")}
              </button>
            </div>
          </div>
        )}

        {planDraft && (
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, alignItems: "start" }}>
            {/* Left column: Strategy sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ModeSelector strategy={strategy} setStrategy={setStrategy} />
              <PnLDistributionSection strategy={strategy} setStrategy={setStrategy}
                                      openCsv={() => setShowCsvModal(true)} />
              <IntradayRiskSection strategy={strategy} setStrategy={setStrategy} />
              <PaywallGate feature="commissions">
                <CostsSection strategy={strategy} setStrategy={setStrategy} />
              </PaywallGate>
              <PaywallGate feature="behavioral">
                <BehavioralSection strategy={strategy} setStrategy={setStrategy} />
              </PaywallGate>
              <PaywallGate feature="post_pass">
                <PostPassSection strategy={strategy} setStrategy={setStrategy}
                               firmId={selectedFirm?.id} plan={planDraft} />
              </PaywallGate>
            </div>

            {/* Right column: account + sim + ignite */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80 }}>
              <div className="fg-panel" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                              marginBottom: showAccountEditor ? 12 : 0 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: 0.3, textTransform: "uppercase",
                                color: C.smoke, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
                                fontFamily: "var(--plex)" }}>
                    <span>§ {t("section_account")}</span>
                    {isModified && <span style={{ color: C.cinnabar, fontSize: 9, letterSpacing: 0.2, padding: "1px 5px",
                                                   border: `1px solid ${C.cinnabar}`, background: `${C.cinnabar}15` }}>{t("modified_badge")}</span>}
                  </div>
                  {!isCustomMode && (
                    <button className="fg-btn-ghost"
                            onClick={() => { setShowAccountEditor(v => !v); setCustomUnlocked(true); }}
                            data-testid="btn-edit-account">
                      {showAccountEditor ? t("btn_close") : t("btn_edit")}
                    </button>
                  )}
                </div>
                {(showAccountEditor || isCustomMode) && (
                  <AccountEditor draft={planDraft} onChange={updateDraft} onPhase2Change={updatePhase2}
                                 unlocked={customUnlocked || isCustomMode}
                                 onResetToPreset={presetPlan && !isCustomMode ? () => selectPlan(presetPlan) : null} />
                )}
              </div>

              <div className="fg-panel" style={{ padding: 18 }}>
                <SectionBar label={t("section_sim")} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label className="fg-label">{t("field_n_sims")}</label>
                  <span style={{ color: C.brass, fontFamily: "var(--mono)", fontSize: 13 }}>
                    {nSims.toLocaleString("en-US")}
                  </span>
                </div>
                <input type="range" className="fg-range" min={1000} max={25000} step={1000}
                       value={nSims} onChange={(e) => setNSims(parseInt(e.target.value))}
                       data-testid="sim-nsims" />
              </div>

              <button className={`invoke-btn ${loading ? "loading" : ""}`}
                      onClick={handleRun}
                      disabled={!planDraft || loading || (strategy.mode === "bootstrap" && (!strategy.bootstrapData || strategy.bootstrapData.length < 30))}
                      data-testid="btn-run">
                {loading ? t("btn_running") : t("btn_run")}
              </button>

              <IgniteHint planDraft={planDraft} strategy={strategy} loading={loading}
                          setActiveTab={setActiveTab} t={t} />

              <button className="fg-btn-ghost"
                      onClick={handleAddCompare}
                      disabled={compareSlots.length >= 4}
                      data-testid="btn-add-compare"
                      style={{ width: "100%", padding: 10, position: "relative" }}>
                {!canAccess('compare') && (
                  <span style={{ 
                    position: 'absolute', 
                    left: 10, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                )}
                {compareSlots.length >= 4 ? t("btn_compare_full") : t("btn_add_compare", { n: compareSlots.length })}
              </button>
            </div>
          </div>
        )}

        {compareSlots.length > 0 && (
          <section style={{ marginTop: 36 }} className="fg-fadein">
            <CompareRack slots={compareSlots} onRemove={removeFromCompare} onClear={clearCompare}
                         onRunAll={runAllCompare} loading={compareLoading} />
          </section>
        )}
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}

function IgniteHint({ planDraft, strategy, loading, setActiveTab, t }) {
  let reason = null;
  if (!planDraft) reason = "chamber_missing";
  else if (strategy.mode === "bootstrap") {
    if (!strategy.bootstrapData || strategy.bootstrapData.length === 0) reason = "bootstrap_empty";
    else if (strategy.bootstrapData.length < 30) reason = "bootstrap_too_few";
  }
  if (!reason || loading) return null;
  return (
    <div className="ignite-block-hint" data-testid="ignite-hint">
      {reason === "chamber_missing" && (
        <>
          <span className="hint-icon">※</span>
          <span>{t("hint_no_chamber")}</span>
          <button className="hint-link" onClick={() => setActiveTab("chamber")}
                  data-testid="ignite-hint-link">
            → {t("tab_01")}
          </button>
        </>
      )}
      {reason === "bootstrap_empty" && (
        <>
          <span className="hint-icon">※</span>
          <span>{t("hint_bootstrap_empty")}</span>
        </>
      )}
      {reason === "bootstrap_too_few" && (
        <>
          <span className="hint-icon">⚠</span>
          <span>{t("hint_bootstrap_too_few", { n: strategy.bootstrapData.length })}</span>
        </>
      )}
    </div>
  );
}
