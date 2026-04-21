import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { C } from "../../lib/colors";
import { fmtMoney, fmtPct } from "../../lib/format";
import { useT } from "../LangContext";
import { CTooltip, ChartTitle, EmptyChart } from "../charting";

export default function FundedLifecyclePanel({ pp }) {
  const { t } = useT();
  const netColor = pp.meanNet >= 0 ? C.bone : C.cinnabar;
  const evColor  = pp.evLifetime >= 0 ? C.bone : C.cinnabar;

  return (
    <div style={{ marginTop: 32 }} data-testid="funded-lifecycle">
      <div className="oracle-strip-title">{t("oracle_funded_title")}</div>
      <div style={{ color: C.smoke, fontSize: 10.5, marginBottom: 10, letterSpacing: 0.08,
                    fontFamily: "var(--mono)" }}>
        › {t("oracle_funded_hint")} · {pp.ppRuns.toLocaleString("en-US")} PASS runs · horizon {pp.horizonMonths}m ({pp.horizonDays}d)
      </div>

      {/* Hero row */}
      <div className="oracle-hero-kpis" style={{ marginBottom: 18 }}>
        <div className="oracle-ppass passing" data-testid="pp-kpi-net">
          <div className="lbl">{t("kpi_pp_expected_net")}</div>
          <div className="big" style={{ color: netColor }}>
            {(pp.meanNet >= 0 ? "+" : "-") + fmtMoney(Math.abs(pp.meanNet))}
          </div>
          <div className="rule" />
          <div className="sub">{t("kpi_pp_expected_net_sub", { h: pp.horizonMonths })}</div>
        </div>
        <div className="oracle-secondary" data-testid="pp-kpi-lifetime-ev">
          <div className="lbl">{t("kpi_pp_lifetime_ev")}</div>
          <div className="val" style={{ color: evColor }}>
            {(pp.evLifetime >= 0 ? "+" : "-") + fmtMoney(Math.abs(pp.evLifetime))}
          </div>
          <div className="sub">{t("kpi_pp_lifetime_ev_sub")}</div>
        </div>
        <div className="oracle-secondary" data-testid="pp-kpi-payouts">
          <div className="lbl">{t("kpi_pp_payouts")}</div>
          <div className="val" style={{ color: C.brass }}>
            {pp.meanPayouts.toFixed(2)}
          </div>
          <div className="sub">{t("kpi_pp_payouts_sub")} · med {pp.medianPayouts}</div>
        </div>
      </div>

      {/* Survive strip */}
      <div className="oracle-strip">
        <div data-testid="pp-survive-3m">
          <span className="lbl">{t("kpi_pp_survive3")}</span>
          <span className="val">{fmtPct(pp.pSurvive3m)}</span>
          <span className="sub">3 months · {Math.round(pp.meanDaysSurvived)}d mean survival</span>
        </div>
        <div data-testid="pp-survive-6m">
          <span className="lbl">{t("kpi_pp_survive6")}</span>
          <span className="val">{fmtPct(pp.pSurvive6m)}</span>
          <span className="sub">6 months</span>
        </div>
        <div data-testid="pp-survive-12m">
          <span className="lbl">{t("kpi_pp_survive12")}</span>
          <span className="val">{fmtPct(pp.pSurvive12m)}</span>
          <span className="sub">12 months</span>
        </div>
        <div data-testid="pp-kpi-first">
          <span className="lbl">{t("kpi_pp_first_payout")}</span>
          <span className="val" style={{ color: C.brass }}>
            {pp.medFirstPayoutDay ? `${Math.round(pp.medFirstPayoutDay)}d` : "—"}
          </span>
          <span className="sub">{t("kpi_pp_first_payout_sub")}</span>
        </div>
      </div>

      {/* Breach breakdown */}
      <div className="oracle-strip" style={{ marginTop: 10 }} data-testid="pp-breach-strip">
        <div>
          <span className="lbl">{t("kpi_pp_no_breach")}</span>
          <span className="val" style={{ color: C.bone }}>{fmtPct(pp.breachPct.None)}</span>
          <span className="sub">reached horizon</span>
        </div>
        <div>
          <span className="lbl">{t("kpi_pp_breach_dd")}</span>
          <span className="val" style={{ color: C.cinnabar }}>{fmtPct(pp.breachPct.DD)}</span>
          <span className="sub">drawdown</span>
        </div>
        <div>
          <span className="lbl">{t("kpi_pp_breach_dll")}</span>
          <span className="val" style={{ color: C.oxide }}>{fmtPct(pp.breachPct.DLL)}</span>
          <span className="sub">daily loss</span>
        </div>
        <div>
          <span className="lbl">{t("kpi_pp_p10p90")}</span>
          <span className="val">
            {fmtMoney(pp.p10Net)}<span style={{ color: C.smoke }}> / </span>{fmtMoney(pp.p90Net)}
          </span>
          <span className="sub">10th / 90th percentile</span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: 14, marginTop: 18 }}>
        <div className="fg-panel" style={{ padding: 16 }} data-testid="pp-chart-net-hist">
          <ChartTitle title={t("chart_pp_payout_hist")}
                      caption={`median ${fmtMoney(pp.medianNet)} · mean ${fmtMoney(pp.meanNet)}`} />
          {pp.histNet.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pp.histNet} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="bucket" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }}
                       tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }}
                         formatter={(v) => [`${v}%`, "share"]}
                         labelFormatter={(l) => `≥ ${fmtMoney(l)}`} />
                <Bar dataKey="pct" fill={C.brass} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="fg-panel" style={{ padding: 16 }} data-testid="pp-chart-count">
          <ChartTitle title={t("chart_pp_payout_count")}
                      caption={`mean ${pp.meanPayouts.toFixed(2)} payouts`} />
          {pp.payoutHistogram.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pp.payoutHistogram} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="count" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }}
                       label={{ value: "payouts", position: "insideBottom", offset: -2, fill: C.smoke, fontSize: 10 }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }} unit="%" />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }} />
                <Bar dataKey="pct" fill={C.bone} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        <div className="fg-panel" style={{ padding: 16 }} data-testid="pp-chart-by-month">
          <ChartTitle title={t("chart_pp_by_month")}
                      caption={`total expected net (across PASS runs)`} />
          {pp.payoutsByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pp.payoutsByMonth} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
                <XAxis dataKey="month" stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }}
                       label={{ value: "month", position: "insideBottom", offset: -2, fill: C.smoke, fontSize: 10 }} />
                <YAxis stroke={C.smoke} tickLine={false} axisLine={{ stroke: C.dust }}
                       tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip content={<CTooltip />} cursor={{ fill: `${C.brass}15` }}
                         formatter={(v) => [fmtMoney(v), "mean net"]} />
                <Bar dataKey="meanNet" fill={C.brass} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>
    </div>
  );
}
