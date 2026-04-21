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

## Prioritized Backlog
### P1
- Shareable URL-encoded plan+strategy config (hash in query string)
- Post-PASS payout lifecycle simulation
- Add GLOSS terms for new features (COMMISSIONS, ATTEMPT CURVE, BEHAVIORAL MODEL, AUTOCORRELATION WARNING)

### P2
- Multi-attempt equity curve visualization
- Drag reorder of compare slots
- "Daylight" alt theme
- "Fingerprint" share-link for a strategy config

## Sanity Checks
- Apex 50K Intraday · SIMPLE defaults → P(PASS) ≈ 15-35%, positive/slight-negative EV (verified in iteration 6)
- FTMO 50K 2-phase · defaults → P(PASS) ≈ 2-4%, EV strongly negative
- Bootstrap 33 samples (small, noisy) → works, produces valid numbers, warning shown
- Commission $40/day reduces EV by ~$1,800 per attempt (avg 45 days)
