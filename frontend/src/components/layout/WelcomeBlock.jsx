import { C } from "../../lib/colors";
import { useT } from "../LangContext";

export default function WelcomeBlock({ onClose }) {
  const { t } = useT();
  return (
    <section style={{ maxWidth: 1600, margin: "16px auto 0", padding: "0 24px" }} data-testid="welcome-block">
      <div className="fg-panel fg-fadein" style={{
        padding: 18, borderStyle: "dashed", borderColor: C.brass,
        background: `${C.brass}06`,
      }}>
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
