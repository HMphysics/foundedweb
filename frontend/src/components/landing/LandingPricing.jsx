// Pricing section — three tiers (Free, Pro highlighted, Lifetime).
import { useT } from "../LangContext";
import { C } from "../../lib/colors";

function PricingCard({
  tier, price, priceSub, features, ctaLabel, onCTAClick, featured,
}) {
  return (
    <div data-testid={`pricing-card-${tier}`} style={{
      background: featured ? `${C.brass}08` : C.archive,
      border: `1px solid ${featured ? C.brass : C.dust}`,
      padding: 28,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "relative",
    }}>
      {featured && (
        <span data-testid="pricing-recommended-badge" style={{
          position: "absolute", top: 12, right: 12,
          fontSize: 9, fontFamily: "var(--mono)", color: C.brass,
          letterSpacing: "0.12em", padding: "2px 6px",
          border: `1px solid ${C.brass}`,
        }}>
          ★ RECOMMENDED
        </span>
      )}
      <div style={{
        fontFamily: "var(--plex)", fontSize: 12, fontWeight: 600,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: featured ? C.brass : C.smoke,
      }}>
        {tier}
      </div>
      <div>
        <div style={{
          fontFamily: "var(--fraunces)",
          fontVariationSettings: "'opsz' 144, 'WONK' 1",
          fontWeight: 900,
          fontSize: 40,
          color: C.bone,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {price}
        </div>
        <div style={{
          fontFamily: "var(--plex)",
          fontStyle: "italic",
          fontSize: 12,
          color: C.smoke,
          marginTop: 6,
        }}>
          {priceSub}
        </div>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0,
                   display: "flex", flexDirection: "column", gap: 8 }}>
        {features.map((f, i) => (
          <li key={i} style={{
            fontFamily: "var(--plex)",
            fontSize: 13,
            color: C.linen,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ color: C.brass, flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button onClick={onCTAClick}
              data-testid={`pricing-cta-${tier}`}
              style={{
                marginTop: "auto",
                background: featured ? C.brass : "transparent",
                color: featured ? C.ink : C.bone,
                border: `1px solid ${featured ? C.brass : C.dust}`,
                padding: "12px 18px",
                fontFamily: "var(--plex)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
        {ctaLabel}
      </button>
    </div>
  );
}

export default function LandingPricing({ onCTAClick }) {
  const { t } = useT();
  return (
    <section style={{ padding: "60px 0" }} data-testid="landing-pricing">
      <h2 style={{
        fontFamily: "var(--fraunces)",
        fontVariationSettings: "'opsz' 144, 'WONK' 1",
        fontWeight: 900,
        fontSize: 36,
        color: C.bone,
        letterSpacing: "-0.01em",
        margin: 0,
      }}>
        {t("landing_pricing_title")}
      </h2>
      <p style={{
        fontFamily: "var(--plex)",
        fontStyle: "italic",
        fontSize: 14,
        color: C.linen,
        margin: "10px 0 32px",
      }}>
        {t("landing_pricing_subtitle")}
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
      }}>
        <PricingCard
          tier="free"
          price="0€"
          priceSub={t("landing_price_forever")}
          features={[
            t("landing_free_feat_1"),
            t("landing_free_feat_2"),
            t("landing_free_feat_3"),
          ]}
          ctaLabel={t("landing_free_cta")}
          onCTAClick={onCTAClick}
        />
        <PricingCard
          tier="pro"
          price="31€"
          priceSub={t("landing_price_monthly")}
          features={[
            t("landing_pro_feat_1"),
            t("landing_pro_feat_2"),
            t("landing_pro_feat_3"),
            t("landing_pro_feat_4"),
            t("landing_pro_feat_5"),
            t("landing_pro_feat_6"),
          ]}
          ctaLabel={t("landing_pro_cta")}
          onCTAClick={onCTAClick}
          featured
        />
        <PricingCard
          tier="lifetime"
          price="199€"
          priceSub={t("landing_price_one_time")}
          features={[
            t("landing_lifetime_feat_1"),
            t("landing_lifetime_feat_2"),
            t("landing_lifetime_feat_3"),
          ]}
          ctaLabel={t("landing_lifetime_cta")}
          onCTAClick={onCTAClick}
        />
      </div>
    </section>
  );
}
