// Final CTA panel just before the footer.
import { useT } from "../LangContext";
import { C } from "../../lib/colors";

export default function LandingCTA({ onCTAClick }) {
  const { t } = useT();
  return (
    <section data-testid="landing-final-cta" style={{
      padding: "80px 0 60px",
      textAlign: "center",
    }}>
      <h2 style={{
        fontFamily: "var(--fraunces)",
        fontVariationSettings: "'opsz' 144, 'WONK' 1",
        fontWeight: 900,
        fontSize: "clamp(32px, 5vw, 52px)",
        color: C.bone,
        letterSpacing: "-0.02em",
        margin: 0,
        lineHeight: 1.05,
      }}>
        {t("landing_finalcta_title")}
      </h2>
      <p style={{
        fontFamily: "var(--plex)",
        fontStyle: "italic",
        fontSize: 16,
        color: C.linen,
        marginTop: 18,
        maxWidth: 600,
        marginInline: "auto",
        lineHeight: 1.5,
      }}>
        {t("landing_finalcta_subtitle")}
      </p>
      <button onClick={onCTAClick}
              data-testid="landing-final-cta-btn"
              style={{
                marginTop: 32,
                background: C.cinnabar,
                color: C.bone,
                border: "none",
                padding: "18px 36px",
                fontFamily: "var(--plex)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
        {t("landing_finalcta_button")} →
      </button>
    </section>
  );
}
