import React, { useState, useMemo, useCallback } from "react";
import "./App.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { FIRM_DATABASE, STRATEGY_DEFAULTS } from "./firmDatabase";
import { runMonteCarlo } from "./monteCarlo";

// ─────────────────────────── helpers ───────────────────────────
const COLORS = {
  bg: "#07090E", panel: "#0D1117", border: "#1C2A38",
  green: "#00E676", red: "#FF3D5A", amber: "#FFB300",
  blue: "#4D9FFF", purple: "#BB86FC", orange: "#FF7043",
  text: "#C9D1D9", bright: "#E6EDF3", muted: "#4A5568",
};

function fmtMoney(n, decimals = 0) {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtPct(n, decimals = 2) {
  if (!isFinite(n)) return "—";
  return (n * 100).toFixed(decimals) + "%";
}
function fmtInt(n) {
  if (!isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

const DD_TYPE_CHIP = {
  trailing_eod:      { label: "Trailing EOD",      color: COLORS.blue },
  trailing_intraday: { label: "Trailing Intraday", color: COLORS.red },
  static:            { label: "Static",            color: COLORS.green },
};

// Compare plan with preset to detect modifications
function isPlanModified(plan, presetPlan) {
  if (!presetPlan) return false;
  const keys = ["capital", "target", "ddType", "ddValue", "floorLock", "dailyLoss",
    "dailyLossIsFatal", "consistency", "consistencyType", "minDays", "maxDays",
    "phases", "fee", "activationFee", "feeType", "profitSplit"];
  for (const k of keys) {
    if ((plan[k] ?? null) !== (presetPlan[k] ?? null)) return true;
  }
  if (plan.phases === 2) {
    const p2a = plan.phase2 || {}, p2b = presetPlan.phase2 || {};
    if ((p2a.target ?? null) !== (p2b.target ?? null)) return true;
    if ((p2a.minDays ?? null) !== (p2b.minDays ?? null)) return true;
    if ((p2a.maxDays ?? null) !== (p2b.maxDays ?? null)) return true;
  }
  return false;
}

// ─────────────────────────── small UI atoms ───────────────────────────
function Pill({ children, color = COLORS.muted, bgAlpha = 0.12 }) {
  return (
    <span className="qt-pill" style={{
      color,
      background: `${color}${Math.round(bgAlpha * 255).toString(16).padStart(2, "0")}`,
      borderColor: `${color}55`,
    }}>{children}</span>
  );
}

function Toggle({ on, onChange, testId }) {
  return (
    <div className={`qt-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}
         data-testid={testId} role="switch" aria-checked={on} />
  );
}

function NumField({ label, value, onChange, step = 1, disabled = false, prefix, testId, placeholder }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
      <label className="qt-label" style={{ flex: 1 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4, width: 130 }}>
        {prefix && <span style={{ color: COLORS.muted, fontFamily: "var(--qt-mono)", fontSize: 12 }}>{prefix}</span>}
        <input
          type="number"
          className="qt-input"
          value={value ?? ""}
          step={step}
          disabled={disabled}
          placeholder={placeholder}
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
      <label className="qt-label" style={{ flex: 1 }}>{label}</label>
      <select className="qt-select" style={{ width: 130 }} value={value ?? ""} disabled={disabled}
              onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
              data-testid={testId}>
        {options.map(o => <option key={o.value ?? "null"} value={o.value ?? ""}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleRow({ label, on, onToggle, testId, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label className="qt-label">{label}</label>
        <Toggle on={on} onChange={onToggle} testId={testId} />
      </div>
      {on && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

function KpiCard({ label, value, sub, color = COLORS.bright, testId }) {
  return (
    <div className="qt-panel" style={{ padding: 16 }} data-testid={testId}>
      <div className="qt-label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="qt-kpi-val" style={{ color }}>{value}</div>
      {sub && <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 6, fontFamily: "var(--qt-mono)" }}>{sub}</div>}
    </div>
  );
}

function Warning({ icon, children, color = COLORS.amber }) {
  return (
    <div style={{
      display: "flex", gap: 10, padding: "10px 14px",
      background: `${color}0F`,
      border: `1px solid ${color}44`,
      borderRadius: 8, marginBottom: 10, fontSize: 13, lineHeight: 1.5,
    }}>
      <div style={{ fontSize: 14 }}>{icon}</div>
      <div style={{ color: COLORS.text, flex: 1 }}>{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit = "%" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: COLORS.bg, border: `1px solid ${COLORS.border}`,
      padding: "6px 10px", borderRadius: 6, fontFamily: "var(--qt-mono)", fontSize: 12,
    }}>
      <div style={{ color: COLORS.muted }}>{label}</div>
      <div style={{ color: COLORS.bright }}>{payload[0].value}{unit}</div>
    </div>
  );
}

// ─────────────────────────── Main App ───────────────────────────
function App() {
  const [marketFilter, setMarketFilter] = useState("ALL");
  const [selectedFirmId, setSelectedFirmId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDraft, setPlanDraft] = useState(null); // editable copy of selected plan
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

  const isModified = useMemo(
    () => isPlanModified(planDraft, presetPlan),
    [planDraft, presetPlan]
  );

  const filteredFirms = useMemo(() => {
    if (marketFilter === "ALL") return FIRM_DATABASE;
    if (marketFilter === "FUTURES") return FIRM_DATABASE.filter(f => f.market === "futures");
    if (marketFilter === "FOREX") return FIRM_DATABASE.filter(f => f.market === "forex");
    if (marketFilter === "CUSTOM") return FIRM_DATABASE.filter(f => f.market === "custom");
    return FIRM_DATABASE;
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
      // Normalise dependent fields
      if (next.ddType === "static") { next.floorLock = null; }
      else if (!next.floorLock) { next.floorLock = "at_capital"; }
      if (next.dailyLoss === null || next.dailyLoss === undefined) next.dailyLossIsFatal = false;
      if (!next.consistency) next.consistencyType = null;
      else if (!next.consistencyType) next.consistencyType = "vs_total";
      if (next.phases === 2 && !next.phase2) {
        next.phase2 = { target: next.target, minDays: 0, maxDays: null };
      }
      return next;
    });
  };
  const updatePhase2 = (patch) => {
    setPlanDraft(prev => ({ ...prev, phase2: { ...(prev.phase2 || {}), ...patch } }));
  };

  const canRun = planDraft !== null;

  const handleRun = () => {
    if (!canRun) return;
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      try {
        const res = runMonteCarlo(planDraft, strategy, nSims);
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 30);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text }} data-testid="app-root">
      <Header />

      {/* STEP 1 — Firm selector */}
      <section style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 24px 0" }}>
        <StepTitle n={1} title="Elige una prop firm" sub="Filtra por mercado o elige Custom para configurar todo" />
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }} data-testid="market-filters">
          {["ALL", "FUTURES", "FOREX", "CUSTOM"].map(f => (
            <button
              key={f}
              className="qt-pill"
              onClick={() => setMarketFilter(f)}
              data-testid={`filter-${f.toLowerCase()}`}
              style={{
                cursor: "pointer",
                background: marketFilter === f ? `${COLORS.green}22` : "transparent",
                color: marketFilter === f ? COLORS.green : COLORS.text,
                borderColor: marketFilter === f ? COLORS.green : COLORS.border,
                padding: "8px 16px", fontSize: 12,
              }}
            >{f}</button>
          ))}
        </div>

        <div className="qt-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }} data-testid="firm-grid">
          {filteredFirms.map(firm => (
            <FirmCard
              key={firm.id}
              firm={firm}
              selected={firm.id === selectedFirmId}
              onClick={() => selectFirm(firm.id)}
            />
          ))}
        </div>
      </section>

      {/* STEP 2 — Plan selector */}
      {selectedFirm && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "20px 24px 0" }} className="qt-fadein">
          <StepTitle n={2} title={`Elige un plan — ${selectedFirm.name}`} sub={selectedFirm.subtitle} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }} data-testid="plan-grid">
            {selectedFirm.plans.map(plan => (
              <PlanCard
                key={plan.planId}
                plan={plan}
                firm={selectedFirm}
                selected={plan.planId === selectedPlanId}
                onClick={() => selectPlan(plan)}
              />
            ))}
          </div>
        </section>
      )}

      {/* STEP 3 & RESULTS */}
      {planDraft && (
        <section style={{ maxWidth: 1600, margin: "0 auto", padding: "20px 24px 40px" }} className="qt-fadein">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Left — params panel */}
            <div style={{ width: 340, minWidth: 300, flexShrink: 0 }}>
              <StepTitle n={3} title="Estrategia & simulación" />

              {/* A — P&L distribution */}
              <div className="qt-panel" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, color: COLORS.bright, marginBottom: 10, fontSize: 13, letterSpacing: 0.3 }}>
                  A · Distribución P&L
                </div>
                <NumField label="Win Rate" value={strategy.wr} step={0.01} onChange={v => setStrategy({ ...strategy, wr: v })} testId="strat-wr" />
                <NumField label="μ ganancia" prefix="$" value={strategy.muWin} onChange={v => setStrategy({ ...strategy, muWin: v })} testId="strat-muwin" />
                <NumField label="σ ganancia" prefix="$" value={strategy.sigmaWin} onChange={v => setStrategy({ ...strategy, sigmaWin: v })} testId="strat-sigmawin" />
                <NumField label="μ pérdida" prefix="$" value={strategy.muLoss} onChange={v => setStrategy({ ...strategy, muLoss: v })} testId="strat-muloss" />
                <NumField label="σ pérdida" prefix="$" value={strategy.sigmaLoss} onChange={v => setStrategy({ ...strategy, sigmaLoss: v })} testId="strat-sigmaloss" />
                <NumField label="P(spike)" value={strategy.tailProb} step={0.001} onChange={v => setStrategy({ ...strategy, tailProb: v })} testId="strat-tailprob" />
                <NumField label="Mult. spike" value={strategy.tailMult} step={0.01} onChange={v => setStrategy({ ...strategy, tailMult: v })} testId="strat-tailmult" />
              </div>

              {/* B — MAE */}
              <details className="qt-panel" style={{ padding: 12, marginBottom: 12 }} open={showMaeBlock}
                       onToggle={(e) => setShowMaeBlock(e.target.open)}>
                <summary style={{ fontWeight: 600, color: COLORS.bright, fontSize: 13, letterSpacing: 0.3,
                                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>B · MAE Intraday <span style={{ color: COLORS.muted, fontWeight: 400, fontSize: 11 }}>(opcional)</span></span>
                  <span style={{ color: COLORS.muted, fontSize: 14 }}>{showMaeBlock ? "▾" : "▸"}</span>
                </summary>
                <div style={{ marginTop: 10 }}>
                  <NumField label="MAE win scale"  value={strategy.maeWin}  step={0.01} onChange={v => setStrategy({ ...strategy, maeWin: v })}  testId="strat-maewin" />
                  <NumField label="MAE loss scale" value={strategy.maeLoss} step={0.01} onChange={v => setStrategy({ ...strategy, maeLoss: v })} testId="strat-maeloss" />
                </div>
              </details>

              {/* C — Account parameters */}
              <div className="qt-panel" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showAccountEditor ? 12 : 0 }}>
                  <div style={{ fontWeight: 600, color: COLORS.bright, fontSize: 13, letterSpacing: 0.3 }}>
                    C · Cuenta
                    {isModified && (
                      <span style={{ marginLeft: 8, color: COLORS.amber, fontSize: 10, fontWeight: 700,
                                     letterSpacing: 0.5, padding: "2px 6px",
                                     background: `${COLORS.amber}22`, borderRadius: 4 }}>MODIFIED</span>
                    )}
                  </div>
                  {selectedFirm.id !== "custom" && (
                    <button
                      onClick={() => { setShowAccountEditor(v => !v); setCustomUnlocked(true); }}
                      data-testid="btn-edit-account"
                      style={{ background: "transparent", border: `1px solid ${COLORS.border}`,
                               color: COLORS.text, padding: "4px 10px", borderRadius: 6,
                               fontSize: 11, cursor: "pointer", fontFamily: "var(--qt-mono)" }}
                    >
                      {showAccountEditor ? "Cerrar" : "✏️ Editar"}
                    </button>
                  )}
                </div>

                {(showAccountEditor || selectedFirm.id === "custom") && (
                  <AccountEditor
                    draft={planDraft}
                    onChange={updateDraft}
                    onPhase2Change={updatePhase2}
                    unlocked={customUnlocked || selectedFirm.id === "custom"}
                    onResetToPreset={() => {
                      if (presetPlan) selectPlan(presetPlan);
                    }}
                  />
                )}
              </div>

              {/* D — Simulation */}
              <div className="qt-panel" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, color: COLORS.bright, marginBottom: 10, fontSize: 13, letterSpacing: 0.3 }}>
                  D · Simulación
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label className="qt-label">N simulaciones</label>
                  <span className="mono" style={{ color: COLORS.bright, fontSize: 13 }}>{nSims.toLocaleString("en-US")}</span>
                </div>
                <input
                  type="range" min={1000} max={25000} step={1000}
                  value={nSims} onChange={(e) => setNSims(parseInt(e.target.value))}
                  data-testid="sim-nsims"
                  style={{ width: "100%", accentColor: COLORS.green }}
                />
              </div>

              <button className="qt-btn" onClick={handleRun} disabled={!canRun || loading} data-testid="btn-run">
                {loading
                  ? <><span className="qt-spin">⟳</span>&nbsp; Simulando {nSims.toLocaleString("en-US")} trayectorias...</>
                  : "▶ EJECUTAR SIMULACIÓN"}
              </button>
            </div>

            {/* Right — results */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <ResultsPanel
                results={results}
                loading={loading}
                plan={planDraft}
                firm={selectedFirm}
                isModified={isModified}
              />
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
  return (
    <header style={{
      borderBottom: `1px solid ${COLORS.border}`,
      padding: "18px 24px",
      background: `linear-gradient(180deg, ${COLORS.panel} 0%, ${COLORS.bg} 100%)`,
    }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex",
                    alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div style={{ fontFamily: "var(--qt-mono)", fontSize: 22, fontWeight: 700, color: COLORS.bright, letterSpacing: 0.5 }}>
            ⬢ PROP<span style={{ color: COLORS.green }}>_MC</span>
          </div>
          <div style={{ color: COLORS.muted, fontSize: 12, letterSpacing: 0.4 }}>
            Monte Carlo Simulator · v3
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Pill color={COLORS.green}>● LIVE</Pill>
          <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: "var(--qt-mono)" }}>
            {FIRM_DATABASE.filter(f => f.market !== "custom").length} firms · {FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0)} plans
          </span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${COLORS.border}`, padding: "18px 24px", marginTop: 40,
      background: COLORS.panel,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", color: COLORS.muted, fontSize: 12, lineHeight: 1.6 }}>
        ⚠️ Simulación educativa. Los parámetros de las firmas cambian sin aviso.
        Datos verificados a Abril 2026. Verifica siempre las reglas actuales en la web oficial
        de cada firma antes de comprar un challenge. Los resultados dependen de los parámetros
        estadísticos introducidos.
      </div>
    </footer>
  );
}

function StepTitle({ n, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontFamily: "var(--qt-mono)", fontSize: 11, color: COLORS.muted, letterSpacing: 0.6 }}>
          PASO {n}
        </span>
        <h2 style={{ margin: 0, color: COLORS.bright, fontSize: 18, fontWeight: 600, letterSpacing: 0.2 }}>
          {title}
        </h2>
      </div>
      {sub && <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────── Firm / Plan cards ───────────────────────────
function FirmCard({ firm, selected, onClick }) {
  const hasTwoPhase = firm.plans.some(p => p.phases === 2);
  const ddTypes = [...new Set(firm.plans.map(p => p.ddType))];

  return (
    <div
      className={`qt-panel qt-card-click ${selected ? "qt-card-selected" : ""}`}
      onClick={onClick}
      data-testid={`firm-${firm.id}`}
      style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 130 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: COLORS.bright, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {firm.name}
          </div>
          <div style={{ color: COLORS.muted, fontSize: 11 }}>{firm.subtitle}</div>
        </div>
        <Pill color={firm.badgeColor}>{firm.badge}</Pill>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
        {ddTypes.map(t => (
          <Pill key={t} color={DD_TYPE_CHIP[t]?.color ?? COLORS.muted}>
            {DD_TYPE_CHIP[t]?.label ?? t}
          </Pill>
        ))}
        {firm.allowsOvernight && <Pill color={COLORS.purple}>🌙 Overnight</Pill>}
        {hasTwoPhase && <Pill color={COLORS.amber}>🔄 2 Phases</Pill>}
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
    <div
      className={`qt-panel qt-card-click ${selected ? "qt-card-selected" : ""}`}
      onClick={onClick}
      data-testid={`plan-${plan.planId}`}
      style={{ padding: 14, position: "relative" }}
    >
      {isPopular && (
        <span style={{ position: "absolute", top: -8, right: 10, fontSize: 9, padding: "2px 6px",
                       background: COLORS.amber, color: COLORS.bg, borderRadius: 4, fontWeight: 700,
                       letterSpacing: 0.6, fontFamily: "var(--qt-mono)" }}>POPULAR</span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontFamily: "var(--qt-mono)", fontSize: 22, fontWeight: 700, color: COLORS.bright }}>
          {isCustom ? "Configure →" : (plan.capital >= 1000 ? `$${(plan.capital / 1000).toFixed(0)}K` : fmtMoney(plan.capital))}
        </div>
        <div style={{ textAlign: "right", fontSize: 11, fontFamily: "var(--qt-mono)", color: COLORS.text }}>
          {plan.feeType === "monthly" ? (
            <>
              <Pill color={COLORS.amber}>Monthly</Pill>
              <div style={{ marginTop: 4, color: COLORS.bright }}>${plan.fee}/mo</div>
            </>
          ) : (
            <div style={{ color: COLORS.bright }}>${plan.fee}</div>
          )}
        </div>
      </div>
      {!isCustom && (
        <>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{plan.label}</div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontFamily: "var(--qt-mono)", fontSize: 11 }}>
            <div>
              <div style={{ color: COLORS.muted }}>Target</div>
              <div style={{ color: COLORS.green }}>{fmtMoney(plan.target)} <span style={{ color: COLORS.muted }}>· {tgtPct}%</span></div>
            </div>
            <div>
              <div style={{ color: COLORS.muted }}>DD</div>
              <div style={{ color: COLORS.red }}>{fmtMoney(plan.ddValue)} <span style={{ color: COLORS.muted }}>· {ddPct}%</span></div>
            </div>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill color={DD_TYPE_CHIP[plan.ddType]?.color}>{DD_TYPE_CHIP[plan.ddType]?.label}</Pill>
            {plan.phases === 2 && <Pill color={COLORS.amber}>2 Phases</Pill>}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <NumField label="Capital" prefix="$" value={d.capital} onChange={v => onChange({ capital: v })} disabled={!unlocked} testId="acc-capital" />
      <NumField label="Target"  prefix="$" value={d.target}  onChange={v => onChange({ target: v })}  disabled={!unlocked} testId="acc-target" />

      <SelectField label="DD type" value={d.ddType} disabled={!unlocked}
                   options={[
                     { value: "trailing_eod",      label: "Trailing EOD" },
                     { value: "trailing_intraday", label: "Trailing Intraday" },
                     { value: "static",            label: "Static" },
                   ]}
                   onChange={v => onChange({ ddType: v })} testId="acc-ddtype" />

      <NumField label="DD $" prefix="$" value={d.ddValue} onChange={v => onChange({ ddValue: v })} disabled={!unlocked} testId="acc-ddvalue" />

      {d.ddType !== "static" && (
        <SelectField label="Floor lock" value={d.floorLock || "at_capital"} disabled={!unlocked}
                     options={[
                       { value: "none",                 label: "None" },
                       { value: "at_capital",           label: "At capital" },
                       { value: "at_target_level",      label: "At target level" },
                       { value: "at_capital_plus_100",  label: "At cap + $100" },
                     ]}
                     onChange={v => onChange({ floorLock: v })} testId="acc-floorlock" />
      )}

      <div className="qt-divider" />

      <ToggleRow label="Daily Loss" on={d.dailyLoss !== null && d.dailyLoss !== undefined}
                 onToggle={v => onChange({ dailyLoss: v ? (d.dailyLoss ?? 1000) : null })}
                 testId="acc-dll-toggle">
        <NumField label="DLL $" prefix="$" value={d.dailyLoss} onChange={v => onChange({ dailyLoss: v })} disabled={!unlocked} testId="acc-dllvalue" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <label className="qt-label">DLL fatal</label>
          <Toggle on={!!d.dailyLossIsFatal} onChange={v => onChange({ dailyLossIsFatal: v })} testId="acc-dll-fatal" />
        </div>
      </ToggleRow>

      <div className="qt-divider" />

      <ToggleRow label="Consistency" on={d.consistency !== null && d.consistency !== undefined}
                 onToggle={v => onChange({ consistency: v ? (d.consistency ?? 0.3) : null })}
                 testId="acc-cons-toggle">
        <NumField label="% (decimal)" value={d.consistency} step={0.01} onChange={v => onChange({ consistency: v })} disabled={!unlocked} testId="acc-consvalue" />
        <SelectField label="Type" value={d.consistencyType || "vs_total"} disabled={!unlocked}
                     options={[
                       { value: "vs_total",  label: "vs Total" },
                       { value: "vs_target", label: "vs Target" },
                     ]}
                     onChange={v => onChange({ consistencyType: v })} testId="acc-constype" />
      </ToggleRow>

      <div className="qt-divider" />

      <NumField label="Mín días" value={d.minDays || 0} onChange={v => onChange({ minDays: v ?? 0 })} disabled={!unlocked} testId="acc-mindays" />
      <ToggleRow label="Máx días" on={d.maxDays !== null && d.maxDays !== undefined}
                 onToggle={v => onChange({ maxDays: v ? (d.maxDays ?? 30) : null })}
                 testId="acc-maxdays-toggle">
        <NumField label="Max" value={d.maxDays} onChange={v => onChange({ maxDays: v })} disabled={!unlocked} testId="acc-maxdays" />
      </ToggleRow>

      <div className="qt-divider" />

      <SelectField label="Phases" value={String(d.phases || 1)} disabled={!unlocked}
                   options={[
                     { value: "1", label: "1 phase" },
                     { value: "2", label: "2 phases" },
                   ]}
                   onChange={v => onChange({ phases: parseInt(v) })} testId="acc-phases" />

      {d.phases === 2 && d.phase2 && (
        <div style={{ padding: 10, background: `${COLORS.amber}0F`, border: `1px solid ${COLORS.amber}33`,
                      borderRadius: 6, marginTop: 6 }}>
          <div style={{ fontSize: 11, color: COLORS.amber, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>FASE 2</div>
          <NumField label="Target" prefix="$" value={d.phase2.target} onChange={v => onPhase2Change({ target: v })} disabled={!unlocked} testId="acc-p2-target" />
          <NumField label="Mín días" value={d.phase2.minDays ?? 0} onChange={v => onPhase2Change({ minDays: v ?? 0 })} disabled={!unlocked} testId="acc-p2-mindays" />
          <ToggleRow label="Máx días" on={d.phase2.maxDays !== null && d.phase2.maxDays !== undefined}
                     onToggle={v => onPhase2Change({ maxDays: v ? 60 : null })}
                     testId="acc-p2-maxdays-toggle">
            <NumField label="Max" value={d.phase2.maxDays} onChange={v => onPhase2Change({ maxDays: v })} disabled={!unlocked} testId="acc-p2-maxdays" />
          </ToggleRow>
        </div>
      )}

      <div className="qt-divider" />

      <NumField label="Fee" prefix="$" value={d.fee} onChange={v => onChange({ fee: v })} disabled={!unlocked} testId="acc-fee" />
      <NumField label="Activation" prefix="$" value={d.activationFee || 0} onChange={v => onChange({ activationFee: v ?? 0 })} disabled={!unlocked} testId="acc-activation" />
      <SelectField label="Fee type" value={d.feeType || "one_time"} disabled={!unlocked}
                   options={[
                     { value: "one_time", label: "One time" },
                     { value: "monthly",  label: "Monthly" },
                   ]}
                   onChange={v => onChange({ feeType: v })} testId="acc-feetype" />
      <NumField label="Profit split" value={d.profitSplit} step={0.01} onChange={v => onChange({ profitSplit: v })} disabled={!unlocked} testId="acc-split" />

      {onResetToPreset && (
        <button
          onClick={onResetToPreset}
          data-testid="btn-reset-preset"
          style={{ marginTop: 10, background: "transparent", border: `1px solid ${COLORS.border}`,
                   color: COLORS.muted, padding: "6px 10px", borderRadius: 6, fontSize: 11,
                   cursor: "pointer", fontFamily: "var(--qt-mono)" }}
        >↺ Resetear al preset</button>
      )}
    </div>
  );
}

// ─────────────────────────── Results panel ───────────────────────────
function ResultsPanel({ results, loading, plan, firm, isModified }) {
  // Plan summary banner
  const summaryBanner = (
    <div className="qt-panel" style={{ padding: 14, marginBottom: 12,
                                       display: "flex", gap: 16, alignItems: "center",
                                       flexWrap: "wrap", justifyContent: "space-between" }}>
      <div>
        <div style={{ color: COLORS.muted, fontSize: 11, letterSpacing: 0.5 }}>PLAN SELECCIONADO</div>
        <div style={{ color: COLORS.bright, fontSize: 15, fontWeight: 600, marginTop: 2 }}>
          {firm.name} · {plan.label}
          {isModified && <span style={{ marginLeft: 8, color: COLORS.amber, fontSize: 10, fontWeight: 700,
                                        padding: "2px 6px", background: `${COLORS.amber}22`, borderRadius: 4 }}>MODIFIED</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 18, fontFamily: "var(--qt-mono)", fontSize: 12, flexWrap: "wrap" }}>
        <Summary label="Capital"  val={fmtMoney(plan.capital)} color={COLORS.bright} />
        <Summary label="Target"   val={fmtMoney(plan.target)}  color={COLORS.green} />
        <Summary label="DD"       val={`${fmtMoney(plan.ddValue)} ${DD_TYPE_CHIP[plan.ddType]?.label.replace("Trailing ", "")}`} color={COLORS.red} />
        <Summary label="Fee"      val={plan.feeType === "monthly" ? `${fmtMoney(plan.fee)}/mo` : fmtMoney(plan.fee)} color={COLORS.text} />
        <Summary label="Split"    val={`${(plan.profitSplit * 100).toFixed(0)}%`} color={COLORS.blue} />
      </div>
    </div>
  );

  return (
    <div>
      {summaryBanner}
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
      <div style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 0.4 }}>{label.toUpperCase()}</div>
      <div style={{ color, marginTop: 2 }}>{val}</div>
    </div>
  );
}

function Warnings({ plan, firm }) {
  const warns = [];
  if (plan.feeType === "monthly") {
    warns.push({ icon: "⚠️", color: COLORS.amber, msg:
      <>Fee mensual (<b>{fmtMoney(plan.fee)}/mes</b>) — el coste total depende de cuántos meses tarda cada intento. El simulador ya lo contabiliza dinámicamente.</> });
  }
  if (firm.id === "apex_eod" || firm.id === "apex_intraday") {
    warns.push({ icon: "⏰", color: COLORS.blue, msg:
      <>Cuenta Apex: <b>30 días</b> para pasar o expira (sin reset). Fallos por tiempo se cuentan como TIMEOUT.</> });
  }
  if (firm.id === "topstep") {
    warns.push({ icon: "ℹ️", color: COLORS.blue, msg:
      <>Topstep no impone DLL: es configurable por el trader en TopstepX. Actívalo en "Editar" si quieres modelar un límite personal.</> });
  }
  if (plan.consistency && plan.consistencyType === "vs_target") {
    warns.push({ icon: "📊", color: COLORS.purple, msg:
      <>Consistency {(plan.consistency * 100).toFixed(0)}% vs TARGET — si un día supera ese umbral del target original, el target efectivo sube (no bloquea, endurece).</> });
  }
  if (plan.consistency && plan.consistencyType === "vs_total") {
    warns.push({ icon: "📊", color: COLORS.purple, msg:
      <>Consistency {(plan.consistency * 100).toFixed(0)}% vs TOTAL — el PASS se bloquea si el mejor día supera ese % del profit acumulado. Se desbloquea trading más días.</> });
  }
  if (plan.phases === 2 && plan.phase2) {
    warns.push({ icon: "🔄", color: COLORS.amber, msg:
      <>Challenge de 2 fases — Fase 1 (target <b>{fmtMoney(plan.target)}</b>) → Fase 2 (target <b>{fmtMoney(plan.phase2.target)}</b>). La equity se resetea al inicio de Fase 2.</> });
  }
  if (!warns.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      {warns.map((w, i) => <Warning key={i} icon={w.icon} color={w.color}>{w.msg}</Warning>)}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="qt-panel" style={{ padding: 60, textAlign: "center", color: COLORS.muted }}>
      <div style={{ fontSize: 32 }}><span className="qt-spin">⟳</span></div>
      <div style={{ marginTop: 14, fontFamily: "var(--qt-mono)" }}>Ejecutando Monte Carlo...</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="qt-panel" style={{ padding: 48, textAlign: "center", color: COLORS.muted }}>
      <div style={{ fontSize: 40, color: COLORS.border }}>◆</div>
      <div style={{ marginTop: 12, fontSize: 14, color: COLORS.text }}>
        Configura tu estrategia y presiona <span style={{ color: COLORS.green, fontFamily: "var(--qt-mono)" }}>EJECUTAR SIMULACIÓN</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 12 }}>Los resultados aparecerán aquí.</div>
    </div>
  );
}

// ─────────────────────────── Results dashboard ───────────────────────────
function ResultsDashboard({ results, plan }) {
  const r = results;
  const passColor = r.pPass > r.ruinaMin ? COLORS.green : COLORS.red;
  const evColor = r.ev >= 0 ? COLORS.green : COLORS.red;
  const failTotal = r.pDD + r.pTimeout + r.pDLL;

  // Fourth card logic
  let fourthCard;
  if (r.pTimeout > 0.01) {
    fourthCard = { label: "P(Timeout)", value: fmtPct(r.pTimeout), color: COLORS.amber, sub: "Cuenta expira sin pasar" };
  } else if (r.pDLL > 0.01) {
    fourthCard = { label: "P(DLL)", value: fmtPct(r.pDLL), color: COLORS.orange, sub: "Fallo por daily loss" };
  } else {
    fourthCard = { label: "P(Fallo total)", value: fmtPct(failTotal), color: COLORS.red, sub: "Probabilidad total de fallo" };
  }

  const ROI = r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : 0;

  // Distribution chart data
  const distData = [
    { name: "PASS", pct: +(r.pPass * 100).toFixed(2),    fill: COLORS.green },
    { name: "DD",   pct: +(r.pDD   * 100).toFixed(2),    fill: COLORS.red },
  ];
  if (r.pTimeout > 0) distData.push({ name: "Timeout", pct: +(r.pTimeout * 100).toFixed(2), fill: COLORS.amber });
  if (r.pDLL > 0)     distData.push({ name: "DLL",     pct: +(r.pDLL     * 100).toFixed(2), fill: COLORS.orange });

  return (
    <div data-testid="results-dashboard">
      {/* KPI Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 10 }}>
        <KpiCard testId="kpi-ppass" label="P(PASS)" value={fmtPct(r.pPass)} color={passColor}
                 sub={`Break-even: ${(r.ruinaMin * 100).toFixed(1)}%`} />
        <KpiCard testId="kpi-ev" label="EV / intento"
                 value={(r.ev >= 0 ? "+" : "-") + fmtMoney(Math.abs(r.ev))}
                 color={evColor} sub={`Coste medio: ${fmtMoney(r.avgCost)}`} />
        <KpiCard testId="kpi-pdd" label="P(DD)" value={fmtPct(r.pDD)} color={COLORS.red} sub="Fallo por drawdown" />
        <KpiCard testId="kpi-fourth" label={fourthCard.label} value={fourthCard.value} color={fourthCard.color} sub={fourthCard.sub} />
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
        <KpiCard testId="kpi-meanpass" label="Días medios PASS"
                 value={r.nPass > 0 ? Math.round(r.meanPass).toString() : "—"}
                 color={COLORS.blue}
                 sub={r.nPass > 0 ? `Mediana: ${Math.round(r.medianPass)}d` : "sin PASS"} />
        <KpiCard testId="kpi-p90pass" label="P90 días PASS"
                 value={r.nPass > 0 ? Math.round(r.p90Pass).toString() : "—"}
                 color={COLORS.amber} sub="90% pasan antes" />
        <KpiCard testId="kpi-br95" label="Bankroll 95%"
                 value={r.passEssentiallyZero ? "—" : fmtMoney(r.br95)}
                 color={COLORS.purple}
                 sub={r.passEssentiallyZero ? "P(PASS) ≈ 0" : `${fmtInt(r.n95)} intentos`} />
        <KpiCard testId="kpi-medi" label="Mediana intentos"
                 value={r.passEssentiallyZero ? "—" : fmtInt(r.medIntentos)}
                 color={COLORS.amber} sub="Para primer PASS" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10, marginBottom: 14 }}>
        {/* Chart 1 — Dist */}
        <div className="qt-panel" style={{ padding: 14 }} data-testid="chart-dist">
          <ChartTitle title="Distribución resultados" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="name" stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
              <YAxis stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} unit="%" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: `${COLORS.bright}08` }} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]} label={{ position: "top", fill: COLORS.bright, fontSize: 11, fontFamily: "IBM Plex Mono", formatter: (v) => `${v}%` }}>
                {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 — Pass histogram */}
        <div className="qt-panel" style={{ padding: 14 }} data-testid="chart-pass-hist">
          <ChartTitle title="Días hasta PASS"
                      caption={r.nPass > 0
                        ? `mediana ${Math.round(r.medianPass)}d · p90 ${Math.round(r.p90Pass)}d · truncado en p95`
                        : "sin samples"} />
          {r.histPass.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.histPass} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="day" stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
                <YAxis stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} unit="%" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: `${COLORS.green}15` }} />
                <ReferenceLine x={Math.round(r.medianPass)} stroke={COLORS.amber} strokeDasharray="3 3" />
                <Bar dataKey="pct" fill={COLORS.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Chart 3 — Fail histogram */}
        <div className="qt-panel" style={{ padding: 14 }} data-testid="chart-fail-hist">
          <ChartTitle title="Días hasta fallo"
                      caption={(r.nDD + r.nDLL + r.nTimeout) > 0
                        ? `mediana ${Math.round(r.medianFail)}d · truncado en p95`
                        : "sin samples"} />
          {r.histFail.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.histFail} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="day" stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
                <YAxis stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} unit="%" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: `${COLORS.red}15` }} />
                <ReferenceLine x={Math.round(r.medianFail)} stroke={COLORS.amber} strokeDasharray="3 3" />
                <Bar dataKey="pct" fill={COLORS.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="qt-panel" style={{ padding: 14 }} data-testid="stats-row">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, fontFamily: "var(--qt-mono)" }}>
          <Stat label="P(PASS)"        value={fmtPct(r.pPass)}             color={passColor} />
          <Stat label="EV neto"        value={fmtMoney(r.ev)}              color={evColor} />
          <Stat label="Bankroll 99%"   value={r.passEssentiallyZero ? "—" : fmtMoney(r.br99)} color={COLORS.purple} />
          <Stat label="Intentos 99%"   value={r.passEssentiallyZero ? "—" : fmtInt(r.n99)}    color={COLORS.amber} />
          <Stat label="ROI si PASS"    value={`${ROI.toFixed(0)}%`}        color={COLORS.blue} />
          <Stat label="Split efectivo" value={`${(plan.profitSplit * 100).toFixed(0)}%`} color={COLORS.blue} />
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 14, paddingTop: 10,
                      color: COLORS.muted, fontSize: 11, fontFamily: "var(--qt-mono)" }}>
          Simulaciones: {r.nSims.toLocaleString("en-US")} · PASS: {r.nPass} · DD: {r.nDD} · Timeout: {r.nTimeout} · DLL: {r.nDLL} · Payout por PASS: {fmtMoney(r.payout)}
        </div>
      </div>
    </div>
  );
}

function ChartTitle({ title, caption }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ color: COLORS.bright, fontWeight: 600, fontSize: 13, letterSpacing: 0.3 }}>{title}</div>
      {caption && <div style={{ color: COLORS.muted, fontSize: 10, marginTop: 2, fontFamily: "var(--qt-mono)" }}>{caption}</div>}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted, fontSize: 12 }}>
      — sin datos —
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ color: COLORS.muted, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 16, marginTop: 4, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default App;
