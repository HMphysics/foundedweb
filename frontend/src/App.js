import React, { useState, useMemo, useCallback, useRef, useContext, createContext, useEffect } from "react";
import "./App.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";
import { toPng } from "html-to-image";
import { FIRM_DATABASE, STRATEGY_DEFAULTS } from "./firmDatabase";
import { runMonteCarlo } from "./monteCarlo";
import { parseCsv, detectColumns, extractColumn, calibrateStrategy } from "./csvCalibrate";
import { makeT, detectBrowserLang, TOOLTIPS } from "./i18n";

// ─────────────────────────── THE ORACLE palette ───────────────────────────
const C = {
  bg: "#050302", panel: "#0D0806", elev: "#1A0F0A",
  border: "#2D1F15", borderHot: "#3D3228",
  ember: "#B8860B", flame: "#E8B923", blood: "#C1272D", bloodDark: "#8B0000",
  char: "#1A0F0A", ash: "#6B5A47",
  bone: "#E8DCC4", boneDim: "#C4B59E",
};

const LangCtx = createContext({ lang: "en", t: makeT("en"), setLang: () => {} });
const useT = () => useContext(LangCtx);

// helpers
function fmtMoney(n, decimals = 0) {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
const fmtPct = (n, d = 2) => !isFinite(n) ? "—" : (n * 100).toFixed(d) + "%";
const fmtInt = (n) => !isFinite(n) ? "—" : Math.round(n).toLocaleString("en-US");

function isPlanModified(plan, presetPlan) {
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

function download(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  download(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─────────────────────────── SVG ORNAMENTS ───────────────────────────
function Sigil({ size = 120, color = C.ember, className = "" }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className}
         style={{ color, display: "block" }} aria-hidden="true">
      <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.3" />
      <polygon points="60,20 95,80 25,80" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
      <polygon points="60,100 25,40 95,40" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
      <circle cx="60" cy="60" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.95" />
      <circle cx="60" cy="60" r="2" fill="currentColor" />
      <text x="60" y="17" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill="currentColor" opacity="0.8">※</text>
      <text x="60" y="114" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill="currentColor" opacity="0.8">※</text>
      <text x="8" y="64" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill="currentColor" opacity="0.8">†</text>
      <text x="112" y="64" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="8" fill="currentColor" opacity="0.8">†</text>
    </svg>
  );
}
function OrnateDivider({ color = C.ember, opacity = 0.75 }) {
  return (
    <svg viewBox="0 0 800 24" width="100%" height="20" aria-hidden="true"
         style={{ color, display: "block", margin: "8px 0" }} preserveAspectRatio="none">
      <line x1="0" y1="12" x2="340" y2="12" stroke="currentColor" strokeWidth="0.5" opacity={opacity * 0.4} />
      <g transform="translate(400,12)">
        <circle cx="-30" cy="0" r="1.2" fill="currentColor" opacity={opacity * 0.8} />
        <circle cx="30"  cy="0" r="1.2" fill="currentColor" opacity={opacity * 0.8} />
        <path d="M-22,0 L-11,-5 L0,0 L11,-5 L22,0 L11,5 L0,0 L-11,5 Z"
              fill="none" stroke="currentColor" strokeWidth="0.75" opacity={opacity} />
        <circle cx="0" cy="0" r="1.8" fill="currentColor" opacity={opacity} />
      </g>
      <line x1="460" y1="12" x2="800" y2="12" stroke="currentColor" strokeWidth="0.5" opacity={opacity * 0.4} />
    </svg>
  );
}
// Roman numerals for step headings
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];
const ROMAN_PREFIX = ["", "PRIMVS", "SECVNDVS", "TERTIVS", "QVARTVS", "QVINTVS"];

// ─────────────────────────── Atoms ───────────────────────────
function Tag({ children, color = C.boneDim }) {
  return <span className="fg-tag" style={{ color }}>{children}</span>;
}

function SectionBar({ label }) {
  return (
    <div className="fg-sec">
      <span>§ {label}</span>
      <span style={{ color: C.border, letterSpacing: 0 }}>━━━━━━━━━━</span>
    </div>
  );
}

function Toggle({ on, onChange, testId }) {
  return (
    <div className={`fg-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}
         data-testid={testId} role="switch" aria-checked={on} />
  );
}

// Info icon + popover tooltip
function InfoTooltip({ id }) {
  const { lang } = useT();
  const [open, setOpen] = useState(false);
  const tip = TOOLTIPS[lang]?.[id] || TOOLTIPS.en[id];
  if (!tip) return null;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
          onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <button type="button" tabIndex={0}
              aria-label={tip.title}
              data-testid={`tip-${id}`}
              style={{ background: "transparent", border: "none", cursor: "help",
                       color: C.ash, fontSize: 11, padding: "0 4px", lineHeight: 1 }}
              onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}>
        ⓘ
      </button>
      {open && (
        <div style={{
          position: "absolute", left: "100%", top: "-4px", marginLeft: 6,
          width: 320, zIndex: 50,
          background: C.elev, border: `1px solid ${C.ember}`,
          padding: 12, boxShadow: "0 0 24px rgba(255,184,0,0.25)",
          fontFamily: "var(--mono)",
          pointerEvents: "none",
        }}>
          <div style={{ color: C.ember, fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
                        textTransform: "uppercase", marginBottom: 6 }}>
            § {tip.title}
          </div>
          <div style={{ color: C.boneDim, fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {tip.body}
          </div>
        </div>
      )}
    </span>
  );
}

function NumField({ label, value, onChange, step = 1, disabled = false, prefix, testId, width = 120, tip }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
      <label className="fg-label" style={{ flex: 1, display: "inline-flex", alignItems: "center" }}>
        {label}
        {tip && <InfoTooltip id={tip} />}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 4, width }}>
        {prefix && <span style={{ color: C.ash, fontSize: 11 }}>{prefix}</span>}
        <input
          type="number" className="fg-input"
          value={value ?? ""} step={step} disabled={disabled}
          onChange={(e) => {
            const v = e.target.value === "" ? null : parseFloat(e.target.value);
            onChange(isNaN(v) ? null : v);
          }}
          data-testid={testId}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled = false, testId, tip }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
      <label className="fg-label" style={{ flex: 1, display: "inline-flex", alignItems: "center" }}>
        {label}
        {tip && <InfoTooltip id={tip} />}
      </label>
      <select className="fg-select" style={{ width: 120 }} value={value ?? ""} disabled={disabled}
              onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
              data-testid={testId}>
        {options.map(o => <option key={o.value ?? "null"} value={o.value ?? ""}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleRow({ label, on, onToggle, testId, tip, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label className="fg-label" style={{ display: "inline-flex", alignItems: "center" }}>
          {label}
          {tip && <InfoTooltip id={tip} />}
        </label>
        <Toggle on={on} onChange={onToggle} testId={testId} />
      </div>
      {on && <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `1px dashed ${C.borderHot}` }}>{children}</div>}
    </div>
  );
}

function Kpi({ label, value, sub, color = C.bone, testId, tip }) {
  return (
    <div className="fg-panel" style={{ padding: "14px 16px" }} data-testid={testId}>
      <div className="fg-label" style={{ marginBottom: 10, color: C.ash, display: "inline-flex", alignItems: "center" }}>
        › {label}{tip && <InfoTooltip id={tip} />}
      </div>
      <div className="fg-kpi" style={{ color }}>{value}</div>
      {sub && <div style={{ color: C.ash, fontSize: 10.5, marginTop: 8, letterSpacing: 0.05 }}>› {sub}</div>}
    </div>
  );
}

function Warn({ prefix = "//", children, color = C.ember }) {
  return (
    <div style={{
      display: "flex", gap: 10, padding: "8px 12px",
      borderLeft: `2px solid ${color}`,
      background: `${color}0A`,
      marginBottom: 6, fontSize: 12, lineHeight: 1.55,
    }}>
      <div style={{ color, fontWeight: 700, opacity: 0.9 }}>{prefix}</div>
      <div style={{ color: C.boneDim, flex: 1 }}>{children}</div>
    </div>
  );
}

function CTooltip({ active, payload, label, unit = "%" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.ember}`,
      padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 11,
      boxShadow: "0 0 16px rgba(255,184,0,0.2)",
    }}>
      <div style={{ color: C.ash }}>› {label}</div>
      <div style={{ color: C.ember }}>{payload[0].value}{unit}</div>
    </div>
  );
}

// ─────────────────────────── Root with LangCtx ───────────────────────────
function App() {
  const [lang, setLang] = useState(detectBrowserLang());
  const t = useMemo(() => makeT(lang), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <LangCtx.Provider value={{ lang, t, setLang }}>
      <AppInner />
    </LangCtx.Provider>
  );
}

// ─────────────────────────── AppInner ───────────────────────────
function AppInner() {
  const { t } = useT();
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
    setTimeout(() => {
      try { setResults(runMonteCarlo(planDraft, strategy, nSims)); }
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
        setCompareSlots(compareSlots.map(slot => ({ ...slot, results: runMonteCarlo(slot.plan, strategy, nSims) })));
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
  const exportPNG = async (ref, name) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: C.bg, pixelRatio: 2, cacheBust: true,
        style: { fontFamily: "'JetBrains Mono', monospace" },
      });
      download(`${name}-${Date.now()}.png`, dataUrl);
    } catch (e) { console.error(e); }
  };
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
    <div style={{ minHeight: "100vh", color: C.boneDim }} data-testid="app-root">
      <Header openWelcome={() => setWelcomeOpen(true)} welcomeOpen={welcomeOpen} />

      {welcomeOpen && <WelcomeBlock onClose={() => setWelcomeOpen(false)} />}

      {/* STEP 1 */}
      <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }}>
        <StepHead n={1} title={t("step_1_title")} subtitle={t("step_1_subtitle")} sub={t("step_1_hint")} />
        <div style={{ display: "flex", gap: 0, alignItems: "center", marginBottom: 18, color: C.ash, fontSize: 12 }}
             data-testid="market-filters">
          <span style={{ marginRight: 10 }}>‹</span>
          {[
            { k: "ALL",     l: t("filter_all") },
            { k: "FUTURES", l: t("filter_futures") },
            { k: "FOREX",   l: t("filter_forex") },
            { k: "CUSTOM",  l: t("filter_custom") },
          ].map((f, i) => (
            <React.Fragment key={f.k}>
              {i > 0 && <span style={{ margin: "0 10px", color: C.borderHot }}>·</span>}
              <button className={`fg-pill ${marketFilter === f.k ? "active" : ""}`}
                      onClick={() => setMarketFilter(f.k)}
                      data-testid={`filter-${f.k.toLowerCase()}`}>{f.l}</button>
            </React.Fragment>
          ))}
          <span style={{ marginLeft: 10 }}>›</span>
        </div>

        <div className="fg-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }} data-testid="firm-grid">
          {/* Custom card always first */}
          {customFirm && (
            <CustomFirstCard firm={customFirm}
                             selected={selectedFirmId === "custom"}
                             onClick={() => selectFirm("custom")} />
          )}
          {filteredRegular.map(firm => (
            <FirmCard key={firm.id} firm={firm}
                      selected={firm.id === selectedFirmId}
                      onClick={() => selectFirm(firm.id)} />
          ))}
        </div>
      </section>

      {/* STEP 2 — either plan selector or custom landing */}
      {selectedFirm && !isCustomMode && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }} className="fg-fadein">
          <StepHead n={2} title={`${t("step_2_title")} — ${selectedFirm.name.toUpperCase()}`}
                    subtitle={t("step_2_subtitle")} sub={`${selectedFirm.subtitle}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }} data-testid="plan-grid">
            {selectedFirm.plans.map(plan => (
              <PlanCard key={plan.planId} plan={plan} firm={selectedFirm}
                        selected={plan.planId === selectedPlanId}
                        onClick={() => selectPlan(plan)} />
            ))}
          </div>
        </section>
      )}
      {isCustomMode && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }} className="fg-fadein">
          <StepHead n={2} title={t("step_custom_title")} subtitle={t("step_custom_subtitle")} sub={t("step_custom_hint")} />
          <div className="fg-panel" style={{ padding: 16, borderColor: C.ember, borderStyle: "dashed",
                                              background: `${C.ember}06` }} data-testid="custom-landing">
            <div style={{ color: C.boneDim, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {t("step_custom_body")}
            </div>
          </div>
        </section>
      )}

      {/* Account summary (natural language) */}
      {planDraft && selectedFirm && <AccountSummary plan={planDraft} firm={selectedFirm} isModified={isModified} />}

      {/* STEP 3 + RESULTS */}
      {planDraft && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }} className="fg-fadein">
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 340, minWidth: 300, flexShrink: 0 }}>
              <StepHead n={3} title={t("step_3_title")} subtitle={t("step_3_subtitle")} sub={t("step_3_hint")} />

              <div className="fg-panel" style={{ padding: 14, marginBottom: 12 }}>
                <SectionBar label={t("section_pnl")} />
                <button className="fg-btn-ghost" onClick={() => setShowCsvModal(true)}
                        data-testid="btn-open-csv" style={{ width: "100%", marginBottom: 10 }}>
                  {t("calibrate_cta")}
                </button>
                <NumField label={t("field_wr")} value={strategy.wr} step={0.01} tip="wr"
                          onChange={v => setStrategy({ ...strategy, wr: v })} testId="strat-wr" />
                <NumField label={t("field_mu_win")} prefix="$" value={strategy.muWin} tip="mu_sigma"
                          onChange={v => setStrategy({ ...strategy, muWin: v })} testId="strat-muwin" />
                <NumField label={t("field_sigma_win")} prefix="$" value={strategy.sigmaWin}
                          onChange={v => setStrategy({ ...strategy, sigmaWin: v })} testId="strat-sigmawin" />
                <NumField label={t("field_mu_loss")} prefix="$" value={strategy.muLoss}
                          onChange={v => setStrategy({ ...strategy, muLoss: v })} testId="strat-muloss" />
                <NumField label={t("field_sigma_loss")} prefix="$" value={strategy.sigmaLoss}
                          onChange={v => setStrategy({ ...strategy, sigmaLoss: v })} testId="strat-sigmaloss" />
                <NumField label={t("field_tail_prob")} value={strategy.tailProb} step={0.001} tip="spike"
                          onChange={v => setStrategy({ ...strategy, tailProb: v })} testId="strat-tailprob" />
                <NumField label={t("field_tail_mult")} value={strategy.tailMult} step={0.01}
                          onChange={v => setStrategy({ ...strategy, tailMult: v })} testId="strat-tailmult" />
              </div>

              <details className="fg-panel" style={{ padding: 12, marginBottom: 12 }} open={showMaeBlock}
                       onToggle={(e) => setShowMaeBlock(e.target.open)}>
                <summary style={{ fontSize: 10.5, letterSpacing: 0.3, textTransform: "uppercase",
                                  color: C.ash, display: "flex", justifyContent: "space-between", fontWeight: 700,
                                  alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    § {t("section_mae")} <span style={{ color: C.borderHot, marginLeft: 6 }}>{t("section_mae_opt")}</span>
                    <InfoTooltip id="mae" />
                  </span>
                  <span>{showMaeBlock ? "▾" : "▸"}</span>
                </summary>
                <div style={{ marginTop: 10 }}>
                  <NumField label={t("field_mae_win")}  value={strategy.maeWin}  step={0.01}
                            onChange={v => setStrategy({ ...strategy, maeWin: v })}  testId="strat-maewin" />
                  <NumField label={t("field_mae_loss")} value={strategy.maeLoss} step={0.01}
                            onChange={v => setStrategy({ ...strategy, maeLoss: v })} testId="strat-maeloss" />
                </div>
              </details>

              <div className="fg-panel" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                              marginBottom: showAccountEditor ? 10 : 0 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: 0.3, textTransform: "uppercase",
                                color: C.ash, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>§ {t("section_account")}</span>
                    {isModified && <span style={{ color: C.flame, fontSize: 9, letterSpacing: 0.2, padding: "1px 5px",
                                                   border: `1px solid ${C.flame}`, background: `${C.flame}15` }}>{t("modified_badge")}</span>}
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

              <div className="fg-panel" style={{ padding: 14, marginBottom: 14 }}>
                <SectionBar label={t("section_sim")} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label className="fg-label">{t("field_n_sims")}</label>
                  <span style={{ color: C.ember, fontSize: 12 }}>{nSims.toLocaleString("en-US")}</span>
                </div>
                <input type="range" className="fg-range" min={1000} max={25000} step={1000}
                       value={nSims} onChange={(e) => setNSims(parseInt(e.target.value))}
                       data-testid="sim-nsims" />
              </div>

              <button className={`fg-btn ${loading ? "loading" : ""}`}
                      onClick={handleRun} disabled={!planDraft || loading}
                      data-testid="btn-run">
                {loading ? t("btn_running") : t("btn_run")}
              </button>

              <button className="fg-btn-ghost"
                      onClick={addToCompare}
                      disabled={compareSlots.length >= 4}
                      data-testid="btn-add-compare"
                      style={{ width: "100%", marginTop: 10, padding: 10 }}>
                {compareSlots.length >= 4 ? t("btn_compare_full") : t("btn_add_compare", { n: compareSlots.length })}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 300 }} ref={resultsRef}>
              <ResultsPanel results={results} loading={loading}
                            plan={planDraft} firm={selectedFirm} isModified={isModified}
                            onExportJSON={exportJSON}
                            onExportPNG={() => exportPNG(resultsRef, `propforge-${selectedFirm?.id}-${planDraft?.planId}`)}
              />
            </div>
          </div>
        </section>
      )}

      {compareSlots.length > 0 && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "26px 24px 0" }} className="fg-fadein">
          <CompareRack slots={compareSlots} onRemove={removeFromCompare} onClear={clearCompare}
                       onRunAll={runAllCompare} loading={compareLoading} />
          {compareSlots.some(s => s.results) && (
            <div ref={compareRef}>
              <CompareResults slots={compareSlots}
                              onExportJSON={exportCompareJSON}
                              onExportPNG={() => exportPNG(compareRef, "propforge-compare")} />
            </div>
          )}
        </section>
      )}

      <Footer />
      {showCsvModal && <CsvModal onClose={() => setShowCsvModal(false)} onApply={applyCalibration} />}
    </div>
  );
}

// ─────────────────────────── Rail + Hero ───────────────────────────
function Header({ openWelcome, welcomeOpen }) {
  const { lang, t, setLang } = useT();
  const totalFirms = FIRM_DATABASE.filter(f => f.market !== "custom").length;
  const totalPlans = FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0);
  return (
    <>
      <div className="oracle-rail">
        <div className="oracle-rail-inner">
          <div className="oracle-rail-brand">
            {t("app_title")}<span style={{ color: C.ash, margin: "0 10px", letterSpacing: 0 }}>·</span>
            <span style={{ fontFamily: "var(--cormorant)", fontStyle: "italic", fontWeight: 400,
                           color: C.boneDim, letterSpacing: 0.05, textTransform: "none", fontSize: 12 }}>
              monte carlo oracle
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {!welcomeOpen && (
              <button className="fg-btn-ghost" onClick={openWelcome} data-testid="btn-show-help">
                {t("welcome_show")}
              </button>
            )}
            <LangToggle lang={lang} setLang={setLang} />
            <div style={{ color: C.ash, fontSize: 10.5, letterSpacing: 0.2, fontFamily: "var(--mono)" }}>
              <span style={{ color: C.ember }}>✦</span> {totalFirms}·{totalPlans}
            </div>
          </div>
        </div>
      </div>
      <HeroSection lang={lang} />
    </>
  );
}

function HeroSection({ lang }) {
  const { t } = useT();
  const totalFirms = FIRM_DATABASE.filter(f => f.market !== "custom").length;
  const totalPlans = FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0);
  return (
    <section className="oracle-hero" data-testid="oracle-hero">
      <div className="oracle-hero-inner">
        <Sigil className="hero-sigil" size={120} color={C.ember} />
        <div className="oracle-roman" style={{ marginBottom: 10 }}>✦ oracvlvm statisticvm ✦</div>
        <h1 className="oracle-h1" data-testid="hero-title">{t("app_title")}</h1>
        <div className="oracle-sub" style={{ marginTop: 12 }}>
          <em>{t("hero_tagline")}</em>
        </div>
        <div className="hero-dot-row">※ ⚜ ※</div>
        <OrnateDivider color={C.ember} opacity={0.6} />
        <blockquote className="hero-quote">
          "{t("hero_quote")}"
          <span className="hero-quote-cite">— {t("hero_quote_cite")}</span>
        </blockquote>
        <div className="hero-meta">
          <span>{totalFirms} {t("hero_firms")}</span>
          <span style={{ color: C.ember }}>·</span>
          <span>{totalPlans} {t("hero_plans")}</span>
          <span style={{ color: C.ember }}>·</span>
          <span>{lang === "es" ? "client-side ritual" : "client-side rite"}</span>
        </div>
      </div>
    </section>
  );
}

function LangToggle({ lang, setLang }) {
  const active = { color: C.ember, fontWeight: 700 };
  const dim    = { color: C.ash, cursor: "pointer" };
  return (
    <div style={{ fontSize: 12, letterSpacing: 0.2, fontFamily: "var(--mono)" }}
         data-testid="lang-toggle">
      <span style={{ color: C.ash }}>[ </span>
      <span style={lang === "es" ? active : dim} onClick={() => setLang("es")}
            data-testid="lang-es" role="button" tabIndex={0}>
        {lang === "es" ? "ES" : "es"}
      </span>
      <span style={{ color: C.borderHot, margin: "0 6px" }}>·</span>
      <span style={lang === "en" ? active : dim} onClick={() => setLang("en")}
            data-testid="lang-en" role="button" tabIndex={0}>
        {lang === "en" ? "EN" : "en"}
      </span>
      <span style={{ color: C.ash }}> ]</span>
    </div>
  );
}

function WelcomeBlock({ onClose }) {
  const { t } = useT();
  return (
    <section style={{ maxWidth: 1600, margin: "16px auto 0", padding: "0 24px" }} data-testid="welcome-block">
      <div className="fg-panel fg-fadein" style={{ padding: 18, borderStyle: "dashed", borderColor: C.ember,
                                                     background: `${C.ember}06` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ color: C.ember, fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>
            › {t("welcome_title")}
          </div>
          <button className="fg-btn-ghost" onClick={onClose} data-testid="btn-welcome-close">
            ✕ {t("welcome_hide")}
          </button>
        </div>
        <div style={{ color: C.boneDim, fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
          {t("welcome_lead")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <div>
            <div style={{ color: C.ash, fontSize: 10.5, letterSpacing: 0.25, textTransform: "uppercase",
                          marginBottom: 6, fontWeight: 700 }}>{t("welcome_flow_title")}</div>
            <ol style={{ margin: 0, paddingLeft: 18, color: C.boneDim, fontSize: 12.5, lineHeight: 1.8 }}>
              <li>{t("welcome_flow_1")}</li>
              <li>{t("welcome_flow_2")}</li>
              <li>{t("welcome_flow_3")}</li>
              <li>{t("welcome_flow_4")}</li>
            </ol>
          </div>
          <div>
            <div style={{ color: C.ash, fontSize: 10.5, letterSpacing: 0.25, textTransform: "uppercase",
                          marginBottom: 6, fontWeight: 700 }}>{t("welcome_needs_title")}</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: C.boneDim, fontSize: 12.5, lineHeight: 1.8,
                         listStyle: "'› '" }}>
              <li>{t("welcome_needs_1")}</li>
              <li>{t("welcome_needs_2")}</li>
              <li>{t("welcome_needs_3")}</li>
              <li>{t("welcome_needs_4")}</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.borderHot}`,
                      color: C.ash, fontSize: 11.5, lineHeight: 1.6 }}>
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
        <div style={{ color: C.borderHot, letterSpacing: 0.3, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
          ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
        </div>
        <div style={{ color: C.ash, fontSize: 11, lineHeight: 1.8, marginTop: 10 }}>
          {t("footer_l1")}<br />
          {t("footer_l2")}<br />
          {t("footer_l3")}
        </div>
      </div>
    </footer>
  );
}

function StepHead({ n, title, sub, subtitle }) {
  const roman = ROMAN_PREFIX[n] ? `${ROMAN_PREFIX[n]} · ${ROMAN[n]}` : `${ROMAN[n]}`;
  return (
    <div style={{ marginBottom: 18, marginTop: 8 }}>
      <div className="oracle-roman" style={{ marginBottom: 6 }}>✦ {roman}</div>
      <h2 className="oracle-h2" style={{ fontSize: 24, marginBottom: 6 }}>{title}</h2>
      {subtitle && (
        <div className="oracle-sub" style={{ color: C.ash, fontSize: 13, marginBottom: 4 }}>
          <em>{subtitle}</em>
        </div>
      )}
      {sub && (
        <div style={{ color: C.boneDim, fontFamily: "var(--cormorant)", fontStyle: "italic",
                      fontSize: 14, marginTop: 6, letterSpacing: 0.02, lineHeight: 1.5 }}>
          {sub}
        </div>
      )}
      <OrnateDivider color={C.ember} opacity={0.5} />
    </div>
  );
}

// ─────────────────────────── Firm / Plan cards ───────────────────────────
function CustomFirstCard({ firm, selected, onClick }) {
  const { t } = useT();
  return (
    <div onClick={onClick} data-testid="firm-custom"
         className={`fg-panel fg-card custom-card ${selected ? "selected" : ""}`}
         style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12,
                  alignItems: "flex-start", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"
             style={{ color: C.ember, display: "block", flexShrink: 0, opacity: 0.85 }}>
          {/* Anvil/hammer custom sigil */}
          <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <path d="M18,38 L18,44 L46,44 L46,38 Q46,34 42,34 L22,34 Q18,34 18,38 Z"
                fill="none" stroke="currentColor" strokeWidth="1.25" />
          <path d="M12,34 L52,34" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
          <path d="M32,22 L32,34 M28,26 L36,26" stroke="currentColor" strokeWidth="1" opacity="0.9" />
          <text x="32" y="20" textAnchor="middle" fontFamily="Cinzel" fontSize="6"
                fill="currentColor" opacity="0.7">※</text>
        </svg>
        <div>
          <div className="oracle-roman" style={{ marginBottom: 4 }}>✦ vocatio propria</div>
          <div style={{ fontFamily: "var(--cinzel)", fontWeight: 900, color: C.bone,
                        fontSize: 18, letterSpacing: 0.18, textTransform: "uppercase" }}>
            {t("custom_card_title")}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: "var(--cormorant)", fontStyle: "italic", color: C.boneDim,
                    fontSize: 14, lineHeight: 1.6, maxWidth: 480 }}>
        {t("custom_card_desc")}
      </div>
      <div style={{ marginTop: 6, color: C.ember, fontFamily: "var(--cinzel)",
                    fontWeight: 600, fontSize: 11, letterSpacing: 0.35, textTransform: "uppercase" }}>
        → {t("custom_card_cta")}
      </div>
    </div>
  );
}

// Difficulty estimate from firm plans → 1..3 flames
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
    trailing_eod: "TRAILING·EOD", trailing_intraday: "TRAILING·INTRADAY", static: "STATIC"
  }[type] || type);
  const ddCol = (type) => ({
    trailing_eod: C.ember, trailing_intraday: C.flame, static: C.ash
  }[type] || C.ash);
  const stars = estimateDifficulty(firm);
  return (
    <div className={`fg-panel fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`firm-${firm.id}`}
         style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, minHeight: 150 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--cinzel)", fontWeight: 600, color: C.bone, fontSize: 14,
                        letterSpacing: 0.08, textTransform: "uppercase",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {firm.name}
          </div>
          <div className="difficulty-label" style={{ marginTop: 4 }}>
            <em>{firm.subtitle}</em>
          </div>
        </div>
        <Tag color={firm.badgeColor}>{firm.badge}</Tag>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 10, flexWrap: "wrap" }}>
        <span className="fg-rating" data-testid={`firm-${firm.id}-difficulty`}>
          {"✦".repeat(stars)}<span className="dim">{"✦".repeat(3 - stars)}</span>
        </span>
        <div style={{ display: "flex", gap: 10, fontSize: 10, letterSpacing: 0.15,
                      fontFamily: "var(--mono)" }}>
          {ddTypes.map(ty => (
            <span key={ty} style={{ color: ddCol(ty) }}>◆ {ddTag(ty)}</span>
          ))}
          {firm.allowsOvernight && <span style={{ color: C.boneDim }}>{t("overnight_badge")}</span>}
          {hasTwoPhase && <span style={{ color: C.flame }}>{t("two_phase_badge")}</span>}
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
  const ddCol = { trailing_eod: C.ember, trailing_intraday: C.flame, static: C.ash }[plan.ddType];
  return (
    <div className={`fg-panel fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`plan-${plan.planId}`}
         style={{ padding: 14, position: "relative" }}>
      {isPopular && (
        <span style={{ position: "absolute", top: -1, right: -1, fontSize: 9,
                       padding: "2px 8px", background: C.ember, color: C.bg,
                       fontWeight: 700, letterSpacing: 0.2 }}>{t("popular_badge")}</span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.bone, letterSpacing: -0.02 }}>
          {isCustom ? t("configure_word") : (plan.capital >= 1000 ? `$${(plan.capital / 1000).toFixed(0)}K` : fmtMoney(plan.capital))}
        </div>
        <div style={{ textAlign: "right", fontSize: 11 }}>
          {plan.feeType === "monthly" ? (
            <>
              <div style={{ color: C.flame, fontSize: 9, letterSpacing: 0.2 }}>{t("monthly_badge")}</div>
              <div style={{ color: C.bone, marginTop: 2 }}>${plan.fee}<span style={{ color: C.ash }}>/mo</span></div>
            </>
          ) : (
            <div style={{ color: C.bone }}>${plan.fee}</div>
          )}
        </div>
      </div>
      {!isCustom && (
        <>
          <div style={{ fontSize: 10.5, color: C.ash, marginTop: 4, letterSpacing: 0.1 }}>› {plan.label}</div>
          <div className="fg-row-divider" style={{ margin: "10px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
            <div>
              <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.2 }}>{t("summary_target")}</div>
              <div style={{ color: C.ember, marginTop: 2 }}>{fmtMoney(plan.target)}
                <span style={{ color: C.ash }}> · {tgtPct}%</span></div>
            </div>
            <div>
              <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.2 }}>{t("summary_dd")}</div>
              <div style={{ color: C.blood, marginTop: 2 }}>{fmtMoney(plan.ddValue)}
                <span style={{ color: C.ash }}> · {ddPct}%</span></div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10, letterSpacing: 0.15 }}>
            <span style={{ color: ddCol }}>◆ {ddTag}</span>
            {plan.phases === 2 && <span style={{ color: C.flame }}>{t("two_phase_badge")}</span>}
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
      <div className="fg-panel" style={{ padding: 16, borderColor: C.borderHot }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ color: C.ember, fontSize: 11, letterSpacing: 0.3, fontWeight: 700, textTransform: "uppercase" }}>
              › {t("account_summary_title")}
            </div>
            <div style={{ color: C.ash, fontSize: 11, marginTop: 3 }}>› {t("account_summary_intro")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.ash, fontSize: 10, letterSpacing: 0.25 }}>{t("selected_plan_label")}</div>
            <div style={{ color: C.bone, fontSize: 14, fontWeight: 700, marginTop: 3, letterSpacing: 0.02 }}>
              {firm.name.toUpperCase()}
              <span style={{ color: C.ash, margin: "0 8px" }}>·</span>
              {plan.label}
              {isModified && <span style={{ marginLeft: 8, color: C.flame, fontSize: 9,
                                             padding: "1px 5px", border: `1px solid ${C.flame}`,
                                             background: `${C.flame}15`, letterSpacing: 0.2 }}>
                {t("modified_badge")}
              </span>}
            </div>
          </div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", color: C.boneDim, fontSize: 12.5, lineHeight: 1.9 }}>
          {lines.map((l, i) => (
            <li key={i} style={{ borderBottom: i < lines.length - 1 ? `1px dashed ${C.border}` : "none",
                                 padding: "4px 0" }}>
              <span style={{ color: C.ember, marginRight: 8 }}>›</span>{l}
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
        <div style={{ padding: 8, borderLeft: `2px solid ${C.flame}`, background: `${C.flame}10`, marginTop: 8 }}>
          <div style={{ fontSize: 10, color: C.flame, letterSpacing: 0.3, marginBottom: 6, fontWeight: 700 }}>╳ PHASE·02</div>
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
  if (isModified) warns.push({ color: C.flame, msg: t("warn_modified") });
  if (plan.feeType === "monthly") warns.push({ color: C.ember, msg: t("warn_monthly_fee", { fee: fmtMoney(plan.fee) }) });
  if (firm.id === "apex_eod" || firm.id === "apex_intraday") warns.push({ color: C.flame, msg: t("warn_apex") });
  if (firm.id === "topstep") warns.push({ color: C.boneDim, msg: t("warn_topstep") });
  if (plan.consistency && plan.consistencyType === "vs_target") warns.push({ color: C.ember, msg: t("warn_cons_vs_target", { pct: (plan.consistency * 100).toFixed(0) }) });
  if (plan.consistency && plan.consistencyType === "vs_total")  warns.push({ color: C.ember, msg: t("warn_cons_vs_total",  { pct: (plan.consistency * 100).toFixed(0) }) });
  if (plan.phases === 2 && plan.phase2) warns.push({ color: C.flame, msg: t("warn_two_phase", { t1: fmtMoney(plan.target), t2: fmtMoney(plan.phase2.target) }) });
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
      <div style={{ fontSize: 26, color: C.flame, letterSpacing: 0.3 }}>
        [ <span className="fg-dots">···</span>&nbsp;{t("btn_running").replace(/[[\]]/g, "").trim().toUpperCase()}&nbsp;<span className="fg-dots">···</span> ]
      </div>
      <div style={{ color: C.ash, marginTop: 14, fontSize: 11, letterSpacing: 0.2 }}>
        › {t("loading_msg", { n: "monte-carlo" })}
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="fg-panel" style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 32, color: C.borderHot }}>◇</div>
      <div style={{ marginTop: 12, fontSize: 13, color: C.boneDim }}>
        {t("empty_configure")}<span style={{ color: C.ember }}>{t("btn_run")}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.ash }}>› {t("empty_render_here")}</div>
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
  const passColor = passing ? C.ember : C.blood;
  const evColor = r.ev >= 0 ? C.ember : C.blood;
  const failTotal = r.pDD + r.pTimeout + r.pDLL;

  let fourth;
  if (r.pTimeout > 0.01) fourth = { label: t("kpi_p_timeout"), value: fmtPct(r.pTimeout), color: C.flame, sub: t("kpi_p_timeout_sub") };
  else if (r.pDLL > 0.01) fourth = { label: t("kpi_p_dll"),     value: fmtPct(r.pDLL),     color: C.bloodDark, sub: t("kpi_p_dll_sub") };
  else                    fourth = { label: t("kpi_p_fail"),    value: fmtPct(failTotal),  color: C.blood, sub: t("kpi_p_fail_sub") };

  const ROI = r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : 0;

  const distData = [
    { name: "PASS", pct: +(r.pPass * 100).toFixed(2), fill: C.ember },
    { name: "DD",   pct: +(r.pDD   * 100).toFixed(2), fill: C.blood },
  ];
  if (r.pTimeout > 0) distData.push({ name: "TIMEOUT", pct: +(r.pTimeout * 100).toFixed(2), fill: C.flame });
  if (r.pDLL     > 0) distData.push({ name: "DLL",     pct: +(r.pDLL     * 100).toFixed(2), fill: C.bloodDark });

  // Radial layout — 3x3 grid with 6 peripheral KPIs + center
  const kpiTL = { label: t("kpi_mean_days"),
                  value: r.nPass > 0 ? `${Math.round(r.meanPass)}d` : "—",
                  sub:   r.nPass > 0 ? t("kpi_mean_days_sub_ok", { x: Math.round(r.medianPass) }) : t("kpi_mean_days_sub_none"),
                  color: C.bone, testId: "kpi-meanpass" };
  const kpiTC = { label: fourth.label, value: fourth.value, sub: fourth.sub, color: fourth.color, testId: "kpi-fourth" };
  const kpiTR = { label: t("kpi_p_dd"), value: fmtPct(r.pDD), sub: t("kpi_p_dd_sub"), color: C.blood, testId: "kpi-pdd" };
  const kpiBL = { label: t("kpi_bankroll"),
                  value: r.passEssentiallyZero ? "—" : fmtMoney(r.br95),
                  sub:   r.passEssentiallyZero ? t("kpi_bankroll_sub_zero") : t("kpi_bankroll_sub_ok", { x: fmtInt(r.n95) }),
                  color: C.ember, testId: "kpi-br95" };
  const kpiBC = { label: t("kpi_p90_days"),
                  value: r.nPass > 0 ? `${Math.round(r.p90Pass)}d` : "—",
                  sub: t("kpi_p90_days_sub"), color: C.ember, testId: "kpi-p90pass" };
  const kpiBR = { label: t("kpi_ev"),
                  value: (r.ev >= 0 ? "+" : "-") + fmtMoney(Math.abs(r.ev)),
                  sub: t("kpi_ev_sub", { x: fmtMoney(r.avgCost) }),
                  color: evColor, testId: "kpi-ev" };

  return (
    <div data-testid="results-dashboard">
      <div className="oracle-chapter">
        <div className="tag">✦ {t("reveal_tag")} ✦</div>
        <div className="title">{t("reveal_title")}</div>
      </div>

      <div className="oracle-revelation kpi-stagger" data-testid="oracle-revelation">
        <OracleKpi {...kpiTL} />
        <OracleKpi {...kpiTC} />
        <OracleKpi {...kpiTR} />
        <OracleKpi {...kpiBL} />
        <div className={`oracle-kpi-center ${passing ? "passing" : "failing"}`} data-testid="kpi-ppass">
          <div className="lbl">{t("kpi_p_pass")}</div>
          <div className="big" style={{ color: passColor }}>{fmtPct(r.pPass)}</div>
          <div className="sub">
            <em>{t("kpi_p_pass_sub", { x: (r.ruinaMin * 100).toFixed(1) })}</em>
          </div>
        </div>
        <OracleKpi {...kpiBC} />
        <OracleKpi {...kpiBR} />
      </div>

      <div className="oracle-chapter">
        <div className="tag">‡ {t("chart_chapter")} ‡</div>
        <div className="title">{t("chart_chapter_title")}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginBottom: 14 }}>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-dist">
          <ChartTitle title={t("chart_result_dist")} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData} margin={{ top: 20, right: 10, left: 4, bottom: 0 }}>
              <XAxis dataKey="name" stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} unit="%" />
              <Tooltip content={<CTooltip />} cursor={{ fill: `${C.ember}10` }} />
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
                <XAxis dataKey="day" stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} />
                <YAxis stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.ember}10` }} />
                <ReferenceLine x={Math.round(r.medianPass)} stroke={C.flame} strokeDasharray="2 3" />
                <Bar dataKey="pct" fill={C.ember} />
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
                <XAxis dataKey="day" stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} />
                <YAxis stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.blood}10` }} />
                <ReferenceLine x={Math.round(r.medianFail)} stroke={C.ember} strokeDasharray="2 3" />
                <Bar dataKey="pct" fill={C.blood} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      <div className="oracle-chapter">
        <div className="tag">§ {t("ledger_chapter")} §</div>
        <div className="title">{t("ledger_chapter_title")}</div>
      </div>

      <div className="oracle-ledger" data-testid="stats-row">
        <div className="row"><span className="k">{t("stat_p_pass")}</span>
          <span className="v" style={{ color: passColor }}>{fmtPct(r.pPass)}</span></div>
        <div className="row"><span className="k">{t("stat_ev_net")}</span>
          <span className="v" style={{ color: evColor }}>{(r.ev >= 0 ? "+" : "") + fmtMoney(r.ev)}</span></div>
        <div className="row"><span className="k">{t("stat_br99")}</span>
          <span className="v" style={{ color: C.ember }}>{r.passEssentiallyZero ? "—" : fmtMoney(r.br99)}</span></div>
        <div className="row"><span className="k">{t("stat_att99")}</span>
          <span className="v">{r.passEssentiallyZero ? "—" : fmtInt(r.n99)}</span></div>
        <div className="row"><span className="k">{t("stat_roi")}</span>
          <span className="v" style={{ color: ROI >= 0 ? C.ember : C.blood }}>{ROI.toFixed(0)}%</span></div>
        <div className="row"><span className="k">{t("stat_split")}</span>
          <span className="v">{(plan.profitSplit * 100).toFixed(0)}%</span></div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dotted ${C.borderHot}`,
                      color: C.ash, fontSize: 10.5, letterSpacing: 0.1, fontFamily: "var(--mono)" }}>
          {t("stat_footer", { sims: r.nSims.toLocaleString("en-US"), pass: r.nPass, dd: r.nDD, to: r.nTimeout, dll: r.nDLL })}
          <span style={{ color: C.ember }}>{fmtMoney(r.payout)}</span>
        </div>
      </div>
    </div>
  );
}

function ChartTitle({ title, caption }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: C.bone, fontSize: 11, fontWeight: 700, letterSpacing: 0.25, textTransform: "uppercase" }}>{title}</div>
      {caption && <div style={{ color: C.ash, fontSize: 10, marginTop: 3, letterSpacing: 0.08 }}>› {caption}</div>}
    </div>
  );
}
function EmptyChart() {
  const { t } = useT();
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.borderHot, fontSize: 11, letterSpacing: 0.2 }}>{t("chart_empty")}</div>
  );
}
function Stat({ label, value, color }) {
  return (
    <div style={{ padding: "0 14px" }}>
      <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.25 }}>{label}</div>
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
        <div style={{ color: C.flame, fontSize: 12, fontWeight: 700, letterSpacing: 0.25 }}>
          ╳ {t("compare_rack_title")} <span style={{ color: C.ash, fontWeight: 400 }}>· {t("compare_rack_slots", { n: slots.length })}</span>
        </div>
        <button className="fg-btn-ghost" onClick={onClear} data-testid="btn-compare-clear">{t("btn_compare_clear")}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 12 }}>
        {slots.map((s, i) => (
          <div key={s.id} className="fg-panel"
               style={{ padding: 10, borderColor: s.results ? C.ember : C.border }}
               data-testid={`compare-slot-${i}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.3 }}>{t("compare_slot", { n: String(i + 1).padStart(2, "0") })}</div>
                <div style={{ color: C.bone, fontSize: 12, fontWeight: 700, marginTop: 2, overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.firmName}</div>
                <div style={{ color: C.boneDim, fontSize: 11, marginTop: 2 }}>› {s.planLabel}</div>
              </div>
              <button className="fg-btn-ghost" style={{ padding: "2px 6px", fontSize: 11 }}
                      onClick={() => onRemove(s.id)} data-testid={`btn-compare-remove-${i}`}>✕</button>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10, color: C.ash, letterSpacing: 0.1 }}>
              <span>cap · <span style={{ color: C.bone }}>{fmtMoney(s.plan.capital)}</span></span>
              <span>tgt · <span style={{ color: C.ember }}>{fmtMoney(s.plan.target)}</span></span>
              <span>dd · <span style={{ color: C.blood }}>{fmtMoney(s.plan.ddValue)}</span></span>
            </div>
            {s.results && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}`, fontSize: 10 }}>
                <div style={{ color: C.ash }}>p(pass) · <span style={{ color: C.ember }}>{fmtPct(s.results.pPass)}</span></div>
                <div style={{ color: C.ash }}>ev · <span style={{ color: s.results.ev >= 0 ? C.ember : C.blood }}>
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
        <div style={{ color: C.ash, fontSize: 10.5, marginTop: 10, letterSpacing: 0.15, textAlign: "center" }}>
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
  const headerStyle = { color: C.ash, fontSize: 10, padding: "10px 10px", letterSpacing: 0.25, textAlign: "right",
                        borderBottom: `1px dashed ${C.borderHot}`, fontWeight: 600 };
  const cellStyle = { padding: "10px 10px", fontSize: 12, textAlign: "right", borderBottom: `1px dashed ${C.border}` };
  const winner = (isBest) => isBest
    ? { color: C.ember, fontWeight: 700, textShadow: `0 0 8px ${C.ember}55` }
    : {};
  return (
    <div className="fg-panel" style={{ padding: 16, marginBottom: 16 }} data-testid="compare-results">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: C.bone, fontSize: 13, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" }}>
            {t("compare_results_title")}
          </div>
          <div style={{ color: C.ash, fontSize: 11, marginTop: 3 }}>› {t("compare_results_sub")}</div>
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
                  <span style={{ color: i === 0 ? C.ember : C.ash, marginRight: 10, fontWeight: 700 }}>
                    {i === 0 ? "★" : `#${i + 1}`}
                  </span>
                  <span style={{ color: C.bone }}>{r.name}</span>
                </td>
                <td style={{ ...cellStyle, ...winner(r.pPass === bestPPass) }}>{fmtPct(r.pPass)}</td>
                <td style={{ ...cellStyle, color: r.ev >= 0 ? C.ember : C.blood, ...winner(r.ev === bestEV) }}>
                  {(r.ev >= 0 ? "+" : "") + fmtMoney(r.ev)}
                </td>
                <td style={{ ...cellStyle, color: C.boneDim }}>{fmtMoney(r.avgCost)}</td>
                <td style={{ ...cellStyle, ...winner(r.meanPass !== null && r.meanPass === bestMean) }}>
                  {r.meanPass !== null ? Math.round(r.meanPass) + "d" : "—"}
                </td>
                <td style={{ ...cellStyle, color: C.boneDim }}>
                  {r.p90 !== null ? Math.round(r.p90) + "d" : "—"}
                </td>
                <td style={{ ...cellStyle, ...winner(r.br95 !== null && r.br95 === bestBR95) }}>
                  {r.br95 !== null ? fmtMoney(r.br95) : "—"}
                </td>
                <td style={{ ...cellStyle, color: r.roi >= 0 ? C.ember : C.blood, ...winner(r.roi === bestROI) }}>
                  {r.roi.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, padding: "10px 12px", borderLeft: `2px solid ${C.ember}`,
                    background: `${C.ember}08`, fontSize: 12, color: C.boneDim, lineHeight: 1.6 }}>
        <span style={{ color: C.ember, fontWeight: 700, marginRight: 6 }}>{t("compare_winner_prefix")}</span>
        <b style={{ color: C.bone }}>{ranked[0].name}</b>
        <span style={{ color: C.ash }}>{t("compare_winner_ev")}</span>
        <span style={{ color: C.ember }}>{(ranked[0].ev >= 0 ? "+" : "") + fmtMoney(ranked[0].ev)}</span>
        <span style={{ color: C.ash }}>{t("compare_winner_ppass")}</span>
        <span style={{ color: C.ember }}>{fmtPct(ranked[0].pPass)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────── CSV modal ───────────────────────────
function CsvModal({ onClose, onApply }) {
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

  // Map error text
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
        background: C.panel, padding: 20, borderColor: C.ember,
        boxShadow: "0 0 40px rgba(255,184,0,0.25)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: C.bone, fontSize: 14, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" }}>
            {t("csv_title")}
          </div>
          <button className="fg-btn-ghost" onClick={onClose} data-testid="btn-csv-close">{t("btn_csv_close")}</button>
        </div>
        <div style={{ color: C.ash, fontSize: 11, marginBottom: 14, lineHeight: 1.6 }}>
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
              <div style={{ color: C.blood, fontSize: 12, padding: "8px 10px",
                            border: `1px solid ${C.blood}`, background: `${C.blood}10` }}>// {errorMsg}</div>
            )}
            {preview?.stats && (
              <>
                <div style={{ padding: 12, background: C.bg, border: `1px dashed ${C.border}`, marginBottom: 10 }}>
                  <div style={{ color: C.ash, fontSize: 10, letterSpacing: 0.3, marginBottom: 6 }}>{t("csv_detected_title")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, fontSize: 11 }}>
                    <StatMini label={t("csv_samples")}  v={preview.stats.nSamples} c={C.bone} />
                    <StatMini label={t("csv_wins")}     v={preview.stats.nWins}    c={C.ember} />
                    <StatMini label={t("csv_losses")}   v={preview.stats.nLosses}  c={C.blood} />
                    <StatMini label={t("csv_total")}    v={fmtMoney(preview.stats.totalPnl)} c={preview.stats.totalPnl >= 0 ? C.ember : C.blood} />
                    <StatMini label={t("csv_avg_day")}  v={fmtMoney(preview.stats.avgDay)}   c={preview.stats.avgDay >= 0 ? C.ember : C.blood} />
                  </div>
                </div>
                <div style={{ padding: 12, background: C.bg, border: `1px dashed ${C.ember}`, marginBottom: 14 }}>
                  <div style={{ color: C.ember, fontSize: 10, letterSpacing: 0.3, marginBottom: 6 }}>{t("csv_calibrated_title")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, fontSize: 11 }}>
                    <StatMini label={t("field_wr")}        v={preview.strategy.wr.toFixed(3)} c={C.bone} />
                    <StatMini label={t("field_mu_win")}    v={fmtMoney(preview.strategy.muWin)}     c={C.ember} />
                    <StatMini label={t("field_sigma_win")} v={fmtMoney(preview.strategy.sigmaWin)}  c={C.boneDim} />
                    <StatMini label={t("field_mu_loss")}   v={fmtMoney(preview.strategy.muLoss)}    c={C.blood} />
                    <StatMini label={t("field_sigma_loss")} v={fmtMoney(preview.strategy.sigmaLoss)} c={C.boneDim} />
                    <StatMini label={t("field_tail_prob")} v={preview.strategy.tailProb.toFixed(4)} c={C.flame} />
                    <StatMini label={t("field_tail_mult")} v={preview.strategy.tailMult.toFixed(3)} c={C.flame} />
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

function StatMini({ label, v, c }) {
  return (
    <div>
      <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.25 }}>{label}</div>
      <div style={{ color: c, marginTop: 3, fontWeight: 700 }}>{v}</div>
    </div>
  );
}

export default App;
