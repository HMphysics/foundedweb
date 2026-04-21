import { C } from "../../lib/colors";
import { fmtMoney, fmtPct } from "../../lib/format";
import { useT } from "../LangContext";

export default function CompareRack({ slots, onRemove, onClear, onRunAll, loading }) {
  const { t } = useT();
  const haveResults = slots.some(s => s.results);
  return (
    <div className="fg-panel" style={{ padding: 16, marginBottom: 16 }} data-testid="compare-rack">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ color: C.cinnabar, fontSize: 12, fontWeight: 700, letterSpacing: 0.25 }}>
          ╳ {t("compare_rack_title")} <span style={{ color: C.smoke, fontWeight: 400 }}>· {t("compare_rack_slots", { n: slots.length })}</span>
        </div>
        <button className="fg-btn-ghost" onClick={onClear} data-testid="btn-compare-clear">{t("btn_compare_clear")}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 12 }}>
        {slots.map((s, i) => (
          <div key={s.id} className="fg-panel"
               style={{ padding: 10, borderColor: s.results ? C.brass : C.dust }}
               data-testid={`compare-slot-${i}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: C.smoke, fontSize: 9, letterSpacing: 0.3 }}>{t("compare_slot", { n: String(i + 1).padStart(2, "0") })}</div>
                <div style={{ color: C.bone, fontSize: 12, fontWeight: 700, marginTop: 2, overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.firmName}</div>
                <div style={{ color: C.linen, fontSize: 11, marginTop: 2 }}>› {s.planLabel}</div>
              </div>
              <button className="fg-btn-ghost" style={{ padding: "2px 6px", fontSize: 11 }}
                      onClick={() => onRemove(s.id)} data-testid={`btn-compare-remove-${i}`}>✕</button>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10, color: C.smoke, letterSpacing: 0.1 }}>
              <span>cap · <span style={{ color: C.bone }}>{fmtMoney(s.plan.capital)}</span></span>
              <span>tgt · <span style={{ color: C.brass }}>{fmtMoney(s.plan.target)}</span></span>
              <span>dd · <span style={{ color: C.cinnabar }}>{fmtMoney(s.plan.ddValue)}</span></span>
            </div>
            {s.results && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.dust}`, fontSize: 10 }}>
                <div style={{ color: C.smoke }}>p(pass) · <span style={{ color: C.brass }}>{fmtPct(s.results.pPass)}</span></div>
                <div style={{ color: C.smoke }}>ev · <span style={{ color: s.results.ev >= 0 ? C.brass : C.cinnabar }}>
                  {(s.results.ev >= 0 ? "+" : "") + fmtMoney(s.results.ev)}
                </span></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className={`fg-btn ${loading ? "loading" : ""}`}
              onClick={onRunAll}
              disabled={slots.length < 2 || loading}
              data-testid="btn-run-all">
        {loading
          ? <>[ <span className="fg-dots">···</span>&nbsp;{t("compare_forging", { n: slots.length })}&nbsp;<span className="fg-dots">···</span> ]</>
          : slots.length < 2 ? t("btn_run_all_disabled") : t("btn_run_all", { n: slots.length })}
      </button>
      {haveResults && !loading && (
        <div style={{ color: C.smoke, fontSize: 10.5, marginTop: 10, letterSpacing: 0.15, textAlign: "center" }}>
          › {t("compare_help")}
        </div>
      )}
    </div>
  );
}
