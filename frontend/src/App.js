import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import "./App.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";
import { FIRM_DATABASE, STRATEGY_DEFAULTS, resolveFundedRules } from "./firmDatabase";
import { runMonteCarlo } from "./monteCarlo";
import { TOOLTIPS } from "./i18n";
import { C } from "./lib/colors";
import { fmtMoney, fmtPct, fmtInt, isPlanModified } from "./lib/format";
import { downloadJSON, exportPNG as exportPNGHelper } from "./lib/export";
import { LangProvider, useT } from "./components/LangContext";
import Glossary from "./components/Glossary";
import CsvModal from "./components/CsvModal";
import FundedLifecyclePanel from "./components/oracle/FundedLifecyclePanel";
import { CTooltip, ChartTitle, EmptyChart } from "./components/charting";
import {
  Tag, SectionBar, Toggle, InfoTooltip, NumField, SelectField,
  ToggleRow, Kpi, Warn, Collapsible,
} from "./components/shared/ui";
import {
  ModeSelector, PnLDistributionSection, IntradayRiskSection,
  CostsSection, BehavioralSection, PostPassSection,
} from "./components/strategy/StrategySections";

// ─────────────────────────── Archive Noir palette v3 ───────────────────────────
// Moved to src/lib/colors.js — imported above as `C`.
// Formatting helpers: src/lib/format.js
// Download/export: src/lib/export.js
// Language context + useT hook: src/components/LangContext.jsx



// ─────────────────────────── Minimal decorations (v3 — archive noir) ───────────────────────────
// Single small wax seal for header.
function HeaderSeal() {
  return (
    <svg viewBox="0 0 34 34" className="pf-header-seal" aria-hidden="true">
      <circle cx="17" cy="17" r="15" fill="#7A2E1F" />
      <circle cx="17" cy="17" r="12" fill="none" stroke="#DC4A3D" strokeWidth="0.6" opacity="0.75" />
      <text x="17" y="22" textAnchor="middle" fill="#0B0F10"
            fontFamily="Fraunces, serif" fontWeight="900" fontSize="14">§</text>
    </svg>
  );
}

// Hand-drawn borders, watermark sigil and flame removed — intentionally absent.
// Legacy names retained as no-ops where referenced internally.
function IrregularBorder() { return null; }
function FlowerDivider() { return null; }
function DecoTarot()   { return null; }
function DecoSeal()    { return null; }
function DecoChains()  { return null; }
function DecoCoin()    { return null; }
function DecoStain()   { return null; }
function InvokeFlame() { return null; }
function Sigil()       { return null; }
function OrnateDivider() { return null; }

const ROMAN = ["", "I", "II", "III", "IV", "V"];
const ROMAN_PREFIX = ["", "PRIMVS", "SECVNDVS", "TERTIVS", "QVARTVS", "QVINTVS"];

// ─────────────────────────── Atoms ───────────────────────────
// Tag, SectionBar, Toggle, InfoTooltip, NumField, SelectField,
// ToggleRow, Kpi, Warn moved to src/components/shared/ui.jsx

// CTooltip moved to src/components/charting.jsx

// ─────────────────────────── Root with LangProvider ───────────────────────────
function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}

// ─────────────────────────── AppInner ───────────────────────────
function AppInner() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState("chamber"); // chamber | strategy | oracle | gloss
  const [marketFilter, setMarketFilter] = useState("ALL");
  const [selectedFirmId, setSelectedFirmId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDraft, setPlanDraft] = useState(null);
  const [customUnlocked, setCustomUnlocked] = useState(false);
  const [strategy, setStrategy] = useState(STRATEGY_DEFAULTS);
  const [nSims, setNSims] = useState(STRATEGY_DEFAULTS.nSims);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAccountEditor, setShowAccountEditor] = useState(false);
  const [showMaeBlock, setShowMaeBlock] = useState(false);

  const [compareSlots, setCompareSlots] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Welcome block state
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  const resultsRef = useRef(null);
  const compareRef = useRef(null);

  const selectedFirm = useMemo(
    () => FIRM_DATABASE.find(f => f.id === selectedFirmId) || null,
    [selectedFirmId]
  );
  const presetPlan = useMemo(() => {
    if (!selectedFirm || !selectedPlanId) return null;
    return selectedFirm.plans.find(p => p.planId === selectedPlanId) || null;
  }, [selectedFirm, selectedPlanId]);
  const isModified = useMemo(() => isPlanModified(planDraft, presetPlan), [planDraft, presetPlan]);

  // Filter firms: Custom is handled specially (always first), and removed from regular filter list
  const regularFirms = useMemo(() => FIRM_DATABASE.filter(f => f.market !== "custom"), []);
  const customFirm = useMemo(() => FIRM_DATABASE.find(f => f.id === "custom"), []);

  const filteredRegular = useMemo(() => {
    if (marketFilter === "ALL") return regularFirms;
    if (marketFilter === "CUSTOM") return [];
    const map = { FUTURES: "futures", FOREX: "forex" };
    return regularFirms.filter(f => f.market === map[marketFilter]);
  }, [marketFilter, regularFirms]);

  const selectFirm = useCallback((id) => {
    setSelectedFirmId(id);
    setSelectedPlanId(null);
    setPlanDraft(null);
    setResults(null);
    setShowAccountEditor(false);
    setCustomUnlocked(id === "custom");
    // Auto-load the single plan for custom
    if (id === "custom") {
      const firm = FIRM_DATABASE.find(f => f.id === "custom");
      if (firm?.plans?.[0]) {
        const plan = firm.plans[0];
        setSelectedPlanId(plan.planId);
        setPlanDraft({ ...plan, phase2: plan.phase2 ? { ...plan.phase2 } : undefined });
        setShowAccountEditor(true);
      }
    }
  }, []);

  const selectPlan = useCallback((plan) => {
    setSelectedPlanId(plan.planId);
    setPlanDraft({ ...plan, phase2: plan.phase2 ? { ...plan.phase2 } : undefined });
    setResults(null);
  }, []);

  const updateDraft = (patch) => {
    setPlanDraft(prev => {
      const next = { ...prev, ...patch };
      if (next.ddType === "static") next.floorLock = null;
      else if (!next.floorLock) next.floorLock = "at_capital";
      if (next.dailyLoss === null || next.dailyLoss === undefined) next.dailyLossIsFatal = false;
      if (!next.consistency) next.consistencyType = null;
      else if (!next.consistencyType) next.consistencyType = "vs_total";
      if (next.phases === 2 && !next.phase2) next.phase2 = { target: next.target, minDays: 0, maxDays: null };
      return next;
    });
  };
  const updatePhase2 = (patch) =>
    setPlanDraft(prev => ({ ...prev, phase2: { ...(prev.phase2 || {}), ...patch } }));

  const handleRun = () => {
    if (!planDraft) return;
    setLoading(true);
    setResults(null);
    setActiveTab("oracle");
    setTimeout(() => {
      try {
        const fundedRules = strategy.postPassEnabled
          ? resolveFundedRules(planDraft, selectedFirm?.id, strategy.fundedOverride || {})
          : null;
        setResults(runMonteCarlo(planDraft, strategy, nSims, fundedRules));
      }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 30);
  };

  const addToCompare = () => {
    if (!planDraft || !selectedFirm) return;
    if (compareSlots.length >= 4) return;
    setCompareSlots(s => [...s, {
      id: Date.now() + Math.random(),
      firmId: selectedFirm.id,
      firmName: selectedFirm.name,
      planLabel: planDraft.label + (isModified ? " · mod" : ""),
      plan: { ...planDraft, phase2: planDraft.phase2 ? { ...planDraft.phase2 } : undefined },
      results: null,
    }]);
  };
  const removeFromCompare = (id) => setCompareSlots(s => s.filter(x => x.id !== id));
  const clearCompare = () => setCompareSlots([]);
  const runAllCompare = () => {
    if (compareSlots.length < 2) return;
    setCompareLoading(true);
    setTimeout(() => {
      try {
        setCompareSlots(compareSlots.map(slot => {
          const fr = strategy.postPassEnabled
            ? resolveFundedRules(slot.plan, slot.firmId, strategy.fundedOverride || {})
            : null;
          return { ...slot, results: runMonteCarlo(slot.plan, strategy, nSims, fr) };
        }));
      } catch (e) { console.error(e); }
      finally { setCompareLoading(false); }
    }, 30);
  };

  const applyCalibration = (strategyPatch) => {
    setStrategy(prev => ({ ...prev, ...strategyPatch }));
    setShowCsvModal(false);
  };

  const exportJSON = () => {
    if (!results) return;
    downloadJSON(`propforge-${selectedFirm?.id}-${planDraft?.planId}-${Date.now()}.json`, {
      exportedAt: new Date().toISOString(),
      firm: { id: selectedFirm?.id, name: selectedFirm?.name, subtitle: selectedFirm?.subtitle },
      plan: planDraft, strategy, nSims, results,
    });
  };
  const exportPNG = (ref, name) => exportPNGHelper(ref, `${name}-${Date.now()}`, C.ink);
  const exportCompareJSON = () => {
    if (!compareSlots.length) return;
    downloadJSON(`propforge-compare-${Date.now()}.json`, {
      exportedAt: new Date().toISOString(), strategy, nSims,
      slots: compareSlots.map(s => ({ firmId: s.firmId, firmName: s.firmName,
        planLabel: s.planLabel, plan: s.plan, results: s.results })),
    });
  };

  const isCustomMode = selectedFirmId === "custom";

  return (
    <div style={{ minHeight: "100vh", color: C.linen }} data-testid="app-root">
      <Header />

      <div className="pf-tabs-wrap">
        <div className="pf-tabs" role="tablist" data-testid="pf-tabs">
          <button className={`pf-tab ${activeTab === "chamber" ? "active" : ""}`}
                  data-testid="tab-chamber" onClick={() => setActiveTab("chamber")}>
            <span className="num">01</span>{t("tab_01")}
          </button>
          <button className={`pf-tab ${activeTab === "strategy" ? "active" : ""}`}
                  data-testid="tab-strategy" onClick={() => setActiveTab("strategy")}>
            <span className="num">02</span>{t("tab_02")}
          </button>
          <button className={`pf-tab ${activeTab === "oracle" ? "active" : ""}`}
                  data-testid="tab-oracle" onClick={() => setActiveTab("oracle")}>
            <span className="num">03</span>{t("tab_03")}
          </button>
          <button className={`pf-tab ${activeTab === "gloss" ? "active" : ""}`}
                  data-testid="tab-gloss" onClick={() => setActiveTab("gloss")}>
            <span className="num">04</span>{t("tab_04")}
          </button>
        </div>
      </div>

      {/* ─── TAB 01 · CHAMBER ─── */}
      {activeTab === "chamber" && (
        <div className="pf-tab-body fg-fadein" data-testid="pane-chamber">
          <div className="pf-tab-head">
            <div className="pf-tab-watermark">01</div>
            <div className="pf-tab-kicker">01 · chamber</div>
            <h2 className="pf-tab-title">{t("tab_01_title")}</h2>
            <div className="pf-tab-hint">{t("tab_01_hint")}</div>
          </div>
          <div className="pf-epigraph">{t("tab_01_epigraph")}</div>

          {welcomeOpen && <WelcomeBlock onClose={() => setWelcomeOpen(false)} />}

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}
               data-testid="market-filters">
            {[
              { k: "ALL",     l: t("filter_all") },
              { k: "FUTURES", l: t("filter_futures") },
              { k: "FOREX",   l: t("filter_forex") },
              { k: "CUSTOM",  l: t("filter_custom") },
            ].map(f => (
              <button key={f.k}
                      className={`fg-pill ${marketFilter === f.k ? "active" : ""}`}
                      onClick={() => setMarketFilter(f.k)}
                      data-testid={`filter-${f.k.toLowerCase()}`}>{f.l}</button>
            ))}
          </div>

          <div className="fg-scroll" data-testid="firm-grid"
               style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {customFirm && (
              <CustomFirstCard firm={customFirm}
                               selected={selectedFirmId === "custom"}
                               onClick={() => selectFirm("custom")} />
            )}
            {filteredRegular.map((firm, idx) => (
              <FirmCard key={firm.id} firm={firm}
                        selected={firm.id === selectedFirmId}
                        onClick={() => selectFirm(firm.id)} idx={idx} />
            ))}
          </div>

          {selectedFirm && !isCustomMode && (
            <section style={{ marginTop: 36 }} className="fg-fadein">
              <div className="fg-sec">§ {t("step_2_title")} — {selectedFirm.name}</div>
              <div data-testid="plan-grid"
                   style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {selectedFirm.plans.map(plan => (
                  <PlanCard key={plan.planId} plan={plan} firm={selectedFirm}
                            selected={plan.planId === selectedPlanId}
                            onClick={() => selectPlan(plan)} />
                ))}
              </div>
            </section>
          )}

          {isCustomMode && (
            <section style={{ marginTop: 32 }} className="fg-fadein" data-testid="custom-landing">
              <div className="fg-sec">§ {t("step_custom_title")}</div>
              <div className="fg-panel" style={{ padding: 20, borderColor: C.brass, borderStyle: "dashed" }}>
                <div style={{ color: C.linen, fontFamily: "var(--plex)", fontSize: 13.5, lineHeight: 1.7,
                              whiteSpace: "pre-line" }}>
                  {t("step_custom_body")}
                </div>
              </div>
            </section>
          )}

          {planDraft && selectedFirm && (
            <>
              <AccountSummary plan={planDraft} firm={selectedFirm} isModified={isModified} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button className="btn-secondary" onClick={() => setActiveTab("strategy")}
                        data-testid="btn-next-strategy">
                  {t("btn_next_strategy")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 02 · STRATEGY ─── */}
      {activeTab === "strategy" && (
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
                <CostsSection strategy={strategy} setStrategy={setStrategy} />
                <BehavioralSection strategy={strategy} setStrategy={setStrategy} />
                <PostPassSection strategy={strategy} setStrategy={setStrategy}
                                 firmId={selectedFirm?.id} plan={planDraft} />
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

                {(() => {
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
                })()}

                <button className="fg-btn-ghost"
                        onClick={addToCompare}
                        disabled={compareSlots.length >= 4}
                        data-testid="btn-add-compare"
                        style={{ width: "100%", padding: 10 }}>
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
      )}

      {/* ─── TAB 03 · ORACLE ─── */}
      {activeTab === "oracle" && (
        <div className="pf-tab-body fg-fadein" data-testid="pane-oracle">
          <div className="pf-tab-head">
            <div className="pf-tab-watermark">03</div>
            <div className="pf-tab-kicker">03 · oracle</div>
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
      )}

      {/* ─── TAB 04 · GLOSS ─── */}
      {activeTab === "gloss" && (
        <div className="pf-tab-body fg-fadein" data-testid="pane-gloss">
          <div className="pf-tab-head">
            <div className="pf-tab-watermark">04</div>
            <div className="pf-tab-kicker">04 · gloss</div>
            <h2 className="pf-tab-title">{t("tab_04_title")}</h2>
            <div className="pf-tab-hint">{t("tab_04_hint")}</div>
          </div>
          <Glossary />
        </div>
      )}

      <Footer />
      {showCsvModal && <CsvModal onClose={() => setShowCsvModal(false)} onApply={applyCalibration} />}
    </div>
  );
}

// ─────────────────────────── Strategy sections (v2 tab STRATEGY) ───────────────────────────
// Collapsible moved to src/components/shared/ui.jsx

// All STRATEGY sections moved to src/components/strategy/StrategySections.jsx


// ─────────────────────────── Compact header ───────────────────────────
function Header() {
  const { lang, t, setLang } = useT();
  const totalFirms = FIRM_DATABASE.filter(f => f.market !== "custom").length;
  const totalPlans = FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0);
  return (
    <header className="pf-header" data-testid="pf-header">
      <div className="pf-header-inner">
        <div className="pf-brand">
          <HeaderSeal />
          <div>
            <div className="pf-brand-mark" data-testid="hero-title">
              PROP<span className="dot">·</span>FORGE
            </div>
            <span className="pf-brand-sub">{t("app_subtitle")}</span>
            <span className="pf-brand-line" />
          </div>
        </div>
        <div className="pf-header-actions">
          <LangToggle lang={lang} setLang={setLang} />
          <div className="pf-meta">
            {totalFirms} chambers <span className="acc">·</span> {totalPlans} plans
          </div>
        </div>
      </div>
    </header>
  );
}

// Glossary moved to src/components/Glossary.jsx

function HeroSection() { return null; }

function LangToggle({ lang, setLang }) {
  const active = { color: C.brass, fontWeight: 700 };
  const dim    = { color: C.smoke, cursor: "pointer" };
  return (
    <div style={{ fontSize: 12, letterSpacing: 0.2, fontFamily: "var(--mono)" }}
         data-testid="lang-toggle">
      <span style={{ color: C.smoke }}>[ </span>
      <span style={lang === "es" ? active : dim} onClick={() => setLang("es")}
            data-testid="lang-es" role="button" tabIndex={0}>
        {lang === "es" ? "ES" : "es"}
      </span>
      <span style={{ color: C.haze, margin: "0 6px" }}>·</span>
      <span style={lang === "en" ? active : dim} onClick={() => setLang("en")}
            data-testid="lang-en" role="button" tabIndex={0}>
        {lang === "en" ? "EN" : "en"}
      </span>
      <span style={{ color: C.smoke }}> ]</span>
    </div>
  );
}

function WelcomeBlock({ onClose }) {
  const { t } = useT();
  return (
    <section style={{ maxWidth: 1600, margin: "16px auto 0", padding: "0 24px" }} data-testid="welcome-block">
      <div className="fg-panel fg-fadein" style={{ padding: 18, borderStyle: "dashed", borderColor: C.brass,
                                                     background: `${C.brass}06` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ color: C.brass, fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>
            › {t("welcome_title")}
          </div>
          <button className="fg-btn-ghost" onClick={onClose} data-testid="btn-welcome-close">
            ✕ {t("welcome_hide")}
          </button>
        </div>
        <div style={{ color: C.linen, fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
          {t("welcome_lead")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <div>
            <div style={{ color: C.smoke, fontSize: 10.5, letterSpacing: 0.25, textTransform: "uppercase",
                          marginBottom: 6, fontWeight: 700 }}>{t("welcome_flow_title")}</div>
            <ol style={{ margin: 0, paddingLeft: 18, color: C.linen, fontSize: 12.5, lineHeight: 1.8 }}>
              <li>{t("welcome_flow_1")}</li>
              <li>{t("welcome_flow_2")}</li>
              <li>{t("welcome_flow_3")}</li>
              <li>{t("welcome_flow_4")}</li>
            </ol>
          </div>
          <div>
            <div style={{ color: C.smoke, fontSize: 10.5, letterSpacing: 0.25, textTransform: "uppercase",
                          marginBottom: 6, fontWeight: 700 }}>{t("welcome_needs_title")}</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: C.linen, fontSize: 12.5, lineHeight: 1.8,
                         listStyle: "'› '" }}>
              <li>{t("welcome_needs_1")}</li>
              <li>{t("welcome_needs_2")}</li>
              <li>{t("welcome_needs_3")}</li>
              <li>{t("welcome_needs_4")}</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.haze}`,
                      color: C.smoke, fontSize: 11.5, lineHeight: 1.6 }}>
          // {t("welcome_footer")}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer style={{ padding: "28px 24px 32px", marginTop: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ color: C.haze, letterSpacing: 0.3, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
          ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
        </div>
        <div style={{ color: C.smoke, fontSize: 11, lineHeight: 1.8, marginTop: 10 }}>
          {t("footer_l1")}<br />
          {t("footer_l2")}<br />
          {t("footer_l3")}
        </div>
      </div>
    </footer>
  );
}

function StepHead({ n, title, sub, subtitle }) {
  const label = ROMAN_PREFIX[n] ? `${ROMAN_PREFIX[n]} · ${ROMAN[n]}` : `${ROMAN[n]}`;
  const watermark = String(n).padStart(2, "0");
  return (
    <div style={{ position: "relative", marginBottom: 32, marginTop: 20, minHeight: 120 }}>
      <div className="step-watermark" aria-hidden="true">{watermark}</div>
      <div className="step-head-v2">
        <div className="kicker">{label}</div>
        <h2 className="title">{title}</h2>
        {subtitle && <div className="title-latin">{subtitle}</div>}
        {sub && <div className="hint">{sub}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────── Firm / Plan cards (v2 — rotated, irregular borders) ───────────────────────────
function CustomFirstCard({ firm, selected, onClick }) {
  const { t } = useT();
  return (
    <div onClick={onClick} data-testid="firm-custom"
         className={`fg-card custom-card ${selected ? "selected" : ""}`}
         style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14,
                  justifyContent: "space-between", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true"
             style={{ color: C.brass, display: "block", flexShrink: 0, opacity: 0.85 }}>
          <path d="M18,38 L18,44 L46,44 L46,38 Q46,34 42,34 L22,34 Q18,34 18,38 Z"
                fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M12,34 L52,34" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <path d="M32,22 L32,34 M28,26 L36,26" stroke="currentColor" strokeWidth="1" />
          <circle cx="32" cy="20" r="2" fill="currentColor" />
        </svg>
        <div>
          <div style={{ fontFamily: "var(--plex)", fontSize: 10.5, letterSpacing: 0.24,
                        fontWeight: 500, color: C.cinnabar, marginBottom: 6, textTransform: "uppercase" }}>
            · vocatio propria
          </div>
          <div style={{ fontFamily: "var(--fraunces)", fontVariationSettings: "'opsz' 144, 'WONK' 1",
                        fontWeight: 900, color: C.bone, fontSize: 22, letterSpacing: "-0.02em",
                        lineHeight: 0.95 }}>
            {t("custom_card_title")}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                    fontSize: 13.5, lineHeight: 1.6, maxWidth: 520, fontWeight: 300 }}>
        {t("custom_card_desc")}
      </div>
      <div style={{ color: C.brass, fontFamily: "var(--plex)", fontSize: 11.5,
                    fontWeight: 600, letterSpacing: 0.22, textTransform: "uppercase" }}>
        → {t("custom_card_cta")}
      </div>
    </div>
  );
}

function estimateDifficulty(firm) {
  let score = 1;
  const hasIntraday = firm.plans.some(p => p.ddType === "trailing_intraday");
  const hasEod      = firm.plans.some(p => p.ddType === "trailing_eod");
  const hasStatic   = firm.plans.some(p => p.ddType === "static");
  const fatalDLL    = firm.plans.some(p => p.dailyLossIsFatal);
  const twoPhase    = firm.plans.some(p => p.phases === 2);
  const hasCons     = firm.plans.some(p => p.consistency);
  if (hasIntraday) score = Math.max(score, 3);
  else if (hasEod) score = Math.max(score, 2);
  else if (hasStatic) score = Math.max(score, 1);
  if (fatalDLL) score++;
  if (twoPhase) score++;
  if (hasCons)  score++;
  return Math.min(3, Math.max(1, Math.round(score / 2)));
}

function FirmCard({ firm, selected, onClick }) {
  const { t } = useT();
  const hasTwoPhase = firm.plans.some(p => p.phases === 2);
  const ddTypes = [...new Set(firm.plans.map(p => p.ddType))];
  const ddTag = (type) => ({
    trailing_eod: "trailing·eod", trailing_intraday: "trailing·intraday", static: "static"
  }[type] || type);
  const ddCol = (type) => ({
    trailing_eod: C.brass, trailing_intraday: C.cinnabar, static: C.steel
  }[type] || C.smoke);
  const stars = estimateDifficulty(firm);
  return (
    <div className={`fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`firm-${firm.id}`}
         style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, minHeight: 148, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--plex)", fontWeight: 600, color: C.bone, fontSize: 14.5,
                        letterSpacing: 0.02,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {firm.name}
          </div>
          <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.smoke,
                        fontWeight: 300, fontSize: 12.5, marginTop: 4 }}>
            {firm.subtitle}
          </div>
        </div>
        <Tag color={firm.badgeColor}>{firm.badge}</Tag>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 10, flexWrap: "wrap" }}>
        <span className="fg-rating" data-testid={`firm-${firm.id}-difficulty`}>
          {"✦".repeat(stars)}<span className="dim">{"✦".repeat(3 - stars)}</span>
        </span>
        <div style={{ display: "flex", gap: 10, fontSize: 10, letterSpacing: 0.14,
                      fontFamily: "var(--mono)", fontWeight: 400 }}>
          {ddTypes.map(ty => (
            <span key={ty} style={{ color: ddCol(ty) }}>{ddTag(ty)}</span>
          ))}
          {firm.allowsOvernight && <span style={{ color: C.linen }}>{t("overnight_badge")}</span>}
          {hasTwoPhase && <span style={{ color: C.cinnabar }}>{t("two_phase_badge")}</span>}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, firm, selected, onClick }) {
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

// ─────────────────────────── Account summary (natural language) ───────────────────────────
function AccountSummary({ plan, firm, isModified }) {
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

  const f = fmtMoney(plan.fee) + (plan.feeType === "monthly" ? "/mo" : "");
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

// ─────────────────────────── Account editor ───────────────────────────
function AccountEditor({ draft, onChange, onPhase2Change, unlocked, onResetToPreset }) {
  const { t } = useT();
  const d = draft;
  return (
    <div>
      <NumField label={t("field_capital")} prefix="$" value={d.capital} onChange={v => onChange({ capital: v })} disabled={!unlocked} testId="acc-capital" />
      <NumField label={t("field_target")}  prefix="$" value={d.target}  onChange={v => onChange({ target: v })}  disabled={!unlocked} testId="acc-target" />
      <SelectField label={t("field_dd_type")} value={d.ddType} disabled={!unlocked} tip="dd_type"
                   options={[
                     { value: "trailing_eod",      label: t("dd_type_trailing_eod") },
                     { value: "trailing_intraday", label: t("dd_type_trailing_intraday") },
                     { value: "static",            label: t("dd_type_static") },
                   ]}
                   onChange={v => onChange({ ddType: v })} testId="acc-ddtype" />
      <NumField label={t("field_dd_value")} prefix="$" value={d.ddValue} onChange={v => onChange({ ddValue: v })} disabled={!unlocked} testId="acc-ddvalue" />
      {d.ddType !== "static" && (
        <SelectField label={t("field_floor_lock")} value={d.floorLock || "at_capital"} disabled={!unlocked} tip="floor_lock"
                     options={[
                       { value: "none",                 label: t("floor_lock_none") },
                       { value: "at_capital",           label: t("floor_lock_at_capital") },
                       { value: "at_target_level",      label: t("floor_lock_at_target") },
                       { value: "at_capital_plus_100",  label: t("floor_lock_at_cap_plus_100") },
                     ]}
                     onChange={v => onChange({ floorLock: v })} testId="acc-floorlock" />
      )}
      <div className="fg-row-divider" />
      <ToggleRow label={t("field_daily_loss")} on={d.dailyLoss !== null && d.dailyLoss !== undefined} tip="dll"
                 onToggle={v => onChange({ dailyLoss: v ? (d.dailyLoss ?? 1000) : null })}
                 testId="acc-dll-toggle">
        <NumField label={t("field_dll_value")} prefix="$" value={d.dailyLoss} onChange={v => onChange({ dailyLoss: v })} disabled={!unlocked} testId="acc-dllvalue" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <label className="fg-label">{t("field_dll_fatal")}</label>
          <Toggle on={!!d.dailyLossIsFatal} onChange={v => onChange({ dailyLossIsFatal: v })} testId="acc-dll-fatal" />
        </div>
      </ToggleRow>
      <div className="fg-row-divider" />
      <ToggleRow label={t("field_consistency")} on={d.consistency !== null && d.consistency !== undefined} tip="consistency"
                 onToggle={v => onChange({ consistency: v ? (d.consistency ?? 0.3) : null })}
                 testId="acc-cons-toggle">
        <NumField label={t("field_consistency_pct")} value={d.consistency} step={0.01} onChange={v => onChange({ consistency: v })} disabled={!unlocked} testId="acc-consvalue" />
        <SelectField label={t("field_consistency_type")} value={d.consistencyType || "vs_total"} disabled={!unlocked}
                     options={[
                       { value: "vs_total",  label: t("cons_vs_total") },
                       { value: "vs_target", label: t("cons_vs_target") },
                     ]}
                     onChange={v => onChange({ consistencyType: v })} testId="acc-constype" />
      </ToggleRow>
      <div className="fg-row-divider" />
      <NumField label={t("field_min_days")} value={d.minDays || 0} onChange={v => onChange({ minDays: v ?? 0 })} disabled={!unlocked} testId="acc-mindays" />
      <ToggleRow label={t("field_max_days")} on={d.maxDays !== null && d.maxDays !== undefined}
                 onToggle={v => onChange({ maxDays: v ? (d.maxDays ?? 30) : null })}
                 testId="acc-maxdays-toggle">
        <NumField label={t("field_max")} value={d.maxDays} onChange={v => onChange({ maxDays: v })} disabled={!unlocked} testId="acc-maxdays" />
      </ToggleRow>
      <div className="fg-row-divider" />
      <SelectField label={t("field_phases")} value={String(d.phases || 1)} disabled={!unlocked} tip="phases"
                   options={[
                     { value: "1", label: t("phases_1") },
                     { value: "2", label: t("phases_2") },
                   ]}
                   onChange={v => onChange({ phases: parseInt(v) })} testId="acc-phases" />
      {d.phases === 2 && d.phase2 && (
        <div style={{ padding: 8, borderLeft: `2px solid ${C.cinnabar}`, background: `${C.cinnabar}10`, marginTop: 8 }}>
          <div style={{ fontSize: 10, color: C.cinnabar, letterSpacing: 0.3, marginBottom: 6, fontWeight: 700 }}>╳ PHASE·02</div>
          <NumField label={t("field_target")} prefix="$" value={d.phase2.target} onChange={v => onPhase2Change({ target: v })} disabled={!unlocked} testId="acc-p2-target" />
          <NumField label={t("field_min_days")} value={d.phase2.minDays ?? 0} onChange={v => onPhase2Change({ minDays: v ?? 0 })} disabled={!unlocked} testId="acc-p2-mindays" />
          <ToggleRow label={t("field_max_days")} on={d.phase2.maxDays !== null && d.phase2.maxDays !== undefined}
                     onToggle={v => onPhase2Change({ maxDays: v ? 60 : null })}
                     testId="acc-p2-maxdays-toggle">
            <NumField label={t("field_max")} value={d.phase2.maxDays} onChange={v => onPhase2Change({ maxDays: v })} disabled={!unlocked} testId="acc-p2-maxdays" />
          </ToggleRow>
        </div>
      )}
      <div className="fg-row-divider" />
      <NumField label={t("field_fee")} prefix="$" value={d.fee} onChange={v => onChange({ fee: v })} disabled={!unlocked} testId="acc-fee" />
      <NumField label={t("field_activation_fee")} prefix="$" value={d.activationFee || 0} onChange={v => onChange({ activationFee: v ?? 0 })} disabled={!unlocked} testId="acc-activation" />
      <SelectField label={t("field_fee_type")} value={d.feeType || "one_time"} disabled={!unlocked}
                   options={[
                     { value: "one_time", label: t("fee_one_time") },
                     { value: "monthly",  label: t("fee_monthly") },
                   ]}
                   onChange={v => onChange({ feeType: v })} testId="acc-feetype" />
      <NumField label={t("field_profit_split")} value={d.profitSplit} step={0.01} onChange={v => onChange({ profitSplit: v })} disabled={!unlocked} testId="acc-split" />
      {onResetToPreset && (
        <button className="fg-btn-ghost" onClick={onResetToPreset} data-testid="btn-reset-preset"
                style={{ marginTop: 10, width: "100%" }}>{t("btn_reset_preset")}</button>
      )}
    </div>
  );
}

// ─────────────────────────── Results panel ───────────────────────────
function ResultsPanel({ results, loading, plan, firm, isModified, onExportJSON, onExportPNG }) {
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

// ─────────────────────────── Dashboard — THE REVELATION ───────────────────────────
function OracleKpi({ label, value, sub, color = C.bone, testId }) {
  return (
    <div className="oracle-kpi" data-testid={testId}>
      <div className="lbl">{label}</div>
      <div className="val" style={{ color }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function ResultsDashboard({ results, plan }) {
  const { t } = useT();
  const r = results;
  const passing = r.pPass > r.ruinaMin;
  const evColor = r.ev >= 0 ? C.bone : C.cinnabar;
  const failTotal = r.pDD + r.pTimeout + r.pDLL;

  let fourth;
  if (r.pTimeout > 0.01) fourth = { label: t("kpi_p_timeout"), value: fmtPct(r.pTimeout), color: C.brass,     sub: t("kpi_p_timeout_sub") };
  else if (r.pDLL > 0.01) fourth = { label: t("kpi_p_dll"),     value: fmtPct(r.pDLL),     color: C.oxide, sub: t("kpi_p_dll_sub") };
  else                    fourth = { label: t("kpi_p_fail"),    value: fmtPct(failTotal),  color: C.cinnabar,     sub: t("kpi_p_fail_sub") };

  const ROI = r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : 0;

  const distData = [
    { name: "PASS", pct: +(r.pPass * 100).toFixed(2), fill: C.bone },
    { name: "DD",   pct: +(r.pDD   * 100).toFixed(2), fill: C.cinnabar },
  ];
  if (r.pTimeout > 0) distData.push({ name: "TIMEOUT", pct: +(r.pTimeout * 100).toFixed(2), fill: C.brass });
  if (r.pDLL     > 0) distData.push({ name: "DLL",     pct: +(r.pDLL     * 100).toFixed(2), fill: C.oxide });

  return (
    <div className="oracle-editorial" data-testid="results-dashboard">
      {/* Hero KPI row: P(PASS) · EV · P(DD) */}
      <div className="oracle-hero-kpis" data-testid="oracle-revelation">
        <div className={`oracle-ppass ${passing ? "passing" : "failing"}`} data-testid="kpi-ppass">
          <div className="lbl">{t("kpi_p_pass")}</div>
          <div className="big">{fmtPct(r.pPass)}</div>
          <div className="rule" />
          <div className="sub">{t("kpi_p_pass_sub", { x: (r.ruinaMin * 100).toFixed(1) })}</div>
        </div>
        <div className="oracle-secondary" data-testid="kpi-ev">
          <div className="lbl">{t("kpi_ev")}</div>
          <div className="val" style={{ color: evColor }}>
            {(r.ev >= 0 ? "+" : "-") + fmtMoney(Math.abs(r.ev))}
          </div>
          <div className="sub">{t("kpi_ev_sub", { x: fmtMoney(r.avgCost) })}</div>
        </div>
        <div className="oracle-secondary" data-testid="kpi-pdd">
          <div className="lbl">{t("kpi_p_dd")}</div>
          <div className="val" style={{ color: C.cinnabar }}>{fmtPct(r.pDD)}</div>
          <div className="sub">{t("kpi_p_dd_sub")}</div>
        </div>
      </div>

      {/* Distribution strip */}
      <div className="oracle-strip-title">{t("chart_result_dist")}</div>
      <div className="oracle-strip">
        <div><span className="lbl">pass</span>
          <span className="val" style={{ color: passing ? C.bone : C.cinnabar }}>{fmtPct(r.pPass)}</span></div>
        <div><span className="lbl">dd</span>
          <span className="val" style={{ color: C.cinnabar }}>{fmtPct(r.pDD)}</span></div>
        <div><span className="lbl">timeout</span>
          <span className="val" style={{ color: C.brass }}>{r.pTimeout > 0.001 ? fmtPct(r.pTimeout) : "—"}</span></div>
        <div><span className="lbl">dll</span>
          <span className="val" style={{ color: C.oxide }}>{r.pDLL > 0.001 ? fmtPct(r.pDLL) : "—"}</span></div>
      </div>

      {/* Timing strip */}
      <div className="oracle-strip-title">{t("ledger_chapter_title_timing")}</div>
      <div className="oracle-strip">
        <div data-testid="kpi-meanpass"><span className="lbl">{t("kpi_mean_days")}</span>
          <span className="val">{r.nPass > 0 ? `${Math.round(r.meanPass)}d` : "—"}</span>
          <span className="sub">
            {r.nPass > 0 ? t("kpi_mean_days_sub_ok", { x: Math.round(r.medianPass) }) : t("kpi_mean_days_sub_none")}
          </span></div>
        <div data-testid="kpi-p90pass"><span className="lbl">{t("kpi_p90_days")}</span>
          <span className="val" style={{ color: C.brass }}>
            {r.nPass > 0 ? `${Math.round(r.p90Pass)}d` : "—"}
          </span>
          <span className="sub">{t("kpi_p90_days_sub")}</span></div>
        <div data-testid="kpi-br95"><span className="lbl">{t("kpi_bankroll")}</span>
          <span className="val" style={{ color: C.brass }}>
            {r.passEssentiallyZero ? "—" : fmtMoney(r.br95)}
          </span>
          <span className="sub">
            {r.passEssentiallyZero ? t("kpi_bankroll_sub_zero") : t("kpi_bankroll_sub_ok", { x: fmtInt(r.n95) })}
          </span></div>
        <div data-testid="kpi-fourth"><span className="lbl">{fourth.label}</span>
          <span className="val" style={{ color: fourth.color }}>{fourth.value}</span>
          <span className="sub">{fourth.sub}</span></div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginTop: 24 }}>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-dist">
          <ChartTitle title={t("chart_result_dist")} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData} margin={{ top: 20, right: 10, left: 4, bottom: 0 }}>
              <XAxis dataKey="name" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} />
              <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
              <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }} />
              <Bar dataKey="pct"
                   label={{ position: "top", fill: C.bone, fontSize: 11, formatter: (v) => `${v}%` }}>
                {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-pass-hist">
          <ChartTitle title={t("chart_days_pass")}
                      caption={r.nPass > 0 ? t("chart_cap_pass", { m: Math.round(r.medianPass), p90: Math.round(r.p90Pass) }) : t("chart_no_samples")} />
          {r.histPass.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.histPass} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="day" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }} />
                <ReferenceLine x={Math.round(r.medianPass)} stroke={C.brass} strokeDasharray="2 3" />
                <Bar dataKey="pct" fill={C.bone} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-fail-hist">
          <ChartTitle title={t("chart_days_fail")}
                      caption={(r.nDD + r.nDLL + r.nTimeout) > 0 ? t("chart_cap_fail", { m: Math.round(r.medianFail) }) : t("chart_no_samples")} />
          {r.histFail.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.histFail} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="day" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.cinnabar}15` }} />
                <ReferenceLine x={Math.round(r.medianFail)} stroke={C.brass} strokeDasharray="2 3" />
                <Bar dataKey="pct" fill={C.cinnabar} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Attempt curve (probability of at-least-one PASS vs attempts) */}
      {r.attemptCurve && r.attemptCurve.length > 0 && (
        <>
          <div className="oracle-strip-title" style={{ marginTop: 28 }}>{t("chart_attempt_curve")}</div>
          <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-attempt-curve">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.attemptCurve} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="attempts" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }}
                       label={{ value: "attempts", position: "insideBottom", offset: -2, fill: C.smoke, fontSize: 10 }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" domain={[0, 100]} />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }}
                         formatter={(v, n, p) => [`${v}% · bankroll ${fmtMoney(p.payload.bankroll)}`, "p(≥1 pass)"]} />
                <ReferenceLine y={50} stroke={C.brass} strokeDasharray="2 3" />
                <ReferenceLine y={95} stroke={C.brass} strokeDasharray="2 3" />
                <Bar dataKey="pAtLeastOne" fill={C.bone} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
                          fontFamily: "var(--mono)", fontSize: 11.5, color: C.linen }}>
              {[50, 75, 95, 99].map(target => {
                const row = r.attemptCurve.find(x => x.pAtLeastOne >= target);
                return (
                  <div key={target}>
                    <div style={{ color: C.steel, fontFamily: "var(--plex)", fontSize: 10, letterSpacing: 0.15,
                                  textTransform: "uppercase", marginBottom: 2 }}>{target}% chance</div>
                    <div style={{ color: C.bone, fontSize: 13 }}>
                      {row ? `${row.attempts} att · ${fmtMoney(row.bankroll)}` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Commission impact */}
      {r.commissionImpact && r.commissionImpact.daily > 0 && (
        <>
          <div className="oracle-strip-title" style={{ marginTop: 28 }}>{t("chart_commission_impact")}</div>
          <div className="fg-panel" style={{ padding: 18 }} data-testid="kpi-commissions">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              <div>
                <div className="fg-label">{t("comm_daily")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: C.cinnabar, marginTop: 4 }}>
                  −{fmtMoney(r.commissionImpact.daily)}
                </div>
              </div>
              <div>
                <div className="fg-label">{t("comm_per_attempt")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: C.cinnabar, marginTop: 4 }}>
                  −{fmtMoney(r.commissionImpact.perAttempt)}
                </div>
                <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                              fontSize: 11.5, marginTop: 4 }}>
                  ≈ {Math.round(r.commissionImpact.avgDays)} days × daily
                </div>
              </div>
              <div>
                <div className="fg-label">{t("comm_pct_target")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: C.cinnabar, marginTop: 4 }}>
                  {r.finalTarget > 0 ? ((r.commissionImpact.perAttempt / r.finalTarget) * 100).toFixed(1) : "0"}%
                </div>
                <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                              fontSize: 11.5, marginTop: 4 }}>
                  of gross target
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Funded lifecycle (post-PASS) */}
      {r.postPass && <FundedLifecyclePanel pp={r.postPass} pPass={r.pPass} avgCost={r.avgCost} />}

      {/* Ledger */}
      <div className="oracle-strip-title" style={{ marginTop: 28 }}>{t("ledger_chapter_title")}</div>
      <div className="oracle-ledger" data-testid="stats-row">
        <div className="row"><span className="k">{t("stat_p_pass")}</span>
          <span className="v" style={{ color: passing ? C.bone : C.cinnabar }}>{fmtPct(r.pPass)}</span></div>
        <div className="row"><span className="k">{t("stat_ev_net")}</span>
          <span className="v" style={{ color: evColor }}>{(r.ev >= 0 ? "+" : "") + fmtMoney(r.ev)}</span></div>
        <div className="row"><span className="k">{t("stat_br99")}</span>
          <span className="v" style={{ color: C.brass }}>{r.passEssentiallyZero ? "—" : fmtMoney(r.br99)}</span></div>
        <div className="row"><span className="k">{t("stat_att99")}</span>
          <span className="v">{r.passEssentiallyZero ? "—" : fmtInt(r.n99)}</span></div>
        <div className="row"><span className="k">{t("stat_roi")}</span>
          <span className="v" style={{ color: ROI >= 0 ? C.bone : C.cinnabar }}>{ROI.toFixed(0)}%</span></div>
        <div className="row"><span className="k">{t("stat_split")}</span>
          <span className="v">{(plan.profitSplit * 100).toFixed(0)}%</span></div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dotted ${C.haze}`,
                      color: C.smoke, fontSize: 11, letterSpacing: 0.08, fontFamily: "var(--mono)", fontWeight: 300 }}>
          {t("stat_footer", { sims: r.nSims.toLocaleString("en-US"), pass: r.nPass, dd: r.nDD, to: r.nTimeout, dll: r.nDLL })}
          <span style={{ color: C.brass }}>{fmtMoney(r.payout)}</span>
        </div>
      </div>
    </div>
  );
}

// ChartTitle / FundedLifecyclePanel / EmptyChart moved to src/components/

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: "0 14px" }}>
      <div style={{ color: C.smoke, fontSize: 9, letterSpacing: 0.25 }}>{label}</div>
      <div style={{ color, fontSize: 15, marginTop: 5, fontWeight: 700, letterSpacing: -0.01 }}>{value}</div>
    </div>
  );
}

// ─────────────────────────── Compare rack + results ───────────────────────────
function CompareRack({ slots, onRemove, onClear, onRunAll, loading }) {
  const { t } = useT();
  const haveResults = slots.some(s => s.results);
  return (
    <div className="fg-panel" style={{ padding: 16, marginBottom: 16 }} data-testid="compare-rack">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ color: C.cinnabar, fontSize: 12, fontWeight: 700, letterSpacing: 0.25 }}>
          ╳ {t("compare_rack_title")} <span style={{ color: C.smoke, fontWeight: 400 }}>· {t("compare_rack_slots", { n: slots.length })}</span>
        </div>
        <button className="fg-btn-ghost" onClick={onClear} data-testid="btn-compare-clear">{t("btn_compare_clear")}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 12 }}>
        {slots.map((s, i) => (
          <div key={s.id} className="fg-panel"
               style={{ padding: 10, borderColor: s.results ? C.brass : C.dust }}
               data-testid={`compare-slot-${i}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: C.smoke, fontSize: 9, letterSpacing: 0.3 }}>{t("compare_slot", { n: String(i + 1).padStart(2, "0") })}</div>
                <div style={{ color: C.bone, fontSize: 12, fontWeight: 700, marginTop: 2, overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.firmName}</div>
                <div style={{ color: C.linen, fontSize: 11, marginTop: 2 }}>› {s.planLabel}</div>
              </div>
              <button className="fg-btn-ghost" style={{ padding: "2px 6px", fontSize: 11 }}
                      onClick={() => onRemove(s.id)} data-testid={`btn-compare-remove-${i}`}>✕</button>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10, color: C.smoke, letterSpacing: 0.1 }}>
              <span>cap · <span style={{ color: C.bone }}>{fmtMoney(s.plan.capital)}</span></span>
              <span>tgt · <span style={{ color: C.brass }}>{fmtMoney(s.plan.target)}</span></span>
              <span>dd · <span style={{ color: C.cinnabar }}>{fmtMoney(s.plan.ddValue)}</span></span>
            </div>
            {s.results && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.dust}`, fontSize: 10 }}>
                <div style={{ color: C.smoke }}>p(pass) · <span style={{ color: C.brass }}>{fmtPct(s.results.pPass)}</span></div>
                <div style={{ color: C.smoke }}>ev · <span style={{ color: s.results.ev >= 0 ? C.brass : C.cinnabar }}>
                  {(s.results.ev >= 0 ? "+" : "") + fmtMoney(s.results.ev)}
                </span></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className={`fg-btn ${loading ? "loading" : ""}`}
              onClick={onRunAll}
              disabled={slots.length < 2 || loading}
              data-testid="btn-run-all">
        {loading
          ? <>[ <span className="fg-dots">···</span>&nbsp;{t("compare_forging", { n: slots.length })}&nbsp;<span className="fg-dots">···</span> ]</>
          : slots.length < 2 ? t("btn_run_all_disabled") : t("btn_run_all", { n: slots.length })}
      </button>
      {haveResults && !loading && (
        <div style={{ color: C.smoke, fontSize: 10.5, marginTop: 10, letterSpacing: 0.15, textAlign: "center" }}>
          › {t("compare_help")}
        </div>
      )}
    </div>
  );
}

function CompareResults({ slots, onExportJSON, onExportPNG }) {
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

// ─────────────────────────── CSV modal ───────────────────────────
// CsvModal + StatMini moved to src/components/CsvModal.jsx


export default App;
