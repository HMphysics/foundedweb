# PROP FIRM MONTE CARLO SIMULATOR — PRD

## Problem Statement
Single-page React app for prop-firm traders. User selects a firm + account plan (or fully custom), enters backtest statistics, runs a Monte Carlo simulation (up to 25,000 attempts), and receives a full probability dashboard (PASS/DD/Timeout/DLL probabilities, expected value, required bankroll, timing distributions).

## Architecture
- **Frontend only** — React SPA, no backend, no persistence, no external APIs
- **Client-side Monte Carlo** wrapped in `setTimeout` to let loading render
- Stack: React 19, Recharts, Tailwind utilities + CSS variables
- Fonts: IBM Plex Mono (numbers), Inter (UI). Dark "Quant Terminal" theme

## File Layout
```
/app/frontend/src/
├── App.js              # Main component (header, firm/plan selectors, params, results)
├── App.css             # Quant Terminal theme (CSS variables + utility classes)
├── index.js + index.css
├── firmDatabase.js     # 22 firms × ~74 plans + STRATEGY_DEFAULTS
└── monteCarlo.js       # simulation engine (normalRandom, gammaRandom,
                        # computeFloor, simulateSinglePhase, simulateAttempt,
                        # runMonteCarlo, makeHistogram)
```

## User Personas
- Futures prop-firm traders (Apex, Topstep, Tradeify, MFFU, FundedNext, TPT, TradeDay, Earn2Trade, Leeloo, Phidias) evaluating risk-adjusted expected value
- Forex/multi-asset traders (FTMO, FundedNext Stellar, The 5%ers, FundingPips) with 2-phase challenges
- Quant/algo traders who want full custom control over every rule

## Core Requirements (static)
1. 22 preset firms with ~74 account plans. All parameters editable via "Edit" button
2. Accurate simulation of: trailing_intraday / trailing_eod / static drawdown, 4 floor-lock modes, fatal vs non-fatal DLL, vs_target vs vs_total consistency, min/max days, 2-phase challenges (fresh equity, same DD rules), monthly fees that scale with attempt duration + activation fees
3. Results dashboard with 8 KPI cards, 3 Recharts histograms, 6-metric stats row, contextual warnings
4. Spanish UI (internal IDs in English)
5. No localStorage/sessionStorage — session-only state

## Implemented (Apr 2026)
- [x] 22 firms × 74 plans seeded (FUTURES + FOREX + CUSTOM markets)
- [x] Filter pills (ALL / FUTURES / FOREX / CUSTOM)
- [x] 3-step flow with green-border selected state, MODIFIED amber badge
- [x] Fully toggleable custom editor (ddType, floorLock, DLL, consistency, phases, phase2, fees, split)
- [x] Complete Monte Carlo engine with MAE intraday checks, MFE floor movement, Phase 2 reset
- [x] 8 KPIs: P(PASS), EV, P(DD), dynamic 4th card (P(Timeout)/P(DLL)/P(Fallo)), días medios, P90, bankroll 95%, mediana intentos
- [x] 3 Recharts: result distribution, PASS days histogram with median line, fail days histogram
- [x] 6 metric stats row: P(PASS), EV neto, Bankroll 99%, Intentos 99%, ROI si PASS, Split efectivo
- [x] Contextual warnings (monthly fee, Apex 30-day, Topstep DLL, vs_target/vs_total consistency, 2-phase)
- [x] Reset-to-preset button
- [x] data-testid on every interactive element; tested at 100% success rate

## Prioritized Backlog
### P1
- Compare mode: run sim across multiple plans side-by-side (e.g. "Apex 50K vs FundedNext Stellar 50K")
- Export results as PNG / JSON for sharing

### P2
- Payout lifecycle simulation (drawdowns after PASS, payout caps, multi-account scaling)
- Calibrate strategy from pasted CSV of historical trades
- Save/load custom plans via URL encoding (still no storage needed)
- Multi-attempt bankroll path visualization (equity curve across N attempts)

## Deferred
- Nothing blocking MVP
