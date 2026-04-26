import { C } from "../../lib/colors";
import { useT } from "../LangContext";

export default function CustomCard({ selected, locked = false, onClick }) {
  const { t } = useT();
  return (
    <div onClick={onClick} data-testid="firm-custom"
         className={`fg-card custom-card ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
         style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14,
                  justifyContent: "space-between", position: "relative",
                  opacity: locked ? 0.78 : 1 }}>
      {locked && (
        <span data-testid="firm-custom-lock" style={{
          position: "absolute", top: 12, right: 12,
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 9.5, fontFamily: "var(--mono)", color: C.brass,
          letterSpacing: "0.12em", padding: "3px 7px",
          border: `1px solid ${C.brass}`,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          PRO
        </span>
      )}
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
            · custom build
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
