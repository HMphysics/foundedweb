# PROP FIRM MONTE CARLO SIMULATOR — PRD

## Problem Statement
Single-page React app for prop-firm traders. User selects a firm + account plan (or fully custom), enters backtest statistics (manually or calibrated from historical CSV), runs a Monte Carlo simulation, compares several plans side-by-side, and exports results as PNG/JSON.

## Architecture
- **Frontend only** — React SPA, no backend, no persistence, no external APIs
- Client-side Monte Carlo wrapped in `setTimeout` to let loading render
- Stack: React 19, Recharts, Tailwind utilities + CSS variables, `html-to-image` for PNG export

## Visual Theme — "THE ORACLE" (v4, Feb 2026)
Replaces the former FORGE theme with a ceremonial/mystical aesthetic — the trader *invokes an oracle*, not runs a simulation.
- **Palette (TEMPLO)**: void `#050302`, obsidian `#0D0806`, ember-bed `#1A0F0A`, ash `#2D1F15`, whisper `#3D3228`, gold-leaf `#B8860B` (primary), sulphur `#E8B923` (highlight), ember red `#C1272D`, blood `#8B0000` (fatal), bone `#E8DCC4`, parchment `#C4B59E`, shade `#6B5A47`.
- **Typography**: triple stack — **Cinzel** (titles, uppercase, 0.15–0.3em tracking), **Cormorant Garamond italic** (subtitles, hints, labels, tooltips), **JetBrains Mono 300** (numbers only, large KPIs).
- **Signature elements**: 70vh Hero with sigil SVG + literary quote, roman-numeral step heads (`PRIMVS · I`, `SECVNDVS · II`…), radial revelation layout (P(PASS) in gold-bordered center circle surrounded by 6 peripheral KPIs), difficulty flames on firm cards, ornate corner brackets on panels, grain + vignette fixed overlays, Cinzel IGNITE button ("INVOCAR EL ORÁCULO"), ledger-style stats row.

## File Layout
```
/app/frontend/src/
├── App.js              # Main component: Hero, Sigil, OrnateDivider, radial ResultsDashboard
├── App.css             # TEMPLO palette + Cinzel/Cormorant/Mono utilities + radial grid + grain
├── index.js / index.css
├── firmDatabase.js     # 22 firms × ~74 plans + STRATEGY_DEFAULTS (unchanged)
├── monteCarlo.js       # simulation engine (unchanged)
├── csvCalibrate.js     # CSV parser + strategy calibration (unchanged)
└── i18n.js             # ES/EN dictionaries w/ ceremonial microcopy + TOOLTIPS
```

## Implemented

### Core (iteration 1 — 19/19 tests passed, Apr 2026)
- [x] 22 firms × 74 plans · market filter · 3-step flow
- [x] Custom editor for all plan params (ddType, floorLock, DLL, consistency, phases, phase2, fees, split)
- [x] Monte Carlo engine (normal/gamma PDF, MAE intraday, MFE floor, 2-phase reset, monthly fee metering)
- [x] 8 KPI cards + 3 Recharts histograms + 6-metric stats row + contextual warnings
- [x] MODIFIED amber badge + reset-to-preset

### Extensions (iteration 2 — 18/18 tests passed)
- [x] **COMPARE MODE** — up to 4 plans side-by-side, ranked by EV, per-metric winners highlighted
- [x] **EXPORT PNG / JSON** — both single-run and compare-view exportable
- [x] **CSV CALIBRATION** — auto-detects delimiter + column, computes wr/μ/σ/tail stats, preview + apply

### Addendum v3 (iteration 3 preparation)
- [x] **i18n ES/EN** with browser detection + toggle
- [x] **Custom-first UI** — Custom card pinned at grid origin, enlarged, dashed gold border
- [x] **Welcome/tutorial block** collapsible
- [x] **Info tooltips** (ⓘ) on complex concepts: dd_type, floor_lock, consistency, MAE, DLL, phases, EV, bankroll, break-even, WR, μ/σ, spike
- [x] **Natural-language account summary** under step 2

### THE ORACLE redesign (iteration 3, Feb 2026 — 18/18 tests passed, 100% frontend)
- [x] **Hero** — 70vh ceremonial opener: sigil SVG, Cinzel 96px title, Cormorant italic tagline + quote, ornate divider, dot-row, meta counter (chambers · plans · client-side rite)
- [x] **Sticky top rail** with brand + lang toggle + help + compact counter
- [x] **Roman-numeral step heads** via `ROMAN_PREFIX` constant (PRIMVS → QVINTVS) with Cormorant italic subtitles + ornate divider
- [x] **Radial revelation** (3x3 grid, P(PASS) center w/ gold border ornament and ※ glyphs, 6 peripheral KPIs with stagger animation)
- [x] **Firm difficulty flames** (1–3 ✦) estimated from ddType + fatalDLL + phases + consistency
- [x] **Custom firm card 2x** — `grid-column: span 2`, dashed gold-leaf border, anvil SVG, Cinzel title
- [x] **Ceremonial IGNITE button** — Cinzel 0.3em tracking, decorative corner brackets, pulsing ember border during loading
- [x] **Ledger stats row** — old-book style with dotted dividers, Cormorant italic keys, mono values
- [x] **Grain + vignette** fixed background overlays (SVG fractalNoise + radial gradients)
- [x] **Candle-flicker** animation on hero sigil
- [x] **Microcopy rewrite** — ritual voice in hints/subtitles, clarity preserved in labels (invocar/oráculo/cámara/ofrenda/craft/tributo…)

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
- Alternative "DAYLIGHT" theme (keep ORACLE as default)

## Verified Sanity Checks
- Apex 50K Intraday · defaults → P(PASS) ≈ 23–25%, EV ≈ +$430, P(Timeout) ≈ 65% (due to 30d max)
- FTMO 50K 2-phase · defaults → P(PASS) ≈ 2.4%, EV ≈ -$300 (fatal DLL bites)
- Apex 50K Intraday · calibrated from 90d sample (wr=0.57, μwin=$406) → P(PASS) ≈ 86%, EV ≈ +$2,100
