# PROP · FORGE — Monte Carlo Oracle · PRD

## Problem Statement
Client-side React SPA for prop-firm traders to estimate probability of passing a challenge via Monte Carlo simulation. User selects a firm + plan (or custom), inputs backtest statistics (manually or from CSV), runs simulation, compares plans, and exports results.

## Architecture
- **Frontend only** — React 19 SPA, no backend, no persistence, no external APIs.
- Client-side Monte Carlo engine with `setTimeout` yield for loading state.
- Stack: React 19, Recharts, CSS variables, `html-to-image` for PNG export.

## Visual Theme — "Archive Noir" (v3, Feb 2026)
Final direction after two prior iterations (v1 Oracle gold-on-black, v2 Sulphur on Burgundy). The user rejected both — v3 commits to a cool, contained editorial aesthetic.

- **Palette**: ink `#0B0F10` base, archive/leather panels, dust/haze borders. Cinnabar red `#DC4A3D` is the single warm accent (used only on critical CTAs and selected states). Brass `#B8A478` replaces gold. Bone `#D4CDB8` text, linen/steel/smoke secondary. NO sulphur yellow, NO burgundy.
- **Typography**: IBM Plex Sans 300-600 (UI), JetBrains Mono 300 (data), Fraunces WONK 900 (display — used sparingly, max 3 visible elements per screen).
- **Decoration**: one 34px wax seal SVG in the header. Nothing else. No tarot, chains, coin, stain, flame, rotation, or irregular borders.

## Structure — 4 Tabs
1. **01 · CHAMBER** — firm grid (Custom card 2x span with dashed brass border + ✦), market filters (ALL/FUTURES/FOREX/CUSTOM), plan grid, natural-language account summary, "next · strategy →" CTA.
2. **02 · STRATEGY** — 2-col layout: strategy inputs (wr, μ, σ, tail, MAE collapsed) + CSV calibrate on left; account editor + nSims slider + IGNITE button + add-to-compare + compare rack on right.
3. **03 · ORACLE** — editorial results layout: huge P(PASS) in Fraunces WONK (left) + EV + P(DD) as secondary KPIs (right). Below: 4-col distribution strip, 4-col timing strip, 3 charts, ledger. Compare results appended below single-run results. Empty state if no simulation yet.
4. **04 · GLOSS** — glossary with sticky nav (6 sections: A methods, B dd-types, C floor-lock, D consistency, E MAE, F metrics), search input with live filtering, smooth-scroll anchors.

Each tab body has an 180px Fraunces watermark number (01-04) in whisper color as silent marker. Kicker · Title · Hint · (Epigraph only in tab 01).

## File Layout
```
/app/frontend/src/
├── App.js              # Main — Header, tabs, Glossary, AppInner router, ResultsDashboard editorial
├── App.css             # Archive noir palette, IBM Plex Sans / Fraunces / Mono, tabs, cards, oracle-editorial, glossary
├── firmDatabase.js     # 22 firms × 74 plans + STRATEGY_DEFAULTS (UNCHANGED)
├── monteCarlo.js       # Simulation engine (UNCHANGED)
├── csvCalibrate.js     # CSV parser + strategy calibration (UNCHANGED)
└── i18n.js             # ES/EN dictionaries with sober microcopy + 26 glossary keys per locale
```

## Implemented (Feb 2026)
- ✅ Core simulator, 22 firms × 74 plans, Monte Carlo engine, MAE intraday, 2-phase reset, fees (iterations 1-2)
- ✅ Compare Mode up to 4 plans · PNG/JSON export · CSV calibration (iteration 2)
- ✅ ES/EN i18n + Custom-first + tooltips + account summary (iteration 3)
- ✅ Full visual redesign to Archive Noir + 4-tab structure + Glossary (iteration 5, Feb 2026)
- ✅ Deployment fixes: Procfile, requirements.txt cleanup, date-fns pin to 3.6.0, removed react-day-picker, react-is added, .npmrc legacy-peer-deps

## Prioritized Backlog
### P1
- **Bootstrap mode** — empirical sampling from pasted daily P&L list (tab-02 toggle; glossary entry already documents both modes)
- Shareable URL-encoded plan+strategy config (hash in query string)
- Post-PASS payout lifecycle simulation

### P2
- Multi-attempt equity curve visualization
- Drag reorder of compare slots
- "Daylight" alt theme

## User Personas
- Futures prop-firm traders (Apex, Topstep, Tradeify, MFFU, FundedNext, TPT, TradeDay, Leeloo, Phidias)
- Forex traders (FTMO, FundedNext Stellar, The5%ers, FundingPips)
- Quant traders using custom config + CSV calibration from backtest logs

## Sanity Checks
- Apex 50K Intraday · defaults → P(PASS) ≈ 23–25%, EV ≈ +$430, P(Timeout) ≈ 65%
- FTMO 50K 2-phase · defaults → P(PASS) ≈ 2.4%, EV ≈ -$300
- Apex 50K Intraday · calibrated from 90d sample → P(PASS) ≈ 86%, EV ≈ +$2,100
