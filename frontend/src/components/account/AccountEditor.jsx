import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import { NumField, SelectField, Toggle, ToggleRow } from "../shared/ui";

export default function AccountEditor({ draft, onChange, onPhase2Change, unlocked, onResetToPreset }) {
  const { t } = useT();
  const d = draft;
  return (
    <div>
      <NumField label={t("field_capital")} prefix="$" value={d.capital} onChange={v => onChange({ capital: v })} disabled={!unlocked} testId="acc-capital" tip="capital" />
      <NumField label={t("field_target")}  prefix="$" value={d.target}  onChange={v => onChange({ target: v })}  disabled={!unlocked} testId="acc-target" tip="target" />
      <SelectField label={t("field_dd_type")} value={d.ddType} disabled={!unlocked} tip="dd_type"
                   options={[
                     { value: "trailing_eod",      label: t("dd_type_trailing_eod") },
                     { value: "trailing_intraday", label: t("dd_type_trailing_intraday") },
                     { value: "static",            label: t("dd_type_static") },
                   ]}
                   onChange={v => onChange({ ddType: v })} testId="acc-ddtype" />
      <NumField label={t("field_dd_value")} prefix="$" value={d.ddValue} onChange={v => onChange({ ddValue: v })} disabled={!unlocked} testId="acc-ddvalue" tip="dd_value" />
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
        <NumField label={t("field_consistency_pct")} value={d.consistency} step={0.01} onChange={v => onChange({ consistency: v })} disabled={!unlocked} testId="acc-consvalue" tip="consistency_pct" />
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
      <NumField label={t("field_fee")} prefix="$" value={d.fee} onChange={v => onChange({ fee: v })} disabled={!unlocked} testId="acc-fee" tip="fee" />
      <NumField label={t("field_activation_fee")} prefix="$" value={d.activationFee || 0} onChange={v => onChange({ activationFee: v ?? 0 })} disabled={!unlocked} testId="acc-activation" />
      <SelectField label={t("field_fee_type")} value={d.feeType || "one_time"} disabled={!unlocked}
                   options={[
                     { value: "one_time", label: t("fee_one_time") },
                     { value: "monthly",  label: t("fee_monthly") },
                   ]}
                   onChange={v => onChange({ feeType: v })} testId="acc-feetype" />
      <NumField label={t("field_profit_split")} value={d.profitSplit} step={0.01} onChange={v => onChange({ profitSplit: v })} disabled={!unlocked} testId="acc-split" tip="profit_split" />
      {onResetToPreset && (
        <button className="fg-btn-ghost" onClick={onResetToPreset} data-testid="btn-reset-preset"
                style={{ marginTop: 10, width: "100%" }}>{t("btn_reset_preset")}</button>
      )}
    </div>
  );
}
