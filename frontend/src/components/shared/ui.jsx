// Reusable UI atoms shared across tabs and dashboards.
import { useState } from "react";
import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import { TOOLTIPS } from "../../i18n";

export function Tag({ children, color = C.linen }) {
  return <span className="fg-tag" style={{ color }}>{children}</span>;
}

export function SectionBar({ label }) {
  return (
    <div className="fg-sec">
      <span>§ {label}</span>
      <span style={{ color: C.dust, letterSpacing: 0 }}>━━━━━━━━━━</span>
    </div>
  );
}

export function Toggle({ on, onChange, testId }) {
  return (
    <div className={`fg-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}
         data-testid={testId} role="switch" aria-checked={on} />
  );
}

export function InfoTooltip({ id }) {
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
                       color: C.smoke, fontSize: 11, padding: "0 4px", lineHeight: 1 }}
              onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}>
        ⓘ
      </button>
      {open && (
        <div style={{
          position: "absolute", left: "100%", top: "-4px", marginLeft: 6,
          width: 320, zIndex: 50,
          background: C.leather, border: `1px solid ${C.brass}`,
          padding: 12, boxShadow: "0 0 24px rgba(255,184,0,0.25)",
          fontFamily: "var(--mono)",
          pointerEvents: "none",
        }}>
          <div style={{ color: C.brass, fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
                        textTransform: "uppercase", marginBottom: 6 }}>
            § {tip.title}
          </div>
          <div style={{ color: C.linen, fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {tip.body}
          </div>
        </div>
      )}
    </span>
  );
}

export function NumField({ label, value, onChange, step = 1, disabled = false, prefix, testId, width = 120, tip }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
      <label className="fg-label" style={{ flex: 1, display: "inline-flex", alignItems: "center" }}>
        {label}
        {tip && <InfoTooltip id={tip} />}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 4, width }}>
        {prefix && <span style={{ color: C.smoke, fontSize: 11 }}>{prefix}</span>}
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

export function SelectField({ label, value, onChange, options, disabled = false, testId, tip }) {
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

export function ToggleRow({ label, on, onToggle, testId, tip, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label className="fg-label" style={{ display: "inline-flex", alignItems: "center" }}>
          {label}
          {tip && <InfoTooltip id={tip} />}
        </label>
        <Toggle on={on} onChange={onToggle} testId={testId} />
      </div>
      {on && <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: `1px dashed ${C.haze}` }}>{children}</div>}
    </div>
  );
}

export function Kpi({ label, value, sub, color = C.bone, testId, tip }) {
  return (
    <div className="fg-panel" style={{ padding: "14px 16px" }} data-testid={testId}>
      <div className="fg-label" style={{ marginBottom: 10, color: C.smoke, display: "inline-flex", alignItems: "center" }}>
        › {label}{tip && <InfoTooltip id={tip} />}
      </div>
      <div className="fg-kpi" style={{ color }}>{value}</div>
      {sub && <div style={{ color: C.smoke, fontSize: 10.5, marginTop: 8, letterSpacing: 0.05 }}>› {sub}</div>}
    </div>
  );
}

export function Warn({ prefix = "//", children, color = C.brass }) {
  return (
    <div style={{
      display: "flex", gap: 10, padding: "8px 12px",
      borderLeft: `2px solid ${color}`,
      background: `${color}0A`,
      marginBottom: 6, fontSize: 12, lineHeight: 1.55,
    }}>
      <div style={{ color, fontWeight: 700, opacity: 0.9 }}>{prefix}</div>
      <div style={{ color: C.linen, flex: 1 }}>{children}</div>
    </div>
  );
}

export function Collapsible({ title, testId, badge, badgeColor = C.brass, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="fg-panel" style={{ padding: 0 }} data-testid={testId}>
      <button onClick={() => setOpen(v => !v)}
              style={{ width: "100%", background: "transparent", border: 0, color: C.linen,
                       padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                       fontFamily: "var(--plex)", fontSize: 12, letterSpacing: 0.18,
                       fontWeight: 500, textTransform: "uppercase", cursor: "pointer" }}
              data-testid={`${testId}-toggle`}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.brass, fontFamily: "var(--mono)" }}>{open ? "▼" : "►"}</span>
          {title}
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px",
                           border: `1px solid ${badgeColor}`, color: badgeColor, letterSpacing: 0.1 }}>
              {badge}
            </span>
          )}
        </span>
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}
