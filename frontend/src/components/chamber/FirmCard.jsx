import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import { Tag } from "../shared/ui";

function estimateDifficulty(firm) {
  let score = 1;
  const hasIntraday = firm.plans.some(p => p.ddType === "trailing_intraday");
  const hasEod      = firm.plans.some(p => p.ddType === "trailing_eod");
  const hasStatic   = firm.plans.some(p => p.ddType === "static");
  const fatalDLL    = firm.plans.some(p => p.dailyLossIsFatal);
  const twoPhase    = firm.plans.some(p => p.phases === 2);
  const hasCons     = firm.plans.some(p => p.consistency);
  if (hasIntraday) score = Math.max(score, 3);
  else if (hasEod) score = Math.max(score, 2);
  else if (hasStatic) score = Math.max(score, 1);
  if (fatalDLL) score++;
  if (twoPhase) score++;
  if (hasCons)  score++;
  return Math.min(3, Math.max(1, Math.round(score / 2)));
}

export default function FirmCard({ firm, selected, onClick }) {
  const { t } = useT();
  const hasTwoPhase = firm.plans.some(p => p.phases === 2);
  const ddTypes = [...new Set(firm.plans.map(p => p.ddType))];
  const ddTag = (type) => ({
    trailing_eod: "trailing·eod", trailing_intraday: "trailing·intraday", static: "static"
  }[type] || type);
  const ddCol = (type) => ({
    trailing_eod: C.brass, trailing_intraday: C.cinnabar, static: C.steel
  }[type] || C.smoke);
  const stars = estimateDifficulty(firm);
  return (
    <div className={`fg-card ${selected ? "selected" : ""}`}
         onClick={onClick} data-testid={`firm-${firm.id}`}
         style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, minHeight: 148, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--plex)", fontWeight: 600, color: C.bone, fontSize: 14.5,
                        letterSpacing: 0.02,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {firm.name}
          </div>
          <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.smoke,
                        fontWeight: 300, fontSize: 12.5, marginTop: 4 }}>
            {firm.subtitle}
          </div>
        </div>
        <Tag color={firm.badgeColor}>{firm.badge}</Tag>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 10, flexWrap: "wrap" }}>
        <span className="fg-rating" data-testid={`firm-${firm.id}-difficulty`}>
          {"✦".repeat(stars)}<span className="dim">{"✦".repeat(3 - stars)}</span>
        </span>
        <div style={{ display: "flex", gap: 10, fontSize: 10, letterSpacing: 0.14,
                      fontFamily: "var(--mono)", fontWeight: 400 }}>
          {ddTypes.map(ty => (
            <span key={ty} style={{ color: ddCol(ty) }}>{ddTag(ty)}</span>
          ))}
          {firm.allowsOvernight && <span style={{ color: C.linen }}>{t("overnight_badge")}</span>}
          {hasTwoPhase && <span style={{ color: C.cinnabar }}>{t("two_phase_badge")}</span>}
        </div>
      </div>
    </div>
  );
}
