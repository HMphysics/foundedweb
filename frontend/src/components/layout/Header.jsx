import { FIRM_DATABASE } from "../../firmDatabase";
import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import HeaderSeal from "./HeaderSeal";

function LangToggle({ lang, setLang }) {
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

export default function Header() {
  const { lang, t, setLang } = useT();
  const totalFirms = FIRM_DATABASE.filter(f => f.market !== "custom").length;
  const totalPlans = FIRM_DATABASE.reduce((a, f) => a + f.plans.length, 0);
  return (
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
          <div className="pf-meta">
            {totalFirms} chambers <span className="acc">·</span> {totalPlans} plans
          </div>
        </div>
      </div>
    </header>
  );
}
