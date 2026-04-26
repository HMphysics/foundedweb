// Hero section — first impression, value prop and primary CTA.
import { useT } from "../LangContext";
import { C } from "../../lib/colors";

export default function LandingHero({ onCTAClick }) {
  const { t } = useT();
  return (
    <section style={{ padding: "96px 0 80px", textAlign: "left" }}
             data-testid="landing-hero">
      <h1 style={{
        fontFamily: "var(--fraunces)",
        fontVariationSettings: "'opsz' 144, 'WONK' 1",
        fontWeight: 900,
        fontSize: "clamp(40px, 6vw, 68px)",
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        color: C.bone,
        margin: 0,
        maxWidth: 920,
      }}>
        {t("landing_hero_title")}
      </h1>
      <p style={{
        fontFamily: "var(--plex)",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 18,
        lineHeight: 1.5,
        color: C.linen,
        marginTop: 28,
        maxWidth: 720,
      }}>
        {t("landing_hero_subtitle")}
      </p>
      <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <button onClick={onCTAClick}
                data-testid="landing-hero-cta"
                style={{
                  background: C.cinnabar,
                  color: C.bone,
                  border: "none",
                  padding: "16px 28px",
                  fontFamily: "var(--plex)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}>
          {t("landing_hero_cta")} →
        </button>
        <span style={{
          fontFamily: "var(--plex)",
          fontStyle: "italic",
          fontSize: 12.5,
          color: C.smoke,
        }}>
          {t("landing_hero_subhint")}
        </span>
      </div>
    </section>
  );
}
