import { useState } from "react";
import { FIRM_DATABASE } from "../../firmDatabase";
import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import { useAuth } from "../AuthContext";
import { useUserPlan } from "../UserPlanContext";
import { openCustomerPortal } from "../../lib/stripe";
import HeaderSeal from "./HeaderSeal";
import AuthModal from "../auth/AuthModal";

export function LangToggle({ lang, setLang }) {
  const active = { color: C.brass, fontWeight: 700 };
  const dim    = { color: C.smoke, cursor: "pointer" };
  return (
    <div style={{ fontSize: 12, letterSpacing: 0.2, fontFamily: "var(--mono)" }}
         data-testid="lang-toggle">
      <span style={{ color: C.smoke }}>[ </span>
      <span style={lang === "es" ? active : dim} onClick={() => setLang("es")}
            data-testid="lang-es" role="button" tabIndex={0}>
        {lang === "es" ? "ES" : "es"}
      </span>
      <span style={{ color: C.haze, margin: "0 6px" }}>·</span>
      <span style={lang === "en" ? active : dim} onClick={() => setLang("en")}
            data-testid="lang-en" role="button" tabIndex={0}>
        {lang === "en" ? "EN" : "en"}
      </span>
      <span style={{ color: C.smoke }}> ]</span>
    </div>
  );
}

function PlanBadge({ plan }) {
  const colors = {
    free: C.smoke,
    pro: C.brass,
    annual: C.cinnabar,
  };
  return (
    <span 
      style={{
        fontSize: 9,
        fontFamily: "var(--mono)",
        fontWeight: 600,
        letterSpacing: '0.15em',
        color: colors[plan] || C.smoke,
        padding: '2px 6px',
        border: `1px solid ${colors[plan] || C.smoke}`,
        marginLeft: 8,
      }}
      data-testid="plan-badge"
    >
      {plan?.toUpperCase()}
    </span>
  );
}

function truncateEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const domainParts = domain.split('.');
  const ext = domainParts.pop();
  return `${local.slice(0, 4)}@...${ext}`;
}

export default function Header() {
  const { lang, t, setLang } = useT();
  const { user, loading, signOut } = useAuth();
  const { plan, loading: planLoading } = useUserPlan();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const totalFirms = FIRM_DATABASE.filter(f => f.market !== "custom").length;
  const totalPlans = FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <>
      <header className="pf-header" data-testid="pf-header">
        <div className="pf-header-inner">
          <div className="pf-brand">
            <HeaderSeal />
            <div>
              <div className="pf-brand-mark" data-testid="hero-title">
                PROP<span className="dot">·</span>FORGE
              </div>
              <span className="pf-brand-sub">{t("app_subtitle")}</span>
              <span className="pf-brand-line" />
            </div>
          </div>
          <div className="pf-header-actions">
            <LangToggle lang={lang} setLang={setLang} />
            
            {!loading && (
              <div className="pf-auth" data-testid="pf-auth">
                {user ? (
                  <>
                    <span className="pf-auth-email" data-testid="user-email">
                      {truncateEmail(user.email)}
                    </span>
                    {!planLoading && <PlanBadge plan={plan} />}
                    {plan === 'pro' && (
                      <button 
                        className="pf-auth-btn" 
                        onClick={openCustomerPortal}
                        data-testid="manage-subscription-btn"
                        style={{ fontSize: 10 }}
                      >
                        {t('manage_subscription')}
                      </button>
                    )}
                    <button 
                      className="pf-auth-btn" 
                      onClick={handleSignOut}
                      data-testid="logout-btn"
                    >
                      {t('auth_sign_out')}
                    </button>
                  </>
                ) : (
                  <button 
                    className="pf-auth-btn" 
                    onClick={() => setShowAuthModal(true)}
                    data-testid="signin-btn"
                  >
                    {t('auth_sign_in')}
                  </button>
                )}
              </div>
            )}

            <div className="pf-meta">
              {totalFirms} firms <span className="acc">·</span> {totalPlans} plans
            </div>
          </div>
        </div>
      </header>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
