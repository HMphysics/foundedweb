// All STRATEGY tab sections extracted from App.js.
// Each is a collapsible panel bound to the shared strategy state.
import { useMemo, useState } from "react";
import { C } from "../../lib/colors";
import { fmtMoney } from "../../lib/format";
import { useT } from "../LangContext";
import { useUserPlan } from "../UserPlanContext";
import {
  Collapsible, NumField, SelectField, ToggleRow,
} from "../shared/ui";
import { parseBootstrapData, INSTRUMENT_MAE_RATIOS } from "../../monteCarlo";
import { resolveFundedRules } from "../../firmDatabase";
import { exampleAsCSV } from "../../lib/exampleData";
import UpgradeModal from "../UpgradeModal";

export function ModeSelector({ strategy, setStrategy }) {
  const { t } = useT();
  const { canAccess } = useUserPlan();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const mode = strategy.mode || "bootstrap";
  const bootstrapLocked = !canAccess('bootstrap');

  const handleModeChange = (modeId) => {
    if (modeId === 'bootstrap' && bootstrapLocked) {
      setShowUpgrade(true);
      return;
    }
    setStrategy({ ...strategy, mode: modeId });
  };

  return (
    <>
      <div className="fg-panel" style={{ padding: 16 }} data-testid="mode-selector">
        <div style={{ fontFamily: "var(--plex)", fontSize: 11, letterSpacing: 0.2,
                      textTransform: "uppercase", color: C.steel, fontWeight: 500, marginBottom: 10 }}>
          § {t("mode_title")}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            // bootstrap (data-driven) is now first and badged as RECOMMENDED.
            { id: "bootstrap", label: t("mode_bootstrap"), sub: t("mode_bootstrap_sub"), locked: bootstrapLocked, recommended: true },
            { id: "simple",    label: t("mode_simple"),    sub: t("mode_simple_sub"), locked: false, recommended: false },
          ].map(m => {
            const selected = mode === m.id;
            return (
            <label key={m.id} style={{ 
                     flex: 1, minWidth: 200, cursor: "pointer", padding: 12,
                     border: `1px solid ${selected ? C.cinnabar : m.locked ? C.dust : C.dust}`,
                     background: selected ? `${C.cinnabar}10` : "transparent",
                     opacity: m.locked ? 0.7 : 1,
                     position: 'relative',
                   }}
                   onClick={() => handleModeChange(m.id)}
                   data-testid={`mode-${m.id}`}>
              {/* RECOMMENDED badge — only for bootstrap, hidden if user cannot access it */}
              {m.recommended && !m.locked && (
                <span data-testid="mode-recommended-badge" style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: 9, fontFamily: "var(--mono)", color: "#7BC47F",
                  letterSpacing: "0.12em", padding: "2px 6px",
                  border: "1px solid #7BC47F", borderRadius: 2,
                }}>
                  ★ {t("mode_recommended")}
                </span>
              )}
              {m.locked && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 9, fontFamily: "var(--mono)", color: C.brass,
                  letterSpacing: "0.1em",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  PRO
                </span>
              )}
              <input type="radio" name="mode" checked={selected}
                     onChange={() => {}}
                     style={{ accentColor: C.cinnabar, marginRight: 10 }} />
              <span style={{ fontFamily: "var(--plex)", fontWeight: 600, fontSize: 13,
                             color: selected ? C.cinnabar : C.bone, letterSpacing: 0.05 }}>
                {m.label}
              </span>
              {/* Green checkmark when this option is the active mode */}
              {selected && (
                <span data-testid={`mode-${m.id}-check`} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: 8, width: 16, height: 16, borderRadius: 8,
                  background: "#7BC47F",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                       stroke="#0E0E0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
              <div style={{ marginTop: 6, color: C.linen, fontSize: 12, fontStyle: "italic",
                            fontFamily: "var(--plex)", fontWeight: 300, lineHeight: 1.45 }}>
                {m.sub}
              </div>
            </label>
            );
          })}
        </div>
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}

export function PnLDistributionSection({ strategy, setStrategy, openCsv }) {
  const { t } = useT();
  const mode = strategy.mode || "bootstrap";
  return (
    <Collapsible title={t("section_pnl_v2")} testId="section-pnl" defaultOpen>
      {mode === "simple" ? (
        <>
          <button className="fg-btn-ghost" onClick={openCsv}
                  data-testid="btn-open-csv" style={{ width: "100%", marginBottom: 12 }}>
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
        </>
      ) : (
        <BootstrapInput strategy={strategy} setStrategy={setStrategy} />
      )}
    </Collapsible>
  );
}

export function BootstrapInput({ strategy, setStrategy }) {
  const { t } = useT();
  const [raw, setRaw] = useState("");
  const [errors, setErrors] = useState([]);
  const stats = strategy.bootstrapStats;
  const parse = (text) => {
    const { data, stats: s, errors: errs } = parseBootstrapData(text);
    setErrors(errs || []);
    setStrategy({ ...strategy, bootstrapData: data, bootstrapStats: s });
  };
  const pasteClip = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRaw(text); parse(text);
    } catch { setErrors(["Clipboard access denied"]); }
  };
  const loadExample = () => {
    const text = exampleAsCSV();
    setRaw(text);
    parse(text);
  };
  return (
    <div data-testid="bootstrap-input">
      <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                    fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
        {t("bootstrap_help")}
      </div>
      <textarea
        className="fg-input"
        style={{ minHeight: 140, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.5 }}
        placeholder={t("bootstrap_placeholder")}
        value={raw}
        onChange={(e) => { setRaw(e.target.value); parse(e.target.value); }}
        data-testid="bootstrap-textarea"
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="fg-btn-ghost" onClick={() => parse(raw)} data-testid="bootstrap-parse"
                style={{ flex: 1, minWidth: 120 }}>
          {t("bootstrap_parse")}
        </button>
        <button className="fg-btn-ghost" onClick={pasteClip} data-testid="bootstrap-paste">
          {t("bootstrap_paste_clip")}
        </button>
        <button className="fg-btn-ghost" onClick={loadExample} data-testid="bootstrap-load-example">
          {t("bootstrap_load_example")}
        </button>
      </div>

      {errors.length > 0 && (
        <div style={{ marginTop: 10, color: C.cinnabar, fontSize: 12, fontStyle: "italic",
                      fontFamily: "var(--plex)" }}>
          {errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
        </div>
      )}

      {stats && (
        <div style={{ marginTop: 14, padding: 14, background: C.leather, border: `1px solid ${C.dust}` }}
             data-testid="bootstrap-summary">
          <div style={{ fontFamily: "var(--plex)", fontSize: 11, letterSpacing: 0.2,
                        textTransform: "uppercase", color: C.steel, marginBottom: 10 }}>
            § {t("bootstrap_summary_title")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontFamily: "var(--mono)", fontSize: 12.5 }}>
            <div><span style={{ color: C.smoke }}>total days:</span> <span style={{ color: C.bone }}>{stats.total}</span></div>
            <div><span style={{ color: C.smoke }}>WR:</span> <span style={{ color: C.bone }}>{(stats.wr * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: C.smoke }}>wins:</span> <span style={{ color: C.bone }}>{stats.wins}</span></div>
            <div><span style={{ color: C.smoke }}>losses:</span> <span style={{ color: C.bone }}>{stats.losses}</span></div>
            <div><span style={{ color: C.smoke }}>μ win:</span> <span style={{ color: C.bone }}>{stats.meanWin.toFixed(0)}</span></div>
            <div><span style={{ color: C.smoke }}>μ loss:</span> <span style={{ color: C.bone }}>{stats.meanLoss.toFixed(0)}</span></div>
            <div><span style={{ color: C.smoke }}>best:</span> <span style={{ color: C.bone }}>+{stats.best.toFixed(0)}</span></div>
            <div><span style={{ color: C.smoke }}>worst:</span> <span style={{ color: C.bone }}>{stats.worst.toFixed(0)}</span></div>
            <div><span style={{ color: C.smoke }}>MAE column:</span>
              <span style={{ color: stats.hasMae ? C.bone : C.cinnabar }}> {stats.hasMae ? "yes" : "no"}</span>
            </div>
            <div><span style={{ color: C.smoke }}>autocorr:</span>
              <span style={{ color: Math.abs(stats.autocorrelation) > 0.2 ? C.cinnabar : C.bone }}>
                {" "}{stats.autocorrelation.toFixed(2)}
              </span>
            </div>
          </div>
          {stats.total >= 100
            ? <div style={{ marginTop: 8, color: C.brass, fontSize: 11.5, fontFamily: "var(--plex)" }}>
                ✓ {stats.total} samples (recommended ≥100)
              </div>
            : <div style={{ marginTop: 8, color: C.cinnabar, fontSize: 11.5, fontFamily: "var(--plex)" }}>
                ⚠ {t("bootstrap_min_warning")}
              </div>}
        </div>
      )}
    </div>
  );
}

export function IntradayRiskSection({ strategy, setStrategy }) {
  const { t } = useT();
  const maeMode = strategy.maeMode || "estimate";
  const hasBootMae = strategy.mode === "bootstrap" && strategy.bootstrapStats?.hasMae;
  return (
    <Collapsible title={t("section_mae_v2")} testId="section-mae">
      <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                    fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
        {t("mae_help")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {[
          { id: "estimate", label: t("mae_estimate") },
          { id: "manual",   label: t("mae_manual") },
          { id: "auto",     label: t("mae_auto"), disabled: !hasBootMae },
        ].map(m => (
          <label key={m.id} style={{ cursor: m.disabled ? "not-allowed" : "pointer",
                                      opacity: m.disabled ? 0.4 : 1, display: "flex", alignItems: "center", gap: 8 }}
                 data-testid={`mae-mode-${m.id}`}>
            <input type="radio" name="mae-mode" checked={maeMode === m.id}
                   disabled={m.disabled}
                   onChange={() => setStrategy({ ...strategy, maeMode: m.id })}
                   style={{ accentColor: C.cinnabar }} />
            <span style={{ fontFamily: "var(--plex)", fontSize: 12.5,
                           color: maeMode === m.id ? C.cinnabar : C.bone }}>
              {m.label}
            </span>
          </label>
        ))}
      </div>
      {maeMode === "estimate" && (
        <div>
          <label className="fg-label" style={{ marginBottom: 6, display: "block" }}>{t("field_instrument")}</label>
          <select className="fg-select" value={strategy.instrument || "nq"}
                  onChange={(e) => setStrategy({ ...strategy, instrument: e.target.value })}
                  data-testid="strat-instrument">
            {Object.entries(INSTRUMENT_MAE_RATIOS).map(([k, v]) =>
              <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ marginTop: 10, padding: 10, background: C.leather, border: `1px solid ${C.dust}`,
                        fontFamily: "var(--mono)", fontSize: 11.5, color: C.linen }}>
            {(() => {
              const r = INSTRUMENT_MAE_RATIOS[strategy.instrument || "nq"] || INSTRUMENT_MAE_RATIOS.nq;
              return (<>
                <div>win-day MAE ≈ σwin × {r.winScale.toFixed(2)} = {(strategy.sigmaWin * r.winScale).toFixed(0)}</div>
                <div>loss-day MAE ≈ |loss| × {r.lossRatio.toFixed(1)} = {(Math.abs(strategy.muLoss) * r.lossRatio).toFixed(0)}</div>
              </>);
            })()}
          </div>
        </div>
      )}
      {maeMode === "manual" && (
        <div>
          <NumField label={t("field_mae_win_mean")}  prefix="$" value={strategy.maeWinMean ?? 0}
                    onChange={v => setStrategy({ ...strategy, maeWinMean: v })}   testId="strat-maewinmean" />
          <NumField label={t("field_mae_win_std")}   prefix="$" value={strategy.maeWinStd ?? 0}
                    onChange={v => setStrategy({ ...strategy, maeWinStd: v })}    testId="strat-maewinstd" />
          <NumField label={t("field_mae_loss_mean")} prefix="$" value={strategy.maeLossMean ?? 0}
                    onChange={v => setStrategy({ ...strategy, maeLossMean: v })}  testId="strat-maelossmean" />
          <NumField label={t("field_mae_loss_std")}  prefix="$" value={strategy.maeLossStd ?? 0}
                    onChange={v => setStrategy({ ...strategy, maeLossStd: v })}   testId="strat-maelossstd" />
        </div>
      )}
      {maeMode === "auto" && (
        <div style={{ color: C.brass, fontFamily: "var(--plex)", fontSize: 12.5, fontStyle: "italic" }}>
          ✓ {t("mae_auto_ok")}
        </div>
      )}
    </Collapsible>
  );
}

export function CostsSection({ strategy, setStrategy }) {
  const { t } = useT();
  const cm = strategy.commissionMode || "none";
  const daily = cm === "estimate"
    ? (strategy.commissionPerRT || 0) * (strategy.tradesPerDay || 0) * (strategy.contractsPerTrade || 1)
    : cm === "fixed" ? (strategy.dailyCommission || 0) : 0;
  return (
    <Collapsible title={t("section_costs")} testId="section-costs"
                 badge={daily > 0 ? `−$${daily.toFixed(0)}/day` : null}
                 badgeColor={daily > 0 ? C.cinnabar : C.brass}>
      <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                    fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
        {t("costs_help")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[
          { id: "none",     label: t("costs_none") },
          { id: "estimate", label: t("costs_estimate") },
          { id: "fixed",    label: t("costs_fixed") },
        ].map(m => (
          <label key={m.id} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                 data-testid={`costs-mode-${m.id}`}>
            <input type="radio" name="costs-mode" checked={cm === m.id}
                   onChange={() => setStrategy({ ...strategy, commissionMode: m.id })}
                   style={{ accentColor: C.cinnabar }} />
            <span style={{ fontFamily: "var(--plex)", fontSize: 12.5,
                           color: cm === m.id ? C.cinnabar : C.bone }}>{m.label}</span>
          </label>
        ))}
      </div>
      {cm === "estimate" && (
        <div>
          <NumField label={t("field_comm_per_rt")} prefix="$" value={strategy.commissionPerRT}
                    onChange={v => setStrategy({ ...strategy, commissionPerRT: v })}
                    testId="strat-commrt" step={0.1} />
          <NumField label={t("field_trades_day")} value={strategy.tradesPerDay}
                    onChange={v => setStrategy({ ...strategy, tradesPerDay: v })}
                    testId="strat-tradesday" step={1} />
          <NumField label={t("field_contracts_trade")} value={strategy.contractsPerTrade}
                    onChange={v => setStrategy({ ...strategy, contractsPerTrade: v })}
                    testId="strat-contracts" step={1} />
          <div style={{ marginTop: 10, padding: 10, background: C.leather, border: `1px solid ${C.dust}`,
                        fontFamily: "var(--mono)", fontSize: 12, color: C.cinnabar }}>
            → daily cost: −${daily.toFixed(2)}
          </div>
        </div>
      )}
      {cm === "fixed" && (
        <NumField label={t("field_daily_commission")} prefix="$" value={strategy.dailyCommission}
                  onChange={v => setStrategy({ ...strategy, dailyCommission: v })}
                  testId="strat-dailycomm" step={1} />
      )}
    </Collapsible>
  );
}

export function BehavioralSection({ strategy, setStrategy }) {
  const { t } = useT();
  const postMode = strategy.postTargetMode || "conservative";
  const minDaysType = strategy.minDaysType || "total";
  const maxDaysType = strategy.maxDaysType || "trading";
  const Radio = ({ name, options, value, onChange, testPrefix }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      {options.map(o => (
        <label key={o.id} style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}
               data-testid={`${testPrefix}-${o.id}`}>
          <input type="radio" name={name} checked={value === o.id}
                 onChange={() => onChange(o.id)}
                 style={{ accentColor: C.cinnabar, marginTop: 3 }} />
          <div>
            <div style={{ fontFamily: "var(--plex)", fontSize: 12.5,
                          color: value === o.id ? C.cinnabar : C.bone, fontWeight: 500 }}>
              {o.label}
            </div>
            {o.sub && <div style={{ fontFamily: "var(--plex)", fontStyle: "italic",
                                     color: C.linen, fontSize: 11.5, fontWeight: 300, marginTop: 2 }}>
              {o.sub}
            </div>}
          </div>
        </label>
      ))}
    </div>
  );
  return (
    <Collapsible title={t("section_behavioral")} testId="section-behavioral">
      <div className="fg-label" style={{ marginBottom: 8 }}>{t("behav_post_title")}</div>
      <Radio name="post-mode" testPrefix="behav-post"
             value={postMode} onChange={v => setStrategy({ ...strategy, postTargetMode: v })}
             options={[
               { id: "conservative", label: t("behav_conservative"),  sub: t("behav_conservative_sub") },
               { id: "aggressive",   label: t("behav_aggressive"),    sub: t("behav_aggressive_sub") },
             ]} />
      <div style={{ borderTop: `1px dotted ${C.haze}`, margin: "10px 0" }} />
      <div className="fg-label" style={{ marginBottom: 8 }}>{t("behav_mindays_title")}</div>
      <Radio name="mindays-type" testPrefix="behav-mindays"
             value={minDaysType} onChange={v => setStrategy({ ...strategy, minDaysType: v })}
             options={[
               { id: "total",   label: t("behav_mindays_total") },
               { id: "winning", label: t("behav_mindays_winning") },
             ]} />
      {minDaysType === "winning" && (
        <NumField label={t("field_win_day_threshold")} prefix="$" value={strategy.winDayThreshold}
                  onChange={v => setStrategy({ ...strategy, winDayThreshold: v })}
                  testId="strat-windaythresh" />
      )}
      <div style={{ borderTop: `1px dotted ${C.haze}`, margin: "10px 0" }} />
      <div className="fg-label" style={{ marginBottom: 8 }}>{t("behav_maxdays_title")}</div>
      <Radio name="maxdays-type" testPrefix="behav-maxdays"
             value={maxDaysType} onChange={v => setStrategy({ ...strategy, maxDaysType: v })}
             options={[
               { id: "trading",  label: t("behav_maxdays_trading") },
               { id: "calendar", label: t("behav_maxdays_calendar") },
             ]} />
    </Collapsible>
  );
}

// ─────────────────────────── Post-PASS (funded cycle) section ───────────────────────────
export function PostPassSection({ strategy, setStrategy, firmId, plan }) {
  const { t } = useT();
  const enabled = !!strategy.postPassEnabled;
  const horizon = strategy.postPassHorizonMonths ?? 6;
  const sizeMode = strategy.postPassSizeMode || "same";
  const sizeFactor = strategy.postPassSizeFactor ?? 0.5;
  const ov = useMemo(() => strategy.fundedOverride || {}, [strategy.fundedOverride]);

  // Effective resolved rules (firm defaults + override) for display
  const effective = useMemo(() => {
    if (!plan) return null;
    try { return resolveFundedRules(plan, firmId, ov); } catch { return null; }
  }, [plan, firmId, ov]);

  const setOv = (patch) =>
    setStrategy({ ...strategy, fundedOverride: { ...(strategy.fundedOverride || {}), ...patch } });

  const resetDefaults = () =>
    setStrategy({ ...strategy, fundedOverride: {} });

  const Radio = ({ name, options, value, onChange, testPrefix }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      {options.map(o => (
        <label key={o.id} style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}
               data-testid={`${testPrefix}-${o.id}`}>
          <input type="radio" name={name} checked={value === o.id}
                 onChange={() => onChange(o.id)}
                 style={{ accentColor: C.cinnabar, marginTop: 3 }} />
          <div>
            <div style={{ fontFamily: "var(--plex)", fontSize: 12.5,
                          color: value === o.id ? C.cinnabar : C.bone, fontWeight: 500 }}>
              {o.label}
            </div>
            {o.sub && <div style={{ fontFamily: "var(--plex)", fontStyle: "italic",
                                     color: C.linen, fontSize: 11.5, fontWeight: 300, marginTop: 2 }}>
              {o.sub}
            </div>}
          </div>
        </label>
      ))}
    </div>
  );

  return (
    <Collapsible title={t("section_postpass")} testId="section-postpass"
                 badge={enabled ? "ON" : "OFF"} badgeColor={enabled ? C.brass : C.haze}>
      {/* Toggle */}
      <ToggleRow label={t("postpass_toggle")} on={enabled}
                 onToggle={(v) => setStrategy({ ...strategy, postPassEnabled: v })}
                 testId="pp-toggle">
        <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                      fontSize: 11.5, marginTop: 4 }}>
          › {t("postpass_toggle_hint")}
        </div>
      </ToggleRow>

      {enabled && (
        <>
          <div style={{ borderTop: `1px dotted ${C.haze}`, margin: "12px 0" }} />

          {/* Horizon slider */}
          <div style={{ marginBottom: 12 }}>
            <div className="fg-label" style={{ marginBottom: 6 }}>
              {t("postpass_horizon")} · <span style={{ color: C.brass }}>{horizon}m</span>
            </div>
            <input type="range" min={1} max={24} step={1} value={horizon}
                   onChange={(e) => setStrategy({ ...strategy, postPassHorizonMonths: parseInt(e.target.value, 10) })}
                   data-testid="pp-horizon"
                   style={{ width: "100%", accentColor: C.brass }} />
            <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                          fontSize: 11, marginTop: 3 }}>
              › {t("postpass_horizon_hint")} ({horizon * 21} trading days)
            </div>
          </div>

          <div style={{ borderTop: `1px dotted ${C.haze}`, margin: "12px 0" }} />

          {/* Size mode */}
          <div className="fg-label" style={{ marginBottom: 8 }}>{t("postpass_size_title")}</div>
          <Radio name="pp-size" testPrefix="pp-size"
                 value={sizeMode}
                 onChange={v => setStrategy({ ...strategy, postPassSizeMode: v })}
                 options={[
                   { id: "same",    label: t("postpass_size_same"),    sub: t("postpass_size_same_sub") },
                   { id: "reduced", label: t("postpass_size_reduced"), sub: t("postpass_size_reduced_sub") },
                 ]} />
          {sizeMode === "reduced" && (
            <div style={{ marginBottom: 12 }}>
              <div className="fg-label" style={{ marginBottom: 6 }}>
                {t("postpass_size_factor")} · <span style={{ color: C.brass }}>{Math.round(sizeFactor * 100)}%</span>
              </div>
              <input type="range" min={0.05} max={1.0} step={0.05} value={sizeFactor}
                     onChange={(e) => setStrategy({ ...strategy, postPassSizeFactor: parseFloat(e.target.value) })}
                     data-testid="pp-size-factor"
                     style={{ width: "100%", accentColor: C.brass }} />
            </div>
          )}

          <div style={{ borderTop: `1px dotted ${C.haze}`, margin: "12px 0" }} />

          {/* Rules overrides */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: 8 }}>
            <div className="fg-label">{t("postpass_rules_title")}</div>
            <button className="fg-btn-ghost" onClick={resetDefaults} data-testid="pp-reset"
                    style={{ fontSize: 10.5, padding: "3px 8px" }}>
              ⟳ {t("postpass_reset")}
            </button>
          </div>
          <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                        fontSize: 11.5, marginBottom: 10 }}>
            › {t("postpass_rules_hint")}
          </div>

          {effective && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
              <NumField label={t("pp_firstPayoutMinDays")} value={ov.firstPayoutMinDays ?? effective.firstPayoutMinDays}
                        onChange={v => setOv({ firstPayoutMinDays: v })} testId="pp-firstdays" width={90} />
              <NumField label={t("pp_payoutFrequency")}    value={ov.payoutFrequency    ?? effective.payoutFrequency}
                        onChange={v => setOv({ payoutFrequency: v })}    testId="pp-freq" width={90} />
              <NumField label={t("pp_payoutBuffer")}  prefix="$" value={ov.payoutBuffer ?? effective.payoutBuffer}
                        onChange={v => setOv({ payoutBuffer: v })} testId="pp-buffer" width={90} />
              <NumField label={t("pp_payoutMinAmount")} prefix="$" value={ov.payoutMinAmount ?? effective.payoutMinAmount}
                        onChange={v => setOv({ payoutMinAmount: v })} testId="pp-min" width={90} />
              <NumField label={t("pp_payoutMaxPct")}  step={0.05} value={ov.payoutMaxPct ?? effective.payoutMaxPct}
                        onChange={v => setOv({ payoutMaxPct: v })} testId="pp-maxpct" width={90} />
              <NumField label={t("pp_payoutMaxCap")}  prefix="$" value={ov.payoutMaxCap ?? effective.payoutMaxCap ?? null}
                        onChange={v => setOv({ payoutMaxCap: v })} testId="pp-cap" width={90} />
              <NumField label={t("pp_safetyNet")}     prefix="$" value={ov.safetyNet ?? effective.safetyNet}
                        onChange={v => setOv({ safetyNet: v })} testId="pp-safety" width={90} />
              <NumField label={t("pp_payoutConsistency")} step={0.05}
                        value={ov.payoutConsistency ?? effective.payoutConsistency ?? null}
                        onChange={v => setOv({ payoutConsistency: v })} testId="pp-cons" width={90} />
              <SelectField label={t("pp_payoutConsistencyType")}
                           value={ov.payoutConsistencyType ?? effective.payoutConsistencyType ?? ""}
                           onChange={v => setOv({ payoutConsistencyType: v })} testId="pp-cons-type"
                           options={[{ value: "", label: "—" }, { value: "vs_total", label: "vs_total" }]} />
              <SelectField label={t("pp_ddTypeOverride")}
                           value={ov.ddTypeOverride ?? effective.ddType}
                           onChange={v => setOv({ ddTypeOverride: v })} testId="pp-ddtype"
                           options={[
                             { value: "static",             label: "static" },
                             { value: "trailing_eod",       label: "trailing_eod" },
                             { value: "trailing_intraday",  label: "trailing_intraday" },
                           ]} />
              <NumField label={t("pp_ddValueOverride")} prefix="$" value={ov.ddValueOverride ?? effective.ddValue}
                        onChange={v => setOv({ ddValueOverride: v })} testId="pp-ddvalue" width={90} />
              <SelectField label={t("pp_floorLockOverride")}
                           value={ov.floorLockOverride ?? effective.floorLock ?? "none"}
                           onChange={v => setOv({ floorLockOverride: v })} testId="pp-floorlock"
                           options={[
                             { value: "none",                 label: "none" },
                             { value: "at_capital",           label: "at_capital" },
                             { value: "at_target_level",      label: "at_target_level" },
                             { value: "at_capital_plus_100",  label: "at_capital_plus_100" },
                           ]} />
              <NumField label={t("pp_dailyLossOverride")} prefix="$" value={ov.dailyLossOverride ?? effective.dailyLoss ?? null}
                        onChange={v => setOv({ dailyLossOverride: v })} testId="pp-dll" width={90} />
              <ToggleRow label={t("pp_resetOnPayout")}
                         on={ov.resetOnPayout ?? effective.resetOnPayout}
                         onToggle={v => setOv({ resetOnPayout: v })}
                         testId="pp-reset-balance" />
              <ToggleRow label={t("pp_resetFloorOnPayout")}
                         on={ov.resetFloorOnPayout ?? effective.resetFloorOnPayout}
                         onToggle={v => setOv({ resetFloorOnPayout: v })}
                         testId="pp-reset-floor" />
            </div>
          )}
        </>
      )}
    </Collapsible>
  );
}
