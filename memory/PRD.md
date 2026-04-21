# PROP · FORGE — Monte Carlo Oracle · PRD

## Problem Statement
Client-side React SPA for prop-firm traders to estimate the probability of passing a challenge via Monte Carlo simulation. User selects a firm + plan (or custom), inputs backtest statistics (manually or via empirical bootstrap from real data), runs the simulation, compares plans, and exports results.

## Architecture
- **Frontend only** — React 19 SPA, no backend, no persistence, no external APIs.
- Client-side Monte Carlo engine (`setTimeout` yield for loading state).
- Stack: React 19, Recharts, CSS variables, `html-to-image` for PNG export.

## Visual Theme — "Archive Noir" (v3, Feb 2026)
- Palette: ink `#0B0F10` + cinnabar `#DC4A3D` (single warm critical accent) + brass `#B8A478` + bone `#D4CDB8`. Cool steel/smoke/linen secondary.
- Typography: IBM Plex Sans (UI), JetBrains Mono 300 (data), Fraunces WONK 900 (display, sparingly).
- Single decoration: small wax seal in header.

## Structure — 4 Tabs
- **01 · CHAMBER** — firm+plan selection, Custom card 2x span, market filters, account summary.
- **02 · STRATEGY** — 5 collapsible sections + mode toggle:
  - `MODE`: SIMPLE (gaussian) ↔ BOOTSTRAP (empirical)
  - `P&L DISTRIBUTION`: gaussian params OR bootstrap textarea with parser + summary
  - `INTRADAY RISK · MAE`: ESTIMATE (7 instrument presets) / MANUAL / AUTO (bootstrap-MAE)
  - `COSTS & COMMISSIONS`: NONE / ESTIMATE (per-RT × trades/day × contracts) / FIXED daily
  - `BEHAVIORAL MODEL`: post-target conservative/aggressive · min-days total/winning · max-days trading/calendar
- **03 · ORACLE** — editorial results: huge P(PASS) + EV + P(DD), distribution strip, timing strip, 3 charts, attempt curve chart with 50/75/95/99% bankroll milestones, commission impact panel (if active), ledger.
- **04 · GLOSS** — glossary with sticky nav, search, 6 sections (A-F).

Each tab has an 180px Fraunces watermark number (01-04).

## Engine — monteCarlo.js
- `runMonteCarlo(plan, strategy, nSims)` — returns extended result object incl. `attemptCurve[]`, `commissionImpact{}`, `mode`
- `parseBootstrapData(raw)` — parses textarea (one P&L per line OR CSV with pnl/mae/mfe columns) → `{data, stats, errors}` with autocorrelation, best/worst, WR, MAE detection
- `INSTRUMENT_MAE_RATIOS` — 7 presets (NQ, ES, CL, GC, EUR/USD, GBP/USD, custom) with empirical winScale + lossRatio
- `simulateSinglePhase` — now accepts `behavioral` param (postTargetMode, minDaysType, winDayThreshold, maxDaysType)
- Commissions subtracted from each simulated day's P&L
- Conservative post-target mode reduces `sizeFactor` to 0.30 when target hit but consistency blocks
- Winning-days min-days mode counts only days with pnl ≥ threshold
- Calendar-days max-days scales elapsed days by factor 1.4 (approximates weekends)

## File Layout
```
/app/frontend/src/
├── App.js              # Main — Header, tabs, Glossary, 5 strategy sections, editorial ResultsDashboard
├── App.css             # Archive noir palette, tabs, cards, oracle-editorial, glossary
├── firmDatabase.js     # 22 firms × 74 plans + STRATEGY_DEFAULTS (extended with mode, bootstrap, MAE, costs, behavioral)
├── monteCarlo.js       # Engine with Simple/Bootstrap modes, INSTRUMENT_MAE_RATIOS, parseBootstrapData, attemptCurve, commissionImpact
├── csvCalibrate.js     # CSV calibration (unchanged)
└── i18n.js             # ES/EN dicts with 40+ new keys for v3 step-2
```

## Implemented (Feb 2026)
- ✅ Core simulator, 22 firms × 74 plans, Monte Carlo (iterations 1-2)
- ✅ Compare Mode, PNG/JSON export, CSV calibration (iteration 2)
- ✅ ES/EN i18n, tooltips, account summary (iteration 3)
- ✅ Archive Noir visual redesign + 4 tabs + Glossary (iteration 5)
- ✅ **Bootstrap mode + commissions + behavioral + instrument MAE + attempt curve (iteration 6, Feb 2026)** — 15/15 frontend tests passed, 0 console errors
- ✅ Deployment fixes (Procfile, requirements clean, date-fns pin, react-day-picker removal, react-is add, .npmrc)
- ✅ **Ciclo post-PASS — funded-account + payouts simulation (iteration 7, Feb 2026)** — 14/14 frontend tests passed, 100% success rate, 0 console errors. Added: `simulateFundedPhase` engine, `FUNDED_DEFAULTS` + per-firm overrides + `resolveFundedRules` in `firmDatabase.js`, new `PostPassSection` in STRATEGY (toggle + horizon slider 1–24m + size mode same/reduced + 15 rule overrides), new `FundedLifecyclePanel` in ORACLE (NET expected, Lifetime EV, mean payouts, P(survive) 3/6/12m, time-to-first-payout median, breach breakdown, 3 charts: net-hist, payout-count-hist, net-by-month). Glossary extended with CICLO POST-PASS / SAFETY NET / CONSISTENCY POST-PASS. Also fixed broken `en:` wrapper in i18n.js left by previous session.
- ✅ **PASO 3 · Cleanup + Polish (iterations 8-9, Feb 2026)** — 13/13 checkpoints passed.
  - TAREA 1: Unified palette — `C` object renamed to Archive Noir tokens (ink/archive/leather/dust/haze/cinnabar/oxide/brass/bone/linen/steel/smoke/whisper), moved to `src/lib/colors.js`. 260+ call sites updated, zero legacy color leaks.
  - TAREA 2: Refactored App.js from 2689 → 1532 lines. Extracted modules: `lib/colors.js`, `lib/format.js`, `lib/export.js`, `components/LangContext.jsx`, `components/Glossary.jsx`, `components/CsvModal.jsx`, `components/charting.jsx` (CTooltip/ChartTitle/EmptyChart), `components/shared/ui.jsx` (10 atoms), `components/oracle/FundedLifecyclePanel.jsx`, `components/strategy/StrategySections.jsx` (all 7 sections). App.js is now an orchestrator (state + handlers + tab routing + remaining display components: Header/Footer/FirmCard/PlanCard/AccountSummary/AccountEditor/ResultsDashboard/CompareRack/CompareResults). Under 300 lines was not reached in this pass — remaining 1532 lines contain ~11 display components (Oracle dashboard is ~400 lines alone) that can be extracted in a future pass.
  - TAREA 3: IGNITE button disabled-state hints — new testids `ignite-hint` + `ignite-hint-link` with 3 contextual messages (chamber_missing / bootstrap_empty / bootstrap_too_few), plus CSS variant under App.css. BootstrapInput textarea now live-parses so the hint reflects real-time count.
  - TAREA 4: Glossary audit — added WINNING DAYS and CALENDAR vs TRADING DAYS terms in section H (OPERATIONS) with numeric examples, both ES and EN.
- ✅ **PASO 4 · Finish App.js refactor (iteration 10, Feb 2026)** — **12/12 regression checkpoints pass**, zero console errors. App.js went from **1532 → 256 lines** (target <300 achieved). New extractions: `layout/{Header,Footer,WelcomeBlock,HeaderSeal}.jsx`, `chamber/{ChamberTab,FirmCard,PlanCard,CustomCard,AccountSummary}.jsx`, `account/AccountEditor.jsx`, `oracle/{OracleTab,ResultsPanel,ResultsDashboard}.jsx`, `strategy/StrategyTab.jsx`, `compare/{CompareRack,CompareResults}.jsx`. Removed 11 dead stub functions (IrregularBorder/DecoTarot/etc). App.js is now a pure shell: imports + state + handlers + tab routing. From 2689 → 256 lines total = **90.5% reduction across PASO 3+4**.

## Prioritized Backlog
### P1
- Shareable URL-encoded plan+strategy config (hash in query string)
- CSV dual-use: SIMPLE summary vs BOOTSTRAP literal

### P2
- Multi-attempt equity curve visualization
- Drag reorder of compare slots
- "Daylight" alt theme
- "Fingerprint" share-link for a strategy config

## Sanity Checks
- Apex 50K Intraday · SIMPLE defaults → P(PASS) ≈ 15-35%, positive/slight-negative EV
- FTMO 50K 2-phase · defaults → P(PASS) ≈ 2-4%, EV strongly negative
- Bootstrap 33 samples → works, warning shown
- Commission $40/day reduces EV by ~$1,800 per attempt
- Apex EOD post-PASS + default custom strategy + horizon 3m → P(survive)=0%, DD-breach=100% (REALISTIC — trailing DD + weak defaults; confirmed by testing agent iteration 7, not a bug)
