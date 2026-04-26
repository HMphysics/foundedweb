// "How it works" — three numbered steps.
import { useT } from "../LangContext";
import { C } from "../../lib/colors";

export default function LandingHowItWorks() {
  const { t } = useT();
  return (
    <section style={{ padding: "60px 0" }} data-testid="landing-how">
      <h2 style={{
        fontFamily: "var(--fraunces)",
        fontVariationSettings: "'opsz' 144, 'WONK' 1",
        fontWeight: 900,
        fontSize: 36,
        color: C.bone,
        letterSpacing: "-0.01em",
        margin: 0,
        marginBottom: 32,
      }}>
        {t("landing_how_title")}
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {[1, 2, 3].map(n => (
          <div key={n} data-testid={`landing-step-${n}`} style={{
            background: C.archive,
            border: `1px solid ${C.dust}`,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>
            <div style={{
              fontFamily: "var(--fraunces)",
              fontVariationSettings: "'opsz' 144, 'WONK' 1",
              fontWeight: 900,
              fontSize: 48,
              color: C.brass,
              opacity: 0.6,
              lineHeight: 1,
            }}>
              {n.toString().padStart(2, "0")}
            </div>
            <div style={{
              fontFamily: "var(--plex)",
              fontSize: 18,
              fontWeight: 600,
              color: C.bone,
              lineHeight: 1.3,
            }}>
              {t(`landing_step_${n}_title`)}
            </div>
            <div style={{
              fontFamily: "var(--plex)",
              fontStyle: "italic",
              fontSize: 14,
              fontWeight: 300,
              color: C.linen,
              lineHeight: 1.55,
            }}>
              {t(`landing_step_${n}_desc`)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
