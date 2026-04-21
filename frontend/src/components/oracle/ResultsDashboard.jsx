import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from "recharts";
import { C } from "../../lib/colors";
import { fmtMoney, fmtPct, fmtInt } from "../../lib/format";
import { useT } from "../LangContext";
import { CTooltip, ChartTitle, EmptyChart } from "../charting";
import FundedLifecyclePanel from "./FundedLifecyclePanel";

export default function ResultsDashboard({ results, plan }) {
  const { t } = useT();
  const r = results;
  const passing = r.pPass > r.ruinaMin;
  const evColor = r.ev >= 0 ? C.bone : C.cinnabar;
  const failTotal = r.pDD + r.pTimeout + r.pDLL;

  let fourth;
  if (r.pTimeout > 0.01) fourth = { label: t("kpi_p_timeout"), value: fmtPct(r.pTimeout), color: C.brass,    sub: t("kpi_p_timeout_sub") };
  else if (r.pDLL > 0.01) fourth = { label: t("kpi_p_dll"),    value: fmtPct(r.pDLL),     color: C.oxide,    sub: t("kpi_p_dll_sub") };
  else                    fourth = { label: t("kpi_p_fail"),   value: fmtPct(failTotal),  color: C.cinnabar, sub: t("kpi_p_fail_sub") };

  const ROI = r.avgCost > 0 ? ((r.payout - r.avgCost) / r.avgCost) * 100 : 0;

  const distData = [
    { name: "PASS", pct: +(r.pPass * 100).toFixed(2), fill: C.bone },
    { name: "DD",   pct: +(r.pDD   * 100).toFixed(2), fill: C.cinnabar },
  ];
  if (r.pTimeout > 0) distData.push({ name: "TIMEOUT", pct: +(r.pTimeout * 100).toFixed(2), fill: C.brass });
  if (r.pDLL     > 0) distData.push({ name: "DLL",     pct: +(r.pDLL     * 100).toFixed(2), fill: C.oxide });

  return (
    <div className="oracle-editorial" data-testid="results-dashboard">
      {/* Hero KPI row */}
      <div className="oracle-hero-kpis" data-testid="oracle-revelation">
        <div className={`oracle-ppass ${passing ? "passing" : "failing"}`} data-testid="kpi-ppass">
          <div className="lbl">{t("kpi_p_pass")}</div>
          <div className="big">{fmtPct(r.pPass)}</div>
          <div className="rule" />
          <div className="sub">{t("kpi_p_pass_sub", { x: (r.ruinaMin * 100).toFixed(1) })}</div>
        </div>
        <div className="oracle-secondary" data-testid="kpi-ev">
          <div className="lbl">{t("kpi_ev")}</div>
          <div className="val" style={{ color: evColor }}>
            {(r.ev >= 0 ? "+" : "-") + fmtMoney(Math.abs(r.ev))}
          </div>
          <div className="sub">{t("kpi_ev_sub", { x: fmtMoney(r.avgCost) })}</div>
        </div>
        <div className="oracle-secondary" data-testid="kpi-pdd">
          <div className="lbl">{t("kpi_p_dd")}</div>
          <div className="val" style={{ color: C.cinnabar }}>{fmtPct(r.pDD)}</div>
          <div className="sub">{t("kpi_p_dd_sub")}</div>
        </div>
      </div>

      {/* Distribution strip */}
      <div className="oracle-strip-title">{t("chart_result_dist")}</div>
      <div className="oracle-strip">
        <div><span className="lbl">pass</span>
          <span className="val" style={{ color: passing ? C.bone : C.cinnabar }}>{fmtPct(r.pPass)}</span></div>
        <div><span className="lbl">dd</span>
          <span className="val" style={{ color: C.cinnabar }}>{fmtPct(r.pDD)}</span></div>
        <div><span className="lbl">timeout</span>
          <span className="val" style={{ color: C.brass }}>{r.pTimeout > 0.001 ? fmtPct(r.pTimeout) : "—"}</span></div>
        <div><span className="lbl">dll</span>
          <span className="val" style={{ color: C.oxide }}>{r.pDLL > 0.001 ? fmtPct(r.pDLL) : "—"}</span></div>
      </div>

      {/* Timing strip */}
      <div className="oracle-strip-title">{t("ledger_chapter_title_timing")}</div>
      <div className="oracle-strip">
        <div data-testid="kpi-meanpass"><span className="lbl">{t("kpi_mean_days")}</span>
          <span className="val">{r.nPass > 0 ? `${Math.round(r.meanPass)}d` : "—"}</span>
          <span className="sub">
            {r.nPass > 0 ? t("kpi_mean_days_sub_ok", { x: Math.round(r.medianPass) }) : t("kpi_mean_days_sub_none")}
          </span></div>
        <div data-testid="kpi-p90pass"><span className="lbl">{t("kpi_p90_days")}</span>
          <span className="val" style={{ color: C.brass }}>
            {r.nPass > 0 ? `${Math.round(r.p90Pass)}d` : "—"}
          </span>
          <span className="sub">{t("kpi_p90_days_sub")}</span></div>
        <div data-testid="kpi-br95"><span className="lbl">{t("kpi_bankroll")}</span>
          <span className="val" style={{ color: C.brass }}>
            {r.passEssentiallyZero ? "—" : fmtMoney(r.br95)}
          </span>
          <span className="sub">
            {r.passEssentiallyZero ? t("kpi_bankroll_sub_zero") : t("kpi_bankroll_sub_ok", { x: fmtInt(r.n95) })}
          </span></div>
        <div data-testid="kpi-fourth"><span className="lbl">{fourth.label}</span>
          <span className="val" style={{ color: fourth.color }}>{fourth.value}</span>
          <span className="sub">{fourth.sub}</span></div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginTop: 24 }}>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-dist">
          <ChartTitle title={t("chart_result_dist")} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distData} margin={{ top: 20, right: 10, left: 4, bottom: 0 }}>
              <XAxis dataKey="name" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} />
              <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
              <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }} />
              <Bar dataKey="pct"
                   label={{ position: "top", fill: C.bone, fontSize: 11, formatter: (v) => `${v}%` }}>
                {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-pass-hist">
          <ChartTitle title={t("chart_days_pass")}
                      caption={r.nPass > 0 ? t("chart_cap_pass", { m: Math.round(r.medianPass), p90: Math.round(r.p90Pass) }) : t("chart_no_samples")} />
          {r.histPass.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.histPass} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="day" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }} />
                <ReferenceLine x={Math.round(r.medianPass)} stroke={C.brass} strokeDasharray="2 3" />
                <Bar dataKey="pct" fill={C.bone} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-fail-hist">
          <ChartTitle title={t("chart_days_fail")}
                      caption={(r.nDD + r.nDLL + r.nTimeout) > 0 ? t("chart_cap_fail", { m: Math.round(r.medianFail) }) : t("chart_no_samples")} />
          {r.histFail.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.histFail} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="day" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.cinnabar}15` }} />
                <ReferenceLine x={Math.round(r.medianFail)} stroke={C.brass} strokeDasharray="2 3" />
                <Bar dataKey="pct" fill={C.cinnabar} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Attempt curve */}
      {r.attemptCurve && r.attemptCurve.length > 0 && (
        <>
          <div className="oracle-strip-title" style={{ marginTop: 28 }}>{t("chart_attempt_curve")}</div>
          <div className="fg-panel" style={{ padding: 16 }} data-testid="chart-attempt-curve">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={r.attemptCurve} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="attempts" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }}
                       label={{ value: "attempts", position: "insideBottom", offset: -2, fill: C.smoke, fontSize: 10 }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" domain={[0, 100]} />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }}
                         formatter={(v, n, p) => [`${v}% · bankroll ${fmtMoney(p.payload.bankroll)}`, "p(≥1 pass)"]} />
                <ReferenceLine y={50} stroke={C.brass} strokeDasharray="2 3" />
                <ReferenceLine y={95} stroke={C.brass} strokeDasharray="2 3" />
                <Bar dataKey="pAtLeastOne" fill={C.bone} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
                          fontFamily: "var(--mono)", fontSize: 11.5, color: C.linen }}>
              {[50, 75, 95, 99].map(target => {
                const row = r.attemptCurve.find(x => x.pAtLeastOne >= target);
                return (
                  <div key={target}>
                    <div style={{ color: C.steel, fontFamily: "var(--plex)", fontSize: 10, letterSpacing: 0.15,
                                  textTransform: "uppercase", marginBottom: 2 }}>{target}% chance</div>
                    <div style={{ color: C.bone, fontSize: 13 }}>
                      {row ? `${row.attempts} att · ${fmtMoney(row.bankroll)}` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Commission impact */}
      {r.commissionImpact && r.commissionImpact.daily > 0 && (
        <>
          <div className="oracle-strip-title" style={{ marginTop: 28 }}>{t("chart_commission_impact")}</div>
          <div className="fg-panel" style={{ padding: 18 }} data-testid="kpi-commissions">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              <div>
                <div className="fg-label">{t("comm_daily")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: C.cinnabar, marginTop: 4 }}>
                  −{fmtMoney(r.commissionImpact.daily)}
                </div>
              </div>
              <div>
                <div className="fg-label">{t("comm_per_attempt")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: C.cinnabar, marginTop: 4 }}>
                  −{fmtMoney(r.commissionImpact.perAttempt)}
                </div>
                <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                              fontSize: 11.5, marginTop: 4 }}>
                  ≈ {Math.round(r.commissionImpact.avgDays)} days × daily
                </div>
              </div>
              <div>
                <div className="fg-label">{t("comm_pct_target")}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, color: C.cinnabar, marginTop: 4 }}>
                  {r.finalTarget > 0 ? ((r.commissionImpact.perAttempt / r.finalTarget) * 100).toFixed(1) : "0"}%
                </div>
                <div style={{ fontFamily: "var(--plex)", fontStyle: "italic", color: C.linen,
                              fontSize: 11.5, marginTop: 4 }}>
                  of gross target
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Funded lifecycle (post-PASS) */}
      {r.postPass && <FundedLifecyclePanel pp={r.postPass} pPass={r.pPass} avgCost={r.avgCost} />}

      {/* Ledger */}
      <div className="oracle-strip-title" style={{ marginTop: 28 }}>{t("ledger_chapter_title")}</div>
      <div className="oracle-ledger" data-testid="stats-row">
        <div className="row"><span className="k">{t("stat_p_pass")}</span>
          <span className="v" style={{ color: passing ? C.bone : C.cinnabar }}>{fmtPct(r.pPass)}</span></div>
        <div className="row"><span className="k">{t("stat_ev_net")}</span>
          <span className="v" style={{ color: evColor }}>{(r.ev >= 0 ? "+" : "") + fmtMoney(r.ev)}</span></div>
        <div className="row"><span className="k">{t("stat_br99")}</span>
          <span className="v" style={{ color: C.brass }}>{r.passEssentiallyZero ? "—" : fmtMoney(r.br99)}</span></div>
        <div className="row"><span className="k">{t("stat_att99")}</span>
          <span className="v">{r.passEssentiallyZero ? "—" : fmtInt(r.n99)}</span></div>
        <div className="row"><span className="k">{t("stat_roi")}</span>
          <span className="v" style={{ color: ROI >= 0 ? C.bone : C.cinnabar }}>{ROI.toFixed(0)}%</span></div>
        <div className="row"><span className="k">{t("stat_split")}</span>
          <span className="v">{(plan.profitSplit * 100).toFixed(0)}%</span></div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dotted ${C.haze}`,
                      color: C.smoke, fontSize: 11, letterSpacing: 0.08, fontFamily: "var(--mono)", fontWeight: 300 }}>
          {t("stat_footer", { sims: r.nSims.toLocaleString("en-US"), pass: r.nPass, dd: r.nDD, to: r.nTimeout, dll: r.nDLL })}
          <span style={{ color: C.brass }}>{fmtMoney(r.payout)}</span>
        </div>
      </div>
    </div>
  );
}
