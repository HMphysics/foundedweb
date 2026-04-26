// FAQ section — six collapsible questions.
import { useState } from "react";
import { useT } from "../LangContext";
import { C } from "../../lib/colors";

const FAQ_KEYS = ["what", "diff", "experience", "security", "cancel", "refund"];

function FaqItem({ qKey }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={`faq-${qKey}`} style={{
      borderTop: `1px solid ${C.dust}`,
    }}>
      <button onClick={() => setOpen(v => !v)}
              data-testid={`faq-${qKey}-toggle`}
              style={{
                width: "100%", background: "transparent", border: "none",
                cursor: "pointer", padding: "20px 0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "var(--plex)", fontSize: 16, fontWeight: 500,
                color: C.bone, textAlign: "left", letterSpacing: 0.02,
              }}>
        <span>{t(`landing_faq_${qKey}_q`)}</span>
        <span style={{
          color: C.brass, fontFamily: "var(--mono)", fontSize: 14,
          marginLeft: 16, flexShrink: 0,
        }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{
          fontFamily: "var(--plex)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 14,
          color: C.linen,
          lineHeight: 1.6,
          padding: "0 0 22px",
          maxWidth: 820,
        }}>
          {t(`landing_faq_${qKey}_a`)}
        </div>
      )}
    </div>
  );
}

export default function LandingFAQ() {
  const { t } = useT();
  return (
    <section style={{ padding: "60px 0" }} data-testid="landing-faq">
      <h2 style={{
        fontFamily: "var(--fraunces)",
        fontVariationSettings: "'opsz' 144, 'WONK' 1",
        fontWeight: 900,
        fontSize: 36,
        color: C.bone,
        letterSpacing: "-0.01em",
        margin: 0,
        marginBottom: 16,
      }}>
        {t("landing_faq_title")}
      </h2>
      <div>
        {FAQ_KEYS.map(k => <FaqItem key={k} qKey={k} />)}
        <div style={{ borderTop: `1px solid ${C.dust}` }} />
      </div>
    </section>
  );
}
