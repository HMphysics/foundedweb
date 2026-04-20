# PROP FIRM MONTE CARLO SIMULATOR — PRD

## Problem Statement
Single-page React app for prop-firm traders. User selects a firm + account plan (or fully custom), enters backtest statistics (manually or calibrated from historical CSV), runs a Monte Carlo simulation, compares several plans side-by-side, and exports results as PNG/JSON.

## Architecture
- **Frontend only** — React SPA, no backend, no persistence, no external APIs
- Client-side Monte Carlo wrapped in `setTimeout` to let loading render
- Stack: React 19, Recharts, Tailwind utilities + CSS variables, `html-to-image` for PNG export
- Fonts: **JetBrains Mono** everywhere. No sans-serif.

## Visual Theme — "FORGE"
Blacksmith/fire aesthetic. Deep brown-black, amber/flame/blood accents. No rounded corners. No emojis — only raw Unicode glyphs and bracket tags. Positive → ember, negative → blood (never green).

## File Layout
```
/app/frontend/src/
├── App.js              # Main component (~1100 lines, feature-complete)
├── App.css             # FORGE palette + utility classes
├── index.js / index.css
├── firmDatabase.js     # 22 firms × ~74 plans + STRATEGY_DEFAULTS
├── monteCarlo.js       # simulation engine
└── csvCalibrate.js     # CSV parser + strategy calibration
```

## Implemented (Apr 2026)
### Core (iteration 1 — 19/19 tests passed)
- [x] 22 firms × 74 plans · market filter · 3-step flow
- [x] Custom editor for all plan params (ddType, floorLock, DLL, consistency, phases, phase2, fees, split)
- [x] Monte Carlo engine (normal/gamma PDF, MAE intraday, MFE floor, 2-phase reset, monthly fee metering)
- [x] 8 KPI cards + 3 Recharts histograms + 6-metric stats row + contextual warnings
- [x] MODIFIED amber badge + reset-to-preset

### New features (iteration 2 — 18/18 tests passed)
- [x] **COMPARE MODE** — up to 4 plans in a rack (`ADD TO COMPARE` button). IGNITE ALL runs MC for every slot with the same strategy. Renders a `COMPARISON · RANKED BY EV` table with per-metric winners highlighted in ember (P·PASS, EV, AVG COST, MEAN DAYS, P90, BANKROLL 95%, ROI). Winner banner at bottom.
- [x] **EXPORT PNG / JSON** — both single-run and compare-view exportable. PNG via `html-to-image`, JSON as structured payload with firm/plan/strategy/results/timestamp. Minor: html-to-image emits a CORS warning for Google Fonts (fonts are inlined post-load); export still succeeds.
- [x] **CSV CALIBRATION** — modal accepts paste/upload of historical P&L. Auto-detects delimiter (`,`/`\t`/`;`/`|`), auto-selects the column with negatives as the P&L column, skips header row. Computes `wr`, `μwin`, `σwin`, `μloss`, `σloss`, `tailProb` (2.5σ outlier detection), `tailMult`. Preview panel shows detected stats + calibrated strategy before applying. Error handling for "no wins", "no losses", <5 samples.

## User Personas
- Futures prop-firm traders (Apex, Topstep, Tradeify, MFFU, FundedNext, TPT, TradeDay, E2T, Leeloo, Phidias)
- Forex/multi-asset traders (FTMO, FundedNext Stellar, The 5%ers, FundingPips)
- Quant/algo traders wanting full custom control and CSV calibration from backtest logs

## Prioritized Backlog
### P1
- Shareable URL-encoded plan+strategy config (compact hash in URL, no storage)
- Post-PASS payout lifecycle simulation (funded account drawdowns, payout caps)

### P2
- Multi-attempt equity curve visualization (play N attempts sequentially)
- Save/load named strategy presets in URL query string
- Drag reorder of compare slots
- Dark/light mode switch (keep FORGE as primary, offer "DAYLIGHT" alternative)

## Verified Sanity Checks
- Apex 50K Intraday · defaults → P(PASS) ≈ 23–25%, EV ≈ +$430, P(Timeout) ≈ 65% (due to 30d max)
- FTMO 50K 2-phase · defaults → P(PASS) ≈ 2.4%, EV ≈ -$300 (fatal DLL bites)
- Apex 50K Intraday · calibrated from 90d sample (wr=0.57, μwin=$406) → P(PASS) ≈ 86%, EV ≈ +$2,100
