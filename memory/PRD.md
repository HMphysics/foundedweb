# Prop Forge - PRD

## Original Problem Statement
Prop Forge - Monte Carlo Oracle para simular probabilidades de pasar challenges de prop firms.

## Architecture
- React frontend (Create React App)
- Supabase Auth (email + password)
- Client-side Monte Carlo simulation engine
- Archive Noir design system

## What's Been Implemented

### Jan 21, 2026 - Lazy Loading
- React.lazy for OracleTab and Glossary components
- Suspense with archive noir fallback animations
- Textos: "consulting the oracle..." / "opening the archive..."

### Jan 21, 2026 - Fase 1: Autenticación Supabase
- Supabase Auth integration (email + password)
- AuthContext provider with signUp, signIn, signOut
- AuthModal component with archive noir styling
- Header integration (sign in button / user email + log out)
- Session persistence (localStorage via Supabase)
- i18n support (ES/EN) for all auth strings
- Client: @supabase/supabase-js v2.104.0

## Files Created/Modified (Auth)
- `/app/frontend/src/lib/supabase.js` - Supabase client
- `/app/frontend/src/components/AuthContext.jsx` - Auth provider
- `/app/frontend/src/components/auth/AuthModal.jsx` - Auth modal UI
- `/app/frontend/src/components/layout/Header.jsx` - Updated with auth
- `/app/frontend/src/App.js` - Wrapped with AuthProvider
- `/app/frontend/src/App.css` - Auth styles
- `/app/frontend/src/i18n.js` - Auth translations
- `/app/frontend/.env` - Supabase credentials
- `/app/frontend/.env.example` - Template for credentials

## Testing Results
- Registration: ✅ Works
- Login: ✅ Works
- Logout: ✅ Works
- Session persistence: ✅ Works
- App functionality unchanged: ✅ Verified

## NOT Implemented (Per Spec)
- Password recovery
- Magic link
- Google OAuth
- Feature gating
- MongoDB integration

## Backlog (Future Phases)
- P0: Feature gating by plan tier
- P1: Password recovery flow
- P1: MongoDB user profiles
- P2: Google OAuth
