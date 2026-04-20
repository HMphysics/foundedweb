# PROP FIRM MONTE CARLO SIMULATOR — PRD

## Problem Statement
Single-page React app for prop-firm traders. User selects a firm + account plan (or fully custom), enters backtest statistics, runs a Monte Carlo simulation (up to 25,000 attempts), and receives a full probability dashboard (PASS/DD/Timeout/DLL probabilities, expected value, required bankroll, timing distributions).

## Architecture
- **Frontend only** — React SPA, no backend, no persistence, no external APIs
- **Client-side Monte Carlo** wrapped in `setTimeout` to let loading render
- Stack: React 19, Recharts, Tailwind utilities + CSS variables
- Fonts: **JetBrains Mono** everywhere (numbers, UI, body). No sans-serif at all — this is what breaks the generic-AI aesthetic.

## Visual Theme — "FORGE"
Forgework / blacksmith / fire aesthetic. Deep brown-black background, amber ember + flame orange + blood-red accents. No rounded corners. No emojis — only raw Unicode glyphs (§ ‡ ◆ ◇ ╳ › // ⌁ ★ ‹ · ›) and bracket tags `[ FUTURES ]`. Positive values in ember `#FFB800`, negative in blood `#C8102E` (never green — avoids stock-ticker cliché).

Palette: `--bg #0A0604`, `--panel #120A06`, `--border #2A1810`, `--ember #FFB800`, `--flame #FF4500`, `--blood #C8102E`, `--ash #8B7355`, `--bone #E8DCC4`.

## File Layout
```
/app/frontend/src/
├── App.js              # Main component (forge-themed)
├── App.css             # FORGE palette + utility classes (fg-panel, fg-btn, fg-card, fg-pill...)
├── index.js + index.css
├── firmDatabase.js     # 22 firms × ~74 plans + STRATEGY_DEFAULTS
└── monteCarlo.js       # simulation engine (unchanged — math identical)
```

## User Personas
- Futures prop-firm traders (Apex, Topstep, Tradeify, MFFU, FundedNext, TPT, TradeDay, Earn2Trade, Leeloo, Phidias)
- Forex/multi-asset traders (FTMO, FundedNext Stellar, The 5%ers, FundingPips) with 2-phase challenges
- Quant/algo traders wanting full custom control

## Core Requirements (static)
1. 22 preset firms with ~74 account plans, fully editable via † edit
2. Accurate simulation: trailing_intraday / trailing_eod / static DD, 4 floor-lock modes, fatal/non-fatal DLL, vs_target/vs_total consistency, min/max days, 2-phase (fresh equity, same DD rules), monthly fees scaling with attempt duration + activation fees
3. Results: 8 KPI cards + 3 Recharts histograms + 6-metric stats row + contextual warnings
4. Spanish copy where spec indicated (internal IDs in English)
5. No localStorage/sessionStorage

## Implemented (Apr 2026)
- [x] 22 firms × 74 plans seeded
- [x] Filter pills `‹ ALL · FUTURES · FOREX · CUSTOM ›` with ember underline on active
- [x] 3-step flow: firm → plan → strategy/account panels + results
- [x] Fully toggleable custom editor (ddType, floorLock, DLL, consistency, phases, phase2, fees, split)
- [x] Monte Carlo engine with MAE intraday checks, MFE floor movement, Phase 2 reset
- [x] 8 KPIs + 3 charts + stats row + contextual warnings + `◆ MODIFIED` badge
- [x] FORGE theme applied globally — amber/flame/blood, JetBrains Mono, bracket tags, `[ ⌁ IGNITE ]` button, `[ ··· heating ··· ]` loading state, dotted underlines on KPIs, no emojis
- [x] 19/19 frontend tests passed (iteration_1.json). Post-redesign verified by screenshots: Apex 50K Intraday → P(PASS)=24%, EV=+$455; FTMO 50K 2-phase → P(PASS)=2.4%, EV=-$298

## Prioritized Backlog
### P1
- Compare mode: run sim across 2–4 plans side-by-side for EV/cost ranking
- Export results as PNG/JSON

### P2
- Calibrate strategy from CSV of historical trades
- Post-PASS payout lifecycle simulation (drawdowns after funding)
- URL-encoded shareable custom plan configs (no storage needed)
- Multi-attempt equity curve path visualization
