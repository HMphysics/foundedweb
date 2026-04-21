import { useMemo, useState } from "react";
import { useT } from "./LangContext";

export default function Glossary() {
  const { t } = useT();
  const [query, setQuery] = useState("");

  const sections = useMemo(() => [
    { id: "methods",    letter: "A", title: t("gloss_a_title") },
    { id: "dd-types",   letter: "B", title: t("gloss_b_title") },
    { id: "floor-lock", letter: "C", title: t("gloss_c_title") },
    { id: "cons",       letter: "D", title: t("gloss_d_title") },
    { id: "mae",        letter: "E", title: t("gloss_e_title") },
    { id: "metrics",    letter: "F", title: t("gloss_f_title") },
    { id: "lifecycle",  letter: "G", title: t("gloss_g_title") },
    { id: "ops",        letter: "H", title: t("gloss_h_title") },
  ], [t]);

  const terms = useMemo(() => ([
    { section: "methods", name: t("gloss_simple_name"),       body: t("gloss_simple_body") },
    { section: "methods", name: t("gloss_bootstrap_name"),    body: t("gloss_bootstrap_body") },
    { section: "dd-types", name: t("gloss_static_name"),      body: t("gloss_static_body") },
    { section: "dd-types", name: t("gloss_teod_name"),        body: t("gloss_teod_body") },
    { section: "dd-types", name: t("gloss_tintraday_name"),   body: t("gloss_tintraday_body") },
    { section: "floor-lock", name: t("gloss_fl_none_name"),   body: t("gloss_fl_none_body") },
    { section: "floor-lock", name: t("gloss_fl_cap_name"),    body: t("gloss_fl_cap_body") },
    { section: "floor-lock", name: t("gloss_fl_target_name"), body: t("gloss_fl_target_body") },
    { section: "floor-lock", name: t("gloss_fl_cap100_name"), body: t("gloss_fl_cap100_body") },
    { section: "cons", name: t("gloss_cons_target_name"),     body: t("gloss_cons_target_body") },
    { section: "cons", name: t("gloss_cons_total_name"),      body: t("gloss_cons_total_body") },
    { section: "mae", name: t("gloss_mae_name"),              body: t("gloss_mae_body") },
    { section: "metrics", name: t("gloss_ppass_name"),        body: t("gloss_ppass_body") },
    { section: "metrics", name: t("gloss_ev_name"),           body: t("gloss_ev_body") },
    { section: "metrics", name: t("gloss_breakeven_name"),    body: t("gloss_breakeven_body") },
    { section: "metrics", name: t("gloss_bankroll_name"),     body: t("gloss_bankroll_body") },
    { section: "metrics", name: t("gloss_days_name"),         body: t("gloss_days_body") },
    { section: "metrics", name: t("gloss_attempts_name"),     body: t("gloss_attempts_body") },
    { section: "metrics", name: t("gloss_attempt_curve_name"), body: t("gloss_attempt_curve_body") },
    { section: "lifecycle", name: t("gloss_funded_name"),     body: t("gloss_funded_body") },
    { section: "lifecycle", name: t("gloss_payout_name"),     body: t("gloss_payout_body") },
    { section: "lifecycle", name: t("gloss_takehome_name"),   body: t("gloss_takehome_body") },
    { section: "lifecycle", name: t("gloss_postpass_name"),   body: t("gloss_postpass_body") },
    { section: "lifecycle", name: t("gloss_safetynet_name"),  body: t("gloss_safetynet_body") },
    { section: "lifecycle", name: t("gloss_consistency_postpass_name"), body: t("gloss_consistency_postpass_body") },
    { section: "ops", name: t("gloss_commissions_name"),      body: t("gloss_commissions_body") },
    { section: "ops", name: t("gloss_behavioral_name"),       body: t("gloss_behavioral_body") },
    { section: "ops", name: t("gloss_winning_days_name"),     body: t("gloss_winning_days_body") },
    { section: "ops", name: t("gloss_calendar_days_name"),    body: t("gloss_calendar_days_body") },
    { section: "ops", name: t("gloss_autocorr_name"),         body: t("gloss_autocorr_body") },
  ]), [t]);

  const q = query.trim().toLowerCase();
  const filter = (term) => !q ||
    term.name.toLowerCase().includes(q) ||
    term.body.toLowerCase().includes(q);

  return (
    <div className="gloss-wrap" data-testid="glossary">
      <nav className="gloss-nav" aria-label="glossary index">
        <input className="fg-input gloss-search"
               placeholder={t("gloss_search_placeholder")}
               value={query} onChange={(e) => setQuery(e.target.value)}
               data-testid="gloss-search" />
        <ul>
          {sections.map(s => (
            <li key={s.id}>
              <a href={`#gloss-${s.id}`}
                 onClick={(e) => {
                   e.preventDefault();
                   const el = document.getElementById(`gloss-${s.id}`);
                   if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                 }}
                 data-testid={`gloss-nav-${s.id}`}>
                <span className="letter">{s.letter}</span>{s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        {sections.map(s => {
          const secTerms = terms.filter(tm => tm.section === s.id).filter(filter);
          if (secTerms.length === 0 && q) return null;
          return (
            <section key={s.id} id={`gloss-${s.id}`} className="gloss-section">
              <h3><span className="letter-tag">{s.letter}</span>{s.title}</h3>
              <div className="rule" />
              {secTerms.map((term, i) => (
                <div key={i} className="gloss-term">
                  <div className="gloss-term-name">{term.name}</div>
                  <div className="gloss-term-body" style={{ whiteSpace: "pre-line" }}>{term.body}</div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
