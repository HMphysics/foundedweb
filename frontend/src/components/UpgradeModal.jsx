import { useT } from './LangContext';
import { C } from '../lib/colors';
import { startCheckout } from '../lib/stripe';

const plans = [
  {
    id: 'free',
    features: ['3 firms (Apex EOD, Topstep, FTMO)', 'Simple mode only', 'No export', 'No compare'],
    price: null,
    cta: null,
    planType: null,
  },
  {
    id: 'pro',
    features: ['All 21 firms', 'Bootstrap mode', 'Export JSON + PNG', 'Compare up to 3', 'Post-pass lifecycle', 'Commissions & behavioral'],
    price: '€31/month',
    cta: 'paywall_upgrade_monthly',
    planType: 'pro_monthly',
  },
  {
    id: 'lifetime',
    features: ['Everything in Pro', 'Unlimited saved configs', 'Lifetime access', 'Priority support'],
    price: '€199 one-time',
    cta: 'paywall_upgrade_lifetime',
    planType: 'lifetime',
  },
];

export default function UpgradeModal({ onClose }) {
  const { t } = useT();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handlePurchase = (planType) => {
    if (planType) {
      startCheckout(planType);
    }
  };

  return (
    <div className="auth-overlay" onClick={handleOverlayClick} data-testid="upgrade-modal-overlay">
      <div style={{
        background: C.ink,
        border: `1px solid ${C.dust}`,
        width: '100%',
        maxWidth: 720,
        padding: '32px 28px',
        position: 'relative',
      }} data-testid="upgrade-modal">
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: C.smoke,
            fontSize: 22,
            cursor: 'pointer',
          }}
          data-testid="upgrade-close-btn"
        >
          ×
        </button>

        <h2 style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: C.bone,
          marginBottom: 8,
          letterSpacing: '0.1em',
        }}>
          {t('paywall_upgrade_modal_title')}
        </h2>
        <p style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 13,
          color: C.linen,
          marginBottom: 28,
          fontStyle: 'italic',
        }}>
          {t('paywall_upgrade_modal_body')}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                border: `1px solid ${plan.id === 'pro' ? C.brass : C.dust}`,
                padding: 20,
                background: plan.id === 'pro' ? 'rgba(181, 151, 95, 0.05)' : 'transparent',
              }}
            >
              <div style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: plan.id === 'pro' ? C.brass : plan.id === 'lifetime' ? C.cinnabar : C.smoke,
                letterSpacing: '0.15em',
                marginBottom: 12,
                textTransform: 'uppercase',
              }}>
                {t(`paywall_${plan.id}_badge`)}
              </div>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 20px 0',
              }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 11,
                    color: C.linen,
                    marginBottom: 6,
                    paddingLeft: 14,
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: plan.id === 'free' ? C.smoke : C.brass,
                    }}>
                      {plan.id === 'free' ? '–' : '✓'}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.cta && (
                <button
                  onClick={() => handlePurchase(plan.planType)}
                  style={{
                    width: '100%',
                    background: plan.id === 'pro' ? C.brass : 'transparent',
                    border: `1px solid ${plan.id === 'pro' ? C.brass : C.cinnabar}`,
                    color: plan.id === 'pro' ? C.ink : C.cinnabar,
                    padding: '10px 16px',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  data-testid={`upgrade-btn-${plan.id}`}
                >
                  {t(plan.cta)}
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: `1px dashed ${C.dust}`,
        }} data-testid="coming-soon-section">
          <div style={{
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: C.brass,
            fontWeight: 600,
            marginBottom: 12,
            fontFamily: 'var(--plex)',
          }}>
            {t('coming_soon_title')}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}>
            {[
              { key: 'lab',       badge: 'Q2' },
              { key: 'templates', badge: 'Q2' },
              { key: 'save',      badge: 'soon' },
              { key: 'mobile',    badge: 'later' },
            ].map(item => (
              <div key={item.key}
                   data-testid={`coming-${item.key}`}
                   style={{
                     padding: 12,
                     background: C.archive,
                     border: `1px solid ${C.dust}`,
                     display: 'flex',
                     alignItems: 'flex-start',
                     justifyContent: 'space-between',
                     gap: 8,
                   }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    color: C.bone,
                    fontWeight: 500,
                    fontFamily: 'var(--plex)',
                    marginBottom: 4,
                  }}>
                    {t(`coming_${item.key}_title`)}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: C.linen,
                    fontStyle: 'italic',
                    fontFamily: 'var(--plex)',
                    lineHeight: 1.4,
                  }}>
                    {t(`coming_${item.key}_desc`)}
                  </div>
                </div>
                <span style={{
                  fontSize: 9,
                  color: C.brass,
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.1em',
                  padding: '2px 6px',
                  border: `1px solid ${C.brass}`,
                  flexShrink: 0,
                }}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 12,
            fontSize: 11,
            color: C.smoke,
            fontStyle: 'italic',
            fontFamily: 'var(--plex)',
            textAlign: 'center',
          }}>
            {t('coming_soon_footer')}
          </div>
        </div>

        <p style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 10,
          color: C.smoke,
          marginTop: 20,
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          powered by stripe · secure checkout
        </p>
      </div>
    </div>
  );
}
