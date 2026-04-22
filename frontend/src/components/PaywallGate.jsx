import { useState } from 'react';
import { useUserPlan } from '../hooks/useUserPlan';
import { useT } from './LangContext';
import { C } from '../lib/colors';
import UpgradeModal from './UpgradeModal';

export default function PaywallGate({ feature, children, fallback = null, inline = false }) {
  const { canAccess, loading, plan } = useUserPlan();
  const { t } = useT();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) return null;
  if (canAccess(feature)) return children;
  
  if (fallback) return fallback;

  const style = inline ? {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    border: `1px dashed ${C.dust}`,
    background: 'rgba(42, 48, 50, 0.5)',
    color: C.smoke,
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 11,
    cursor: 'pointer',
  } : {
    padding: 24,
    border: `1px dashed ${C.brass}`,
    background: C.archive,
    textAlign: 'center',
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: C.linen,
  };

  return (
    <>
      <div style={style} onClick={() => setShowUpgrade(true)} data-testid="paywall-gate">
        {inline ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ color: C.brass }}>{t('paywall_pro_badge')}</span>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.brass} strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ marginBottom: 8, fontSize: 14, color: C.bone }}>
              {t('paywall_pro_feature')}
            </div>
            <div style={{ fontSize: 12, fontStyle: 'italic', marginBottom: 16, color: C.smoke }}>
              {t('paywall_current_plan', { plan: plan.toUpperCase() })}
            </div>
            <button style={{
              background: 'transparent',
              border: `1px solid ${C.cinnabar}`,
              color: C.cinnabar,
              padding: '10px 22px',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 12,
              letterSpacing: '0.12em',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {t('paywall_upgrade_cta')}
            </button>
          </>
        )}
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
