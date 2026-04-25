# Prop Forge - PRD

## Original Problem Statement
Prop Forge - Monte Carlo Oracle para simular probabilidades de pasar challenges de prop firms.

## Architecture
- React frontend (Create React App)
- FastAPI backend (Python)
- Supabase Auth (email + password)
- MongoDB Atlas (user plans storage)
- Client-side Monte Carlo simulation engine
- Archive Noir design system

## What's Been Implemented

### Jan 21, 2026 - Lazy Loading
- React.lazy for OracleTab and Glossary components
- Suspense with archive noir fallback animations

### Jan 21, 2026 - Fase 1: Autenticación Supabase
- Supabase Auth integration (email + password)
- AuthContext, AuthModal, Header integration
- Session persistence

### Jan 22, 2026 - Fase 2: Sistema de Planes y Gating
**Backend:**
- `/api/user/plan` endpoint with Supabase token validation
- MongoDB Atlas integration (user_plans collection)
- Plan features definition (free/pro/lifetime)
- Auto-create free plan for new users

**Frontend:**
- `useUserPlan` hook for plan state management
- `PaywallGate` component for feature gating
- `UpgradeModal` with 3 plan comparison
- Plan badge in Header (FREE/PRO/LIFETIME)
- Gating applied to:
  - Firms (free: apex_eod, topstep, ftmo only)
  - Bootstrap mode (pro only)
  - Compare feature (pro only)
  - Export JSON/PNG (pro only)
  - Commissions section (pro only)
  - Behavioral section (pro only)
  - Post-pass lifecycle section (pro only)

**i18n:** Full ES/EN translations for paywall strings

## Files Created/Modified (Fase 2)
- `/app/backend/server.py` - Added /api/user/plan endpoint
- `/app/backend/auth.py` - Supabase token validation
- `/app/backend/db.py` - MongoDB client
- `/app/frontend/src/hooks/useUserPlan.js` - Plan hook
- `/app/frontend/src/components/PaywallGate.jsx`
- `/app/frontend/src/components/UpgradeModal.jsx`
- `/app/frontend/src/components/chamber/FirmCard.jsx` - Lock icons
- `/app/frontend/src/components/chamber/ChamberTab.jsx` - Firm gating
- `/app/frontend/src/components/strategy/StrategyTab.jsx` - Section gating
- `/app/frontend/src/components/strategy/StrategySections.jsx` - Mode gating
- `/app/frontend/src/components/oracle/ResultsPanel.jsx` - Export gating
- `/app/frontend/src/components/layout/Header.jsx` - Plan badge

## Environment Variables
**Backend (.env):**
- MONGODB_URI - MongoDB Atlas connection string
- SUPABASE_URL - Supabase project URL
- SUPABASE_SERVICE_ROLE_KEY - Supabase service role key

**Frontend (.env):**
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY
- REACT_APP_BACKEND_URL

## Testing Results
- Backend: 100% ✅
- Frontend: 70% ✅
- Core functionality working

## How to Test Plans Manually
1. Register/login in the app
2. Open MongoDB Atlas → Browse Collections → user_plans
3. Find your user document
4. Change `plan: "free"` to `plan: "pro"` or `plan: "lifetime"`
5. Refresh the app → features unlock

### Apr 25, 2026 - Phase 5: UX Simplification & Onboarding
- Simplified mystic terminology across UI (Chamber/Oracle/Ignite/Forge/Rite removed) — both ES and EN
  - Tabs: FIRMS / STRATEGY / RESULTS / HELP
  - Section labels: TRADING DATA / INTRADAY RISK / ACCOUNT / SIMULATION
  - Buttons: RUN SIMULATION / EDIT / ADD TO COMPARE / RESULTS
  - KPI subs cleaned (no "house wins", no "abyss claims", no "destiny", etc.)
  - Welcome footer cleaned (no `//`, no "houses learn", no "statistical rumour")
- Default mode flipped from `simple` to `bootstrap` (`STRATEGY_DEFAULTS.mode`)
- Bootstrap is now FREE for all plans (PLAN_FEATURES.free.modes includes bootstrap)
- ModeSelector redesign: bootstrap first, "★ RECOMMENDED" badge, green check on selected, no PRO lock
- New `lib/exampleData.js`: deterministic 200-trade example generator (mulberry32 + Box–Muller, NQ-style WR≈37%)
- New "load example" button in BootstrapInput
- Tooltips ⓘ on all key fields: capital, target, dd_value, consistency_pct, fee, profit_split, n_sims, instrument (alongside existing dd_type, floor_lock, dll, phases, bankroll, break_even, ev, mu_sigma, wr, spike, mae, consistency)
- Section descriptions (italic gray) under each Collapsible title via new `description` prop
- Section badges: "ADVANCED · OPTIONAL" (MAE) and "PRO · OPTIONAL" (Costs, Behavioral, Post-Pass)
- Quick Start panel above Trading Data explaining the rest is optional
- Results KPI micro-explanations: italic gray 12px under each hero KPI (P·PASS, EV, P·DRAWDOWN), with InfoTooltip linking to glossary entries (break_even, ev, bankroll)
- Custom card "VOCATIO PROPRIA" → "custom build"; OracleTab kicker "03 · oracle" → "03 · results"
- Header meta: "21 chambers" → "21 firms"
- Build verified ✓ (yarn build OK, no lint errors)

## Backlog (Future Phases)
- P1: Password recovery
- P2: Save configurations feature (free=0, pro=10, lifetime=∞)
- P2: Preload components on hover
- P2: Internal CSS class refactor (`.invoke-btn`, `.oracle-*`, `pane-chamber`, `pane-oracle`) — not user-visible but technical debt
- P3: i18n.js refactor (file is large; consider split into es.js / en.js / tooltips.js)
