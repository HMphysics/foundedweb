import React, { useState, useMemo, useCallback } from "react";
import "./App.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";
import { FIRM_DATABASE, STRATEGY_DEFAULTS } from "./firmDatabase";
import { runMonteCarlo } from "./monteCarlo";

// ─────────────────────────── FORGE palette ───────────────────────────
const C = {
  bg: "#0A0604", panel: "#120A06", elev: "#1A0E08",
  border: "#2A1810", borderHot: "#4A2818",
  ember: "#FFB800", flame: "#FF4500", blood: "#C8102E", bloodDark: "#8B0000",
  char: "#3D1F0F", ash: "#8B7355",
  bone: "#E8DCC4", boneDim: "#B8A888",
};

const DD_META = {
  trailing_eod:      { tag: "TRAILING·EOD",      color: C.ember },
  trailing_intraday: { tag: "TRAILING·INTRADAY", color: C.flame },
  static:            { tag: "STATIC",            color: C.ash   },
};

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

// ─────────────────────────── Atoms ───────────────────────────
function Tag({ children, color = C.boneDim }) {
  return <span className="fg-tag" style={{ color }}>{children}</span>;
}

function Section({ label, id }) {
  return (
    <div className="fg-sec" id={id}>
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

function NumField({ label, value, onChange, step = 1, disabled = false, prefix, testId, width = 120 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
      <label className="fg-label" style={{ flex: 1 }}>{label}</label>
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

function SelectField({ label, value, onChange, options, disabled = false, testId }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
      <label className="fg-label" style={{ flex: 1 }}>{label}</label>
      <select className="fg-select" style={{ width: 120 }} value={value ?? ""} disabled={disabled}
              onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
              data-testid={testId}>
        {options.map(o => <option key={o.value ?? "null"} value={o.value ?? ""}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleRow({ label, on, onToggle, testId, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label className="fg-label">{label}</label>
        <Toggle on={on} onChange={onToggle} testId={testId} />
      </div>
      {on && <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `1px dashed ${C.borderHot}` }}>{children}</div>}
    </div>
  );
}

function Kpi({ label, value, sub, color = C.bone, testId }) {
  return (
    <div className="fg-panel" style={{ padding: "14px 16px" }} data-testid={testId}>
      <div className="fg-label" style={{ marginBottom: 10, color: C.ash }}>› {label}</div>
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

// ─────────────────────────── App ───────────────────────────
function App() {
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

  const selectedFirm = useMemo(
    () => FIRM_DATABASE.find(f => f.id === selectedFirmId) || null,
    [selectedFirmId]
  );
  const presetPlan = useMemo(() => {
    if (!selectedFirm || !selectedPlanId) return null;
    return selectedFirm.plans.find(p => p.planId === selectedPlanId) || null;
  }, [selectedFirm, selectedPlanId]);
  const isModified = useMemo(() => isPlanModified(planDraft, presetPlan), [planDraft, presetPlan]);

  const filteredFirms = useMemo(() => {
    if (marketFilter === "ALL") return FIRM_DATABASE;
    const map = { FUTURES: "futures", FOREX: "forex", CUSTOM: "custom" };
    return FIRM_DATABASE.filter(f => f.market === map[marketFilter]);
  }, [marketFilter]);

  const selectFirm = useCallback((id) => {
    setSelectedFirmId(id);
    setSelectedPlanId(null);
    setPlanDraft(null);
    setResults(null);
    setShowAccountEditor(false);
    setCustomUnlocked(id === "custom");
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

  return (
    <div style={{ minHeight: "100vh", color: C.boneDim }} data-testid="app-root">
      <Header />

      {/* STEP 1 */}
      <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }}>
        <StepHead n={1} title="SELECT · PROP FIRM" sub="filter by market or pick [ CUSTOM ] to forge your own" />

        <div style={{ display: "flex", gap: 0, alignItems: "center", marginBottom: 18, color: C.ash, fontSize: 12 }}
             data-testid="market-filters">
          <span style={{ marginRight: 10 }}>‹</span>
          {["ALL", "FUTURES", "FOREX", "CUSTOM"].map((f, i) => (
            <React.Fragment key={f}>
              {i > 0 && <span style={{ margin: "0 10px", color: C.borderHot }}>·</span>}
              <button className={`fg-pill ${marketFilter === f ? "active" : ""}`}
                      onClick={() => setMarketFilter(f)}
                      data-testid={`filter-${f.toLowerCase()}`}>{f}</button>
            </React.Fragment>
          ))}
          <span style={{ marginLeft: 10 }}>›</span>
        </div>

        <div className="fg-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }} data-testid="firm-grid">
          {filteredFirms.map(firm => (
            <FirmCard key={firm.id} firm={firm}
                      selected={firm.id === selectedFirmId}
                      onClick={() => selectFirm(firm.id)} />
          ))}
        </div>
      </section>

      {/* STEP 2 */}
      {selectedFirm && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 0" }} className="fg-fadein">
          <StepHead n={2} title={`SELECT · PLAN — ${selectedFirm.name.toUpperCase()}`} sub={`› ${selectedFirm.subtitle}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }} data-testid="plan-grid">
            {selectedFirm.plans.map(plan => (
              <PlanCard key={plan.planId} plan={plan} firm={selectedFirm}
                        selected={plan.planId === selectedPlanId}
                        onClick={() => selectPlan(plan)} />
            ))}
          </div>
        </section>
      )}

      {/* STEP 3 + RESULTS */}
      {planDraft && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "18px 24px 40px" }} className="fg-fadein">
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 340, minWidth: 300, flexShrink: 0 }}>
              <StepHead n={3} title="FORGE · STRATEGY & FIRE" />

              <div className="fg-panel" style={{ padding: 14, marginBottom: 12 }}>
                <Section label="A · P&L DISTRIBUTION" />
                <NumField label="win rate"   value={strategy.wr}        step={0.01} onChange={v => setStrategy({ ...strategy, wr: v })}        testId="strat-wr" />
                <NumField label="μ win"      prefix="$" value={strategy.muWin}     onChange={v => setStrategy({ ...strategy, muWin: v })}     testId="strat-muwin" />
                <NumField label="σ win"      prefix="$" value={strategy.sigmaWin}  onChange={v => setStrategy({ ...strategy, sigmaWin: v })}  testId="strat-sigmawin" />
                <NumField label="μ loss"     prefix="$" value={strategy.muLoss}    onChange={v => setStrategy({ ...strategy, muLoss: v })}    testId="strat-muloss" />
                <NumField label="σ loss"     prefix="$" value={strategy.sigmaLoss} onChange={v => setStrategy({ ...strategy, sigmaLoss: v })} testId="strat-sigmaloss" />
                <NumField label="p(spike)"   value={strategy.tailProb} step={0.001} onChange={v => setStrategy({ ...strategy, tailProb: v })} testId="strat-tailprob" />
                <NumField label="spike mult" value={strategy.tailMult} step={0.01} onChange={v => setStrategy({ ...strategy, tailMult: v })}  testId="strat-tailmult" />
              </div>

              <details className="fg-panel" style={{ padding: 12, marginBottom: 12 }} open={showMaeBlock}
                       onToggle={(e) => setShowMaeBlock(e.target.open)}>
                <summary style={{ fontSize: 10.5, letterSpacing: 0.3, textTransform: "uppercase",
                                  color: C.ash, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>§ B · MAE INTRADAY <span style={{ color: C.borderHot }}>(optional)</span></span>
                  <span>{showMaeBlock ? "▾" : "▸"}</span>
                </summary>
                <div style={{ marginTop: 10 }}>
                  <NumField label="mae win"  value={strategy.maeWin}  step={0.01} onChange={v => setStrategy({ ...strategy, maeWin: v })}  testId="strat-maewin" />
                  <NumField label="mae loss" value={strategy.maeLoss} step={0.01} onChange={v => setStrategy({ ...strategy, maeLoss: v })} testId="strat-maeloss" />
                </div>
              </details>

              <div className="fg-panel" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                              marginBottom: showAccountEditor ? 10 : 0 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: 0.3, textTransform: "uppercase",
                                color: C.ash, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>§ C · ACCOUNT</span>
                    {isModified && <span style={{ color: C.flame, fontSize: 9, letterSpacing: 0.2, padding: "1px 5px",
                                                   border: `1px solid ${C.flame}`, background: `${C.flame}15` }}>◆ MODIFIED</span>}
                  </div>
                  {selectedFirm.id !== "custom" && (
                    <button className="fg-btn-ghost"
                            onClick={() => { setShowAccountEditor(v => !v); setCustomUnlocked(true); }}
                            data-testid="btn-edit-account">
                      {showAccountEditor ? "close" : "† edit"}
                    </button>
                  )}
                </div>
                {(showAccountEditor || selectedFirm.id === "custom") && (
                  <AccountEditor draft={planDraft} onChange={updateDraft} onPhase2Change={updatePhase2}
                                 unlocked={customUnlocked || selectedFirm.id === "custom"}
                                 onResetToPreset={() => presetPlan && selectPlan(presetPlan)} />
                )}
              </div>

              <div className="fg-panel" style={{ padding: 14, marginBottom: 14 }}>
                <Section label="D · SIMULATION" />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label className="fg-label">n sims</label>
                  <span style={{ color: C.ember, fontSize: 12 }}>{nSims.toLocaleString("en-US")}</span>
                </div>
                <input type="range" className="fg-range" min={1000} max={25000} step={1000}
                       value={nSims} onChange={(e) => setNSims(parseInt(e.target.value))}
                       data-testid="sim-nsims" />
              </div>

              <button className={`fg-btn ${loading ? "loading" : ""}`}
                      onClick={handleRun} disabled={!planDraft || loading}
                      data-testid="btn-run">
                {loading
                  ? <>[ <span className="fg-dots">···</span>&nbsp;heating&nbsp;<span className="fg-dots">···</span> ]</>
                  : "[ ⌁ IGNITE ]"}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 300 }}>
              <ResultsPanel results={results} loading={loading}
                            plan={planDraft} firm={selectedFirm} isModified={isModified} />
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

// ─────────────────────────── Header / Footer ───────────────────────────
function Header() {
  const totalFirms = FIRM_DATABASE.filter(f => f.market !== "custom").length;
  const totalPlans = FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0);
  return (
    <header style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.border}`,
                     background: `linear-gradient(180deg, ${C.panel} 0%, transparent 100%)` }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ color: C.borderHot, letterSpacing: 0, fontSize: 10, overflow: "hidden", whiteSpace: "nowrap" }}>
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: C.bone, fontWeight: 800, fontSize: 20, letterSpacing: "0.05em" }}>
              <span style={{ color: C.ember, marginRight: 10, fontSize: 22 }}>⌁</span>
              PROP FORGE
              <span style={{ color: C.ash, margin: "0 10px" }}>·</span>
              <span style={{ color: C.boneDim, fontSize: 14 }}>MONTE CARLO SIMULATOR</span>
            </div>
            <div style={{ color: C.ash, fontSize: 11, marginTop: 4, letterSpacing: 0.1 }}>
              › strategy stress-testing for prop firm evaluations
            </div>
          </div>
          <div style={{ textAlign: "right", color: C.ash, fontSize: 10.5, letterSpacing: 0.15 }}>
            <div><span style={{ color: C.ember }}>●</span> LIVE · CLIENT-SIDE</div>
            <div style={{ marginTop: 4 }}>{totalFirms} firms · {totalPlans} plans · v3</div>
          </div>
        </div>
        <div style={{ color: C.borderHot, letterSpacing: 0, fontSize: 10, overflow: "hidden", whiteSpace: "nowrap" }}>
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "28px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ color: C.borderHot, letterSpacing: 0.3, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
          ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
        </div>
        <div style={{ color: C.ash, fontSize: 11, lineHeight: 1.8, marginTop: 10 }}>
          // educational simulation · data verified apr 2026<br />
          // firm rules change without notice · verify official sources before purchasing any challenge<br />
          // results depend on input parameters · this is not financial advice
        </div>
      </div>
    </footer>
  );
}

function StepHead({ n, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ color: C.flame, fontSize: 11, letterSpacing: 0.25, fontWeight: 700 }}>
          ‡ STEP·{String(n).padStart(2, "0")}
        </span>
        <h2 style={{ margin: 0, color: C.bone, fontSize: 16, fontWeight: 700,
                     letterSpacing: 0.05, textTransform: "uppercase" }}>
          {title}
        </h2>
      </div>
      {sub && <div style={{ color: C.ash, fontSize: 11, marginTop: 4, letterSpacing: 0.1 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────── Firm / Plan cards ───────────────────────────
function FirmCard({ firm, selected, onClick }) {
  const hasTwoPhase = firm.plans.some(p => p.phases === 2);
  const ddTypes = [...new Set(firm.plans.map(p => p.ddType))];
  return (
    <div className={`fg-panel fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`firm-${firm.id}`}
         style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, minHeight: 130 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: C.bone, fontWeight: 700, fontSize: 14, letterSpacing: 0.02,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {firm.name}
          </div>
          <div style={{ color: C.ash, fontSize: 11, marginTop: 2 }}>› {firm.subtitle}</div>
        </div>
        <Tag color={firm.badgeColor}>{firm.badge}</Tag>
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: 10, fontSize: 10, letterSpacing: 0.15 }}>
        {ddTypes.map(t => (
          <span key={t} style={{ color: DD_META[t]?.color ?? C.ash }}>
            ◆ {DD_META[t]?.tag ?? t}
          </span>
        ))}
        {firm.allowsOvernight && <span style={{ color: C.boneDim }}>◇ OVERNIGHT</span>}
        {hasTwoPhase && <span style={{ color: C.flame }}>╳ 2·PHASE</span>}
      </div>
    </div>
  );
}

function PlanCard({ plan, firm, selected, onClick }) {
  const isPopular = plan.capital === 50000 && firm.id !== "custom";
  const isCustom = firm.id === "custom";
  const ddPct = ((plan.ddValue / plan.capital) * 100).toFixed(1);
  const tgtPct = ((plan.target / plan.capital) * 100).toFixed(1);
  return (
    <div className={`fg-panel fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`plan-${plan.planId}`}
         style={{ padding: 14, position: "relative" }}>
      {isPopular && (
        <span style={{ position: "absolute", top: -1, right: -1, fontSize: 9,
                       padding: "2px 8px", background: C.ember, color: C.bg,
                       fontWeight: 700, letterSpacing: 0.2 }}>★ POPULAR</span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.bone, letterSpacing: -0.02 }}>
          {isCustom ? "› configure" : (plan.capital >= 1000 ? `$${(plan.capital / 1000).toFixed(0)}K` : fmtMoney(plan.capital))}
        </div>
        <div style={{ textAlign: "right", fontSize: 11 }}>
          {plan.feeType === "monthly" ? (
            <>
              <div style={{ color: C.flame, fontSize: 9, letterSpacing: 0.2 }}>MONTHLY</div>
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
              <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.2 }}>TARGET</div>
              <div style={{ color: C.ember, marginTop: 2 }}>{fmtMoney(plan.target)}
                <span style={{ color: C.ash }}> · {tgtPct}%</span></div>
            </div>
            <div>
              <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.2 }}>DRAWDOWN</div>
              <div style={{ color: C.blood, marginTop: 2 }}>{fmtMoney(plan.ddValue)}
                <span style={{ color: C.ash }}> · {ddPct}%</span></div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10, letterSpacing: 0.15 }}>
            <span style={{ color: DD_META[plan.ddType]?.color }}>◆ {DD_META[plan.ddType]?.tag}</span>
            {plan.phases === 2 && <span style={{ color: C.flame }}>╳ 2·PHASE</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────── Account editor ───────────────────────────
function AccountEditor({ draft, onChange, onPhase2Change, unlocked, onResetToPreset }) {
  const d = draft;
  return (
    <div>
      <NumField label="capital" prefix="$" value={d.capital} onChange={v => onChange({ capital: v })} disabled={!unlocked} testId="acc-capital" />
      <NumField label="target"  prefix="$" value={d.target}  onChange={v => onChange({ target: v })}  disabled={!unlocked} testId="acc-target" />
      <SelectField label="dd type" value={d.ddType} disabled={!unlocked}
                   options={[
                     { value: "trailing_eod",      label: "Trailing EOD" },
                     { value: "trailing_intraday", label: "Trailing Intraday" },
                     { value: "static",            label: "Static" },
                   ]}
                   onChange={v => onChange({ ddType: v })} testId="acc-ddtype" />
      <NumField label="dd $" prefix="$" value={d.ddValue} onChange={v => onChange({ ddValue: v })} disabled={!unlocked} testId="acc-ddvalue" />
      {d.ddType !== "static" && (
        <SelectField label="floor lock" value={d.floorLock || "at_capital"} disabled={!unlocked}
                     options={[
                       { value: "none",                 label: "None" },
                       { value: "at_capital",           label: "At capital" },
                       { value: "at_target_level",      label: "At target" },
                       { value: "at_capital_plus_100",  label: "Cap + $100" },
                     ]}
                     onChange={v => onChange({ floorLock: v })} testId="acc-floorlock" />
      )}

      <div className="fg-row-divider" />

      <ToggleRow label="daily loss" on={d.dailyLoss !== null && d.dailyLoss !== undefined}
                 onToggle={v => onChange({ dailyLoss: v ? (d.dailyLoss ?? 1000) : null })}
                 testId="acc-dll-toggle">
        <NumField label="dll $" prefix="$" value={d.dailyLoss} onChange={v => onChange({ dailyLoss: v })} disabled={!unlocked} testId="acc-dllvalue" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <label className="fg-label">dll fatal</label>
          <Toggle on={!!d.dailyLossIsFatal} onChange={v => onChange({ dailyLossIsFatal: v })} testId="acc-dll-fatal" />
        </div>
      </ToggleRow>

      <div className="fg-row-divider" />

      <ToggleRow label="consistency" on={d.consistency !== null && d.consistency !== undefined}
                 onToggle={v => onChange({ consistency: v ? (d.consistency ?? 0.3) : null })}
                 testId="acc-cons-toggle">
        <NumField label="% (0-1)" value={d.consistency} step={0.01} onChange={v => onChange({ consistency: v })} disabled={!unlocked} testId="acc-consvalue" />
        <SelectField label="type" value={d.consistencyType || "vs_total"} disabled={!unlocked}
                     options={[
                       { value: "vs_total",  label: "vs total" },
                       { value: "vs_target", label: "vs target" },
                     ]}
                     onChange={v => onChange({ consistencyType: v })} testId="acc-constype" />
      </ToggleRow>

      <div className="fg-row-divider" />

      <NumField label="min days" value={d.minDays || 0} onChange={v => onChange({ minDays: v ?? 0 })} disabled={!unlocked} testId="acc-mindays" />
      <ToggleRow label="max days" on={d.maxDays !== null && d.maxDays !== undefined}
                 onToggle={v => onChange({ maxDays: v ? (d.maxDays ?? 30) : null })}
                 testId="acc-maxdays-toggle">
        <NumField label="max" value={d.maxDays} onChange={v => onChange({ maxDays: v })} disabled={!unlocked} testId="acc-maxdays" />
      </ToggleRow>

      <div className="fg-row-divider" />

      <SelectField label="phases" value={String(d.phases || 1)} disabled={!unlocked}
                   options={[
                     { value: "1", label: "1 phase" },
                     { value: "2", label: "2 phases" },
                   ]}
                   onChange={v => onChange({ phases: parseInt(v) })} testId="acc-phases" />

      {d.phases === 2 && d.phase2 && (
        <div style={{ padding: 8, borderLeft: `2px solid ${C.flame}`, background: `${C.flame}10`, marginTop: 8 }}>
          <div style={{ fontSize: 10, color: C.flame, letterSpacing: 0.3, marginBottom: 6, fontWeight: 700 }}>╳ PHASE·02</div>
          <NumField label="target" prefix="$" value={d.phase2.target} onChange={v => onPhase2Change({ target: v })} disabled={!unlocked} testId="acc-p2-target" />
          <NumField label="min days" value={d.phase2.minDays ?? 0} onChange={v => onPhase2Change({ minDays: v ?? 0 })} disabled={!unlocked} testId="acc-p2-mindays" />
          <ToggleRow label="max days" on={d.phase2.maxDays !== null && d.phase2.maxDays !== undefined}
                     onToggle={v => onPhase2Change({ maxDays: v ? 60 : null })}
                     testId="acc-p2-maxdays-toggle">
            <NumField label="max" value={d.phase2.maxDays} onChange={v => onPhase2Change({ maxDays: v })} disabled={!unlocked} testId="acc-p2-maxdays" />
          </ToggleRow>
        </div>
      )}

      <div className="fg-row-divider" />

      <NumField label="fee" prefix="$" value={d.fee} onChange={v => onChange({ fee: v })} disabled={!unlocked} testId="acc-fee" />
      <NumField label="activation" prefix="$" value={d.activationFee || 0} onChange={v => onChange({ activationFee: v ?? 0 })} disabled={!unlocked} testId="acc-activation" />
      <SelectField label="fee type" value={d.feeType || "one_time"} disabled={!unlocked}
                   options={[
                     { value: "one_time", label: "one time" },
                     { value: "monthly",  label: "monthly" },
                   ]}
                   onChange={v => onChange({ feeType: v })} testId="acc-feetype" />
      <NumField label="profit split" value={d.profitSplit} step={0.01} onChange={v => onChange({ profitSplit: v })} disabled={!unlocked} testId="acc-split" />

      {onResetToPreset && (
        <button className="fg-btn-ghost" onClick={onResetToPreset} data-testid="btn-reset-preset"
                style={{ marginTop: 10, width: "100%" }}>
          ↺ reset to preset
        </button>
      )}
    </div>
  );
}

// ─────────────────────────── Results panel ───────────────────────────
function ResultsPanel({ results, loading, plan, firm, isModified }) {
  return (
    <div>
      <div className="fg-panel" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ color: C.ash, fontSize: 10, letterSpacing: 0.25 }}>› SELECTED PLAN</div>
            <div style={{ color: C.bone, fontSize: 15, fontWeight: 700, marginTop: 4, letterSpacing: 0.02 }}>
              {firm.name.toUpperCase()}
              <span style={{ color: C.ash, margin: "0 8px" }}>·</span>
              {plan.label}
              {isModified && <span style={{ marginLeft: 10, color: C.flame, fontSize: 9,
                                             padding: "1px 5px", border: `1px solid ${C.flame}`,
                                             background: `${C.flame}15`, letterSpacing: 0.2 }}>◆ MODIFIED</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 11, flexWrap: "wrap" }}>
            <Summary label="CAPITAL" val={fmtMoney(plan.capital)} color={C.bone} />
            <Summary label="TARGET"  val={fmtMoney(plan.target)}  color={C.ember} />
            <Summary label="DD"      val={`${fmtMoney(plan.ddValue)} · ${DD_META[plan.ddType]?.tag.replace("TRAILING·", "")}`} color={C.blood} />
            <Summary label="FEE"     val={plan.feeType === "monthly" ? `${fmtMoney(plan.fee)}/mo` : fmtMoney(plan.fee)} color={C.boneDim} />
            <Summary label="SPLIT"   val={`${(plan.profitSplit * 100).toFixed(0)}%`} color={C.bone} />
          </div>
        </div>
      </div>

      <Warnings plan={plan} firm={firm} />
      {loading && <LoadingState />}
      {!loading && !results && <EmptyState />}
      {!loading && results && <ResultsDashboard results={results} plan={plan} />}
    </div>
  );
}

function Summary({ label, val, color }) {
  return (
    <div>
      <div style={{ color: C.ash, fontSize: 9, letterSpacing: 0.25 }}>{label}</div>
      <div style={{ color, marginTop: 3 }}>{val}</div>
    </div>
  );
}

function Warnings({ plan, firm }) {
  const warns = [];
  if (plan.feeType === "monthly") {
    warns.push({ color: C.ember, msg:
      <>monthly fee · <b style={{ color: C.ember }}>{fmtMoney(plan.fee)}/mo</b> — total cost scales with attempt duration. simulator meters it per started month.</> });
  }
  if (firm.id === "apex_eod" || firm.id === "apex_intraday") {
    warns.push({ color: C.flame, msg:
      <>apex account · <b style={{ color: C.flame }}>30 days hard cap</b> · no reset. out-of-time fails count as TIMEOUT.</> });
  }
  if (firm.id === "topstep") {
    warns.push({ color: C.boneDim, msg:
      <>topstep does not impose a DLL · it is trader-configurable in TopstepX. activate it in <span style={{ color: C.ember }}>†&nbsp;edit</span> to model a personal cap.</> });
  }
  if (plan.consistency && plan.consistencyType === "vs_target") {
    warns.push({ color: C.ember, msg:
      <>consistency <b>{(plan.consistency * 100).toFixed(0)}% · vs TARGET</b> — if a single day exceeds that fraction of original target, effective target rises (does not block, hardens).</> });
  }
  if (plan.consistency && plan.consistencyType === "vs_total") {
    warns.push({ color: C.ember, msg:
      <>consistency <b>{(plan.consistency * 100).toFixed(0)}% · vs TOTAL</b> — PASS is blocked while best-day exceeds that % of cumulative profit. unlocks by keeping trading.</> });
  }
  if (plan.phases === 2 && plan.phase2) {
    warns.push({ color: C.flame, msg:
      <>╳ two-phase challenge — phase 1 target <b>{fmtMoney(plan.target)}</b> → phase 2 target <b>{fmtMoney(plan.phase2.target)}</b>. equity resets at the start of phase 2.</> });
  }
  if (!warns.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      {warns.map((w, i) => <Warn key={i} color={w.color}>{w.msg}</Warn>)}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="fg-panel" style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 26, color: C.flame, letterSpacing: 0.3 }}>
        [ <span className="fg-dots">···</span>&nbsp;HEATING&nbsp;<span className="fg-dots">···</span> ]
      </div>
      <div style={{ color: C.ash, marginTop: 14, fontSize: 11, letterSpacing: 0.2 }}>
        › forging {/* placeholder */} monte-carlo paths
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="fg-panel" style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 32, color: C.borderHot }}>◇</div>
      <div style={{ marginTop: 12, fontSize: 13, color: C.boneDim }}>
        configure strategy and press <span style={{ color: C.ember }}>[ ⌁ IGNITE ]</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.ash }}>› results render here</div>
    </div>
  );
}

// ─────────────────────────── Dashboard ───────────────────────────
function ResultsDashboard({ results, plan }) {
  const r = results;
  // In FORGE: positive = ember, alert = flame, fatal = blood
  const passColor = r.pPass > r.ruinaMin ? C.ember : C.blood;
  const evColor = r.ev >= 0 ? C.ember : C.blood;
  const failTotal = r.pDD + r.pTimeout + r.pDLL;

  let fourth;
  if (r.pTimeout > 0.01) fourth = { label: "P · TIMEOUT", value: fmtPct(r.pTimeout), color: C.flame, sub: "account expires without passing" };
  else if (r.pDLL > 0.01) fourth = { label: "P · DLL",     value: fmtPct(r.pDLL),     color: C.bloodDark, sub: "fail by daily-loss breach" };
  else                    fourth = { label: "P · TOTAL FAIL", value: fmtPct(failTotal), color: C.blood, sub: "aggregated failure probability" };

  const ROI = r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : 0;

  const distData = [
    { name: "PASS",    pct: +(r.pPass    * 100).toFixed(2), fill: C.ember },
    { name: "DD",      pct: +(r.pDD      * 100).toFixed(2), fill: C.blood },
  ];
  if (r.pTimeout > 0) distData.push({ name: "TIMEOUT", pct: +(r.pTimeout * 100).toFixed(2), fill: C.flame });
  if (r.pDLL     > 0) distData.push({ name: "DLL",     pct: +(r.pDLL     * 100).toFixed(2), fill: C.bloodDark });

  return (
    <div data-testid="results-dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 8 }}>
        <Kpi testId="kpi-ppass" label="P · PASS" value={fmtPct(r.pPass)} color={passColor}
             sub={`break-even: ${(r.ruinaMin * 100).toFixed(1)}%`} />
        <Kpi testId="kpi-ev" label="EV / ATTEMPT"
             value={(r.ev >= 0 ? "+" : "-") + fmtMoney(Math.abs(r.ev))}
             color={evColor} sub={`avg cost: ${fmtMoney(r.avgCost)}`} />
        <Kpi testId="kpi-pdd" label="P · DRAWDOWN" value={fmtPct(r.pDD)} color={C.blood} sub="fail by drawdown" />
        <Kpi testId="kpi-fourth" label={fourth.label} value={fourth.value} color={fourth.color} sub={fourth.sub} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 14 }}>
        <Kpi testId="kpi-meanpass" label="MEAN DAYS · PASS"
             value={r.nPass > 0 ? Math.round(r.meanPass).toString() : "—"}
             color={C.bone}
             sub={r.nPass > 0 ? `median: ${Math.round(r.medianPass)}d` : "no PASS samples"} />
        <Kpi testId="kpi-p90pass" label="P90 DAYS · PASS"
             value={r.nPass > 0 ? Math.round(r.p90Pass).toString() : "—"}
             color={C.ember} sub="90% pass before" />
        <Kpi testId="kpi-br95" label="BANKROLL · 95%"
             value={r.passEssentiallyZero ? "—" : fmtMoney(r.br95)}
             color={C.ember}
             sub={r.passEssentiallyZero ? "P(PASS) ≈ 0" : `${fmtInt(r.n95)} attempts`} />
        <Kpi testId="kpi-medi" label="MEDIAN ATTEMPTS"
             value={r.passEssentiallyZero ? "—" : fmtInt(r.medIntentos)}
             color={C.bone} sub="for first PASS" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 8, marginBottom: 10 }}>
        <div className="fg-panel" style={{ padding: 14 }} data-testid="chart-dist">
          <ChartTitle title="‡ RESULT DISTRIBUTION" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData} margin={{ top: 20, right: 10, left: 4, bottom: 0 }}>
              <XAxis dataKey="name" stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis stroke={C.ash} tickLine={false} axisLine={{ stroke: C.border }} unit="%" />
              <Tooltip content={<CTooltip />} cursor={{ fill: `${C.ember}10` }} />
              <Bar dataKey="pct" radius={[0, 0, 0, 0]}
                   label={{ position: "top", fill: C.bone, fontSize: 11, formatter: (v) => `${v}%` }}>
                {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="fg-panel" style={{ padding: 14 }} data-testid="chart-pass-hist">
          <ChartTitle title="‡ DAYS TO PASS"
                      caption={r.nPass > 0
                        ? `median ${Math.round(r.medianPass)}d · p90 ${Math.round(r.p90Pass)}d · clipped at p95`
                        : "no samples"} />
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

        <div className="fg-panel" style={{ padding: 14 }} data-testid="chart-fail-hist">
          <ChartTitle title="‡ DAYS TO FAIL"
                      caption={(r.nDD + r.nDLL + r.nTimeout) > 0
                        ? `median ${Math.round(r.medianFail)}d · clipped at p95`
                        : "no samples"} />
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

      {/* Stats row */}
      <div className="fg-panel" style={{ padding: 16 }} data-testid="stats-row">
        <div className="fg-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <Stat label="P·PASS"        value={fmtPct(r.pPass)} color={passColor} />
          <Stat label="EV·NET"        value={(r.ev >= 0 ? "+" : "") + fmtMoney(r.ev)} color={evColor} />
          <Stat label="BANKROLL·99"   value={r.passEssentiallyZero ? "—" : fmtMoney(r.br99)} color={C.ember} />
          <Stat label="ATTEMPTS·99"   value={r.passEssentiallyZero ? "—" : fmtInt(r.n99)} color={C.bone} />
          <Stat label="ROI·IF·PASS"   value={`${ROI.toFixed(0)}%`} color={ROI >= 0 ? C.ember : C.blood} />
          <Stat label="SPLIT"         value={`${(plan.profitSplit * 100).toFixed(0)}%`} color={C.boneDim} />
        </div>
        <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: 14, paddingTop: 10,
                      color: C.ash, fontSize: 10.5, letterSpacing: 0.1 }}>
          › sims: {r.nSims.toLocaleString("en-US")} · pass: {r.nPass} · dd: {r.nDD} · timeout: {r.nTimeout} · dll: {r.nDLL} · payout/pass: <span style={{ color: C.ember }}>{fmtMoney(r.payout)}</span>
        </div>
      </div>
    </div>
  );
}

function ChartTitle({ title, caption }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: C.bone, fontSize: 11, fontWeight: 700, letterSpacing: 0.25, textTransform: "uppercase" }}>
        {title}
      </div>
      {caption && <div style={{ color: C.ash, fontSize: 10, marginTop: 3, letterSpacing: 0.08 }}>› {caption}</div>}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.borderHot, fontSize: 11, letterSpacing: 0.2 }}>
      ◇ no samples
    </div>
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

export default App;
