// Reusable small chart primitives (tooltip + titles + empty state) used
// by multiple dashboards (ResultsDashboard and FundedLifecyclePanel).
import { C } from "../lib/colors";
import { useT } from "./LangContext";

export function CTooltip({ active, payload, label, unit = "%" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: C.ink, border: `1px solid ${C.brass}`,
      padding: "6px 10px", fontFamily: "var(--mono)", fontSize: 11,
      boxShadow: "0 0 16px rgba(255,184,0,0.2)",
    }}>
      <div style={{ color: C.smoke }}>› {label}</div>
      <div style={{ color: C.brass }}>{payload[0].value}{unit}</div>
    </div>
  );
}

export function ChartTitle({ title, caption }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: C.bone, fontSize: 11, fontWeight: 700, letterSpacing: 0.25, textTransform: "uppercase" }}>
        {title}
      </div>
      {caption && <div style={{ color: C.smoke, fontSize: 10, marginTop: 3, letterSpacing: 0.08 }}>› {caption}</div>}
    </div>
  );
}

export function EmptyChart() {
  const { t } = useT();
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.haze, fontSize: 11, letterSpacing: 0.2 }}>
      {t("chart_empty")}
    </div>
  );
}
