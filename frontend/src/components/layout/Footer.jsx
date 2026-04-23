import { Link } from "react-router-dom";
import { C } from "../../lib/colors";
import { useT } from "../LangContext";

export default function Footer() {
  const { t } = useT();
  return (
    <footer style={{ padding: "28px 24px 32px", marginTop: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ color: C.haze, letterSpacing: 0.3, fontSize: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
          ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
        </div>
        <div style={{ color: C.smoke, fontSize: 11, lineHeight: 1.8, marginTop: 10 }}>
          {t("footer_l1")}<br />
          {t("footer_l2")}<br />
          {t("footer_l3")}
        </div>
        <div style={{ 
          marginTop: 16, 
          paddingTop: 16, 
          borderTop: `1px solid ${C.dust}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 11,
          color: C.smoke,
        }}>
          <Link to="/terms" style={{ color: C.smoke, textDecoration: 'none' }}>{t('legal_terms')}</Link>
          <span>·</span>
          <Link to="/privacy" style={{ color: C.smoke, textDecoration: 'none' }}>{t('legal_privacy')}</Link>
          <span>·</span>
          <Link to="/cookies" style={{ color: C.smoke, textDecoration: 'none' }}>{t('legal_cookies')}</Link>
          <span style={{ marginLeft: 'auto' }}>© 2026 Prop Forge</span>
        </div>
      </div>
    </footer>
  );
}
