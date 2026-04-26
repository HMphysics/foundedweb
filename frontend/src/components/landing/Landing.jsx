// Landing page — public, marketing-oriented entry point shown to anonymous
// visitors at "/". Logged-in users are redirected to /app at the routing layer.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useT } from "../LangContext";
import { C } from "../../lib/colors";
import AuthModal from "../auth/AuthModal";
import HeaderSeal from "../layout/HeaderSeal";
import { LangToggle } from "../layout/Header";
import Footer from "../layout/Footer";
import LandingHero from "./LandingHero";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingPricing from "./LandingPricing";
import LandingFAQ from "./LandingFAQ";
import LandingCTA from "./LandingCTA";

function LandingHeader({ onCTAClick, onSignInClick, t, lang, setLang }) {
  return (
    <header style={{
      maxWidth: 1100, margin: "0 auto",
      padding: "26px 24px 0",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
    }} data-testid="landing-header">
      <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}
         data-testid="landing-logo">
        <HeaderSeal />
        <div>
          <div style={{ fontFamily: "var(--fraunces)", fontVariationSettings: "'opsz' 144, 'WONK' 1",
                        fontWeight: 900, fontSize: 24, color: C.bone, letterSpacing: "-0.02em",
                        lineHeight: 1 }}>
            PROP · FORGE
          </div>
          <div style={{ fontFamily: "var(--plex)", fontSize: 11, color: C.smoke,
                        marginTop: 4, fontStyle: "italic" }}>
            monte carlo for prop firm challenges
          </div>
        </div>
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <LangToggle lang={lang} setLang={setLang} />
        <button onClick={onSignInClick}
                data-testid="landing-signin"
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  fontFamily: "var(--plex)", fontSize: 13, color: C.linen,
                  letterSpacing: 0.05,
                }}>
          {t("auth_sign_in")}
        </button>
        <button onClick={onCTAClick}
                data-testid="landing-header-cta"
                style={{
                  background: C.brass, color: C.ink,
                  border: "none", padding: "10px 18px",
                  fontFamily: "var(--plex)", fontSize: 12, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer",
                }}>
          {t("landing_hero_cta")}
        </button>
      </div>
    </header>
  );
}

export default function Landing() {
  const { t, lang, setLang } = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState("signup");

  // Every CTA on the landing routes through this. Already logged-in users
  // (edge case — they shouldn't see the landing) are sent to the app.
  const handleCTA = () => {
    if (user) {
      navigate("/app");
      return;
    }
    setAuthInitialMode("signup");
    setAuthOpen(true);
  };

  const handleSignIn = () => {
    if (user) {
      navigate("/app");
      return;
    }
    setAuthInitialMode("signin");
    setAuthOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", color: C.linen, background: C.ink }}
         data-testid="landing-root">
      <LandingHeader onCTAClick={handleCTA} onSignInClick={handleSignIn} t={t} lang={lang} setLang={setLang} />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <LandingHero onCTAClick={handleCTA} />
        <LandingHowItWorks />
        <LandingPricing onCTAClick={handleCTA} />
        <LandingFAQ />
        <LandingCTA onCTAClick={handleCTA} />
      </main>
      <Footer />
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} initialMode={authInitialMode} />
      )}
    </div>
  );
}
