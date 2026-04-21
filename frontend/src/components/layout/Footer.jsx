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
      </div>
    </footer>
  );
}
