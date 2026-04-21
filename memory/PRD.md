# Prop Forge - PRD

## Original Problem Statement
Proyecto Prop Forge funcionando. App.js refactorizada a 256 líneas, todo el código en src/components/. Añadir lazy-loading con React.lazy a OracleTab y Glossary. Usar Suspense con fallback en estética archive noir tipo "loading oracle...".

## User Choices
- **Fallback style**: Texto simple animado con fondo oscuro, coherente con estética archive noir
- **Oracle fallback text**: "consulting the oracle..."
- **Glossary fallback text**: "opening the archive..."
- **Fallback position**: Centrado en el área de contenido de la tab
- **Text color**: --linen (#9AA39C)
- **Animation**: fade in/out suave cada 1.5s (opacity 0.4 → 1 → 0.4)
- **Font**: IBM Plex Sans italic, tamaño normal, sin uppercase
- **Sync tabs**: StrategyTab y ChamberTab cargan síncronamente

## Architecture
- React frontend with lazy-loaded components
- Monte Carlo simulation engine (client-side)
- Archive noir design system

## What's Been Implemented (Jan 21, 2026)
- ✅ React.lazy for OracleTab component
- ✅ React.lazy for Glossary component
- ✅ Suspense wrapper with LoadingFallback component
- ✅ Archive noir styled fallback with --linen color
- ✅ CSS animation lazy-pulse (1.5s, opacity 0.4→1→0.4)
- ✅ Fallback centered in tab content area
- ✅ IBM Plex Sans italic font styling

## Files Modified
- `/app/frontend/src/App.js` - Added lazy/Suspense imports, LoadingFallback component
- `/app/frontend/src/App.css` - Added .lazy-fallback and .lazy-fallback-text styles

## Testing Results
- Frontend: 95%
- Lazy loading: 100%
- Styling: 100%

## Next Action Items
- [ ] Commit + Save to GitHub (user request)

## Backlog
- P2: Add error boundary for lazy components
- P2: Preload OracleTab on Strategy tab hover
