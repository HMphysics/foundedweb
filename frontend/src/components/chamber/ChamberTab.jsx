import { useState } from "react";
import { C } from "../../lib/colors";
import { useT } from "../LangContext";
import { useUserPlan } from "../UserPlanContext";
import WelcomeBlock from "../layout/WelcomeBlock";
import CustomCard from "./CustomCard";
import FirmCard from "./FirmCard";
import PlanCard from "./PlanCard";
import AccountSummary from "./AccountSummary";
import UpgradeModal from "../UpgradeModal";

export default function ChamberTab({
  marketFilter, setMarketFilter,
  welcomeOpen, setWelcomeOpen,
  filteredRegular, customFirm,
  selectedFirm, selectedFirmId, selectFirm,
  selectedPlanId, selectPlan,
  isCustomMode, planDraft, isModified,
  setActiveTab,
}) {
  const { t } = useT();
  const { canAccess } = useUserPlan();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleFirmClick = (firmId) => {
    if (!canAccess(`firm:${firmId}`)) {
      setShowUpgrade(true);
      return;
    }
    selectFirm(firmId);
  };

  return (
    <>
      <div className="pf-tab-body fg-fadein" data-testid="pane-chamber">
        <div className="pf-tab-head">
          <div className="pf-tab-watermark">01</div>
          <div className="pf-tab-kicker">01 · chamber</div>
          <h2 className="pf-tab-title">{t("tab_01_title")}</h2>
          <div className="pf-tab-hint">{t("tab_01_hint")}</div>
        </div>
        <div className="pf-epigraph">{t("tab_01_epigraph")}</div>

        {welcomeOpen && <WelcomeBlock onClose={() => setWelcomeOpen(false)} />}

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}
             data-testid="market-filters">
          {[
            { k: "ALL",     l: t("filter_all") },
            { k: "FUTURES", l: t("filter_futures") },
            { k: "FOREX",   l: t("filter_forex") },
            { k: "CUSTOM",  l: t("filter_custom") },
          ].map(f => (
            <button key={f.k}
                    className={`fg-pill ${marketFilter === f.k ? "active" : ""}`}
                    onClick={() => setMarketFilter(f.k)}
                    data-testid={`filter-${f.k.toLowerCase()}`}>{f.l}</button>
          ))}
        </div>

        <div className="fg-scroll" data-testid="firm-grid"
             style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {customFirm && (
            <CustomCard selected={selectedFirmId === "custom"}
                        onClick={() => selectFirm("custom")} />
          )}
          {filteredRegular.map((firm) => (
            <FirmCard key={firm.id} firm={firm}
                      selected={firm.id === selectedFirmId}
                      onClick={() => handleFirmClick(firm.id)} />
          ))}
        </div>

        {selectedFirm && !isCustomMode && (
          <section style={{ marginTop: 36 }} className="fg-fadein">
            <div className="fg-sec">§ {t("step_2_title")} — {selectedFirm.name}</div>
            <div data-testid="plan-grid"
                 style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {selectedFirm.plans.map(plan => (
                <PlanCard key={plan.planId} plan={plan} firm={selectedFirm}
                          selected={plan.planId === selectedPlanId}
                          onClick={() => selectPlan(plan)} />
              ))}
            </div>
          </section>
        )}

        {isCustomMode && (
          <section style={{ marginTop: 32 }} className="fg-fadein" data-testid="custom-landing">
            <div className="fg-sec">§ {t("step_custom_title")}</div>
            <div className="fg-panel" style={{ padding: 20, borderColor: C.brass, borderStyle: "dashed" }}>
              <div style={{ color: C.linen, fontFamily: "var(--plex)", fontSize: 13.5, lineHeight: 1.7,
                            whiteSpace: "pre-line" }}>
                {t("step_custom_body")}
              </div>
            </div>
          </section>
        )}

        {planDraft && selectedFirm && (
          <>
            <AccountSummary plan={planDraft} firm={selectedFirm} isModified={isModified} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button className="btn-secondary" onClick={() => setActiveTab("strategy")}
                      data-testid="btn-next-strategy">
                {t("btn_next_strategy")}
              </button>
            </div>
          </>
        )}
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
