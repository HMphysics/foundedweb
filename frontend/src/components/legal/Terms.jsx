import { Link } from 'react-router-dom';
import { useT } from '../LangContext';
import { C } from '../../lib/colors';

const styles = {
  container: {
    minHeight: '100vh',
    background: C.ink,
    padding: '40px 20px 80px',
  },
  inner: {
    maxWidth: 720,
    margin: '0 auto',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: 32,
    color: C.brass,
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 13,
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 32,
    fontWeight: 400,
    color: C.bone,
    marginBottom: 8,
  },
  updated: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 12,
    color: C.smoke,
    fontStyle: 'italic',
    marginBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: C.brass,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  text: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 15,
    lineHeight: 1.7,
    color: C.linen,
  },
  placeholder: {
    background: 'rgba(181, 151, 95, 0.15)',
    padding: '2px 6px',
    color: C.brass,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
  },
};

const P = ({ children }) => <p style={{ ...styles.text, marginBottom: 14 }}>{children}</p>;
const PH = ({ children }) => <span style={styles.placeholder}>[PLACEHOLDER: {children}]</span>;

export default function Terms() {
  const { t } = useT();

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <Link to="/" style={styles.backLink}>{t('legal_back_to_app')}</Link>
        
        <h1 style={styles.title}>Terms & Conditions</h1>
        <p style={styles.updated}>{t('legal_last_updated')}: <PH>date</PH></p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Agreement</h2>
          <P>By using Prop Forge, you agree to these terms. The operator is <PH>legal name of operator</PH>, with registered address at <PH>address</PH>, tax ID <PH>NIF/CIF number</PH>.</P>
          <P>If you do not agree to these terms, please do not use the service.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Service Description</h2>
          <P>Prop Forge is a statistical simulation tool (Monte Carlo) for estimating the probability of passing prop firm challenges. It is NOT financial advice. Results are estimates based on parameters entered by the user.</P>
          <P>The simulations do not guarantee actual trading results. Past performance or simulated performance is not indicative of future results.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Account Registration</h2>
          <P>You may create an account using your email and a password. You are responsible for keeping your credentials secure and for all activity under your account.</P>
          <P>You must provide accurate information and keep it updated. One person, one account.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Subscription Plans and Payments</h2>
          <P>Prop Forge offers: Free (no cost), Pro Monthly (€31/month), and Lifetime (€199 one-time payment). Payments are processed through Stripe.</P>
          <P>The Monthly subscription renews automatically until cancelled. You can cancel anytime from the customer portal. Cancellation takes effect at the end of the current billing period.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Refund Policy</h2>
          <P>As this is a digital product with immediate access, NO refunds are offered after purchase, except where required by applicable law.</P>
          <P>The Monthly plan can be cancelled to avoid future charges, but no partial refunds are given for the current period.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. User Responsibilities</h2>
          <P>You agree not to: abuse the service, attempt to hack or reverse-engineer it, share your account with third parties, use the service for illegal activities, or circumvent any access restrictions.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Disclaimer of Warranties</h2>
          <P>Prop Forge is provided "as is" without warranty of any kind. We do not guarantee that simulation results reflect actual trading outcomes.</P>
          <P>You assume all risk associated with using the software and with your trading decisions. Nothing on this website constitutes investment advice.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Limitation of Liability</h2>
          <P>To the maximum extent permitted by law, the operator shall not be liable for any indirect, incidental, consequential, or punitive damages, or for loss of profits.</P>
          <P>The operator's total maximum liability, if any, is limited to the amount paid by you in the preceding 12 months.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Intellectual Property</h2>
          <P>All content, code, design, and data on Prop Forge are the property of the operator. You are granted a personal, non-exclusive, non-transferable license to use the service for its intended purpose.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Modifications</h2>
          <P>The operator may modify these terms. Material changes will be notified by email at least 14 days in advance. Continued use after changes constitutes acceptance.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Termination</h2>
          <P>The operator may suspend or terminate any user account that violates these terms, without prior notice and without refund.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Governing Law</h2>
          <P>Spanish law applies. Any disputes shall be resolved in the courts of <PH>operator's city</PH>.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>13. Contact</h2>
          <P>For legal inquiries, contact: <PH>legal email</PH></P>
        </div>
      </div>
    </div>
  );
}
