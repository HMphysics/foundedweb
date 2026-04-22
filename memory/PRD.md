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

## Backlog (Future Phases)
- P0: Stripe integration (Fase 3)
- P1: Password recovery
- P2: Save configurations feature
- P2: Preload components on hover
