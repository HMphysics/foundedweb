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
  list: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 15,
    lineHeight: 1.7,
    color: C.linen,
    paddingLeft: 24,
    marginBottom: 14,
  },
  link: {
    color: C.brass,
    textDecoration: 'none',
  },
};

const P = ({ children }) => <p style={{ ...styles.text, marginBottom: 14 }}>{children}</p>;
const PH = ({ children }) => <span style={styles.placeholder}>[PLACEHOLDER: {children}]</span>;
const ExtLink = ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={styles.link}>{children}</a>;

export default function Privacy() {
  const { t } = useT();

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <Link to="/" style={styles.backLink}>{t('legal_back_to_app')}</Link>
        
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>{t('legal_last_updated')}: <PH>date</PH></p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Introduction</h2>
          <P>This policy explains how Prop Forge collects, uses, and protects personal data.</P>
          <P>Operator: <PH>legal name</PH>, <PH>address</PH>. Privacy contact: <PH>privacy email</PH>.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Data We Collect</h2>
          <ul style={styles.list}>
            <li><strong>When you register:</strong> email, password (hashed, never visible to us).</li>
            <li><strong>When you pay:</strong> We process payments through Stripe. Stripe stores your card details; we only receive a customer ID and payment status. We do not store card numbers.</li>
            <li><strong>When you use the app:</strong> We store your configurations and simulations if you choose to save them.</li>
            <li><strong>Technical data:</strong> IP address, user agent, basic logs for security and debugging.</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. How We Use Your Data</h2>
          <ul style={styles.list}>
            <li>To provide the service (simulator, configuration storage)</li>
            <li>To manage your subscription</li>
            <li>To communicate critical information (service changes, failed payments, security notices)</li>
            <li>To comply with legal obligations (billing, taxation)</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Legal Basis (GDPR)</h2>
          <ul style={styles.list}>
            <li><strong>Contract performance:</strong> using Prop Forge</li>
            <li><strong>Consent:</strong> optional emails</li>
            <li><strong>Legal obligation:</strong> billing requirements</li>
            <li><strong>Legitimate interest:</strong> security and service improvement</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Third-Party Services</h2>
          <ul style={styles.list}>
            <li><strong>Supabase</strong> — authentication. <ExtLink href="https://supabase.com/privacy">Privacy Policy</ExtLink></li>
            <li><strong>MongoDB Atlas</strong> — data storage. <ExtLink href="https://www.mongodb.com/legal/privacy-policy">Privacy Policy</ExtLink></li>
            <li><strong>Stripe</strong> — payment processing. <ExtLink href="https://stripe.com/privacy">Privacy Policy</ExtLink></li>
            <li><strong>Vercel</strong> — frontend hosting. <ExtLink href="https://vercel.com/legal/privacy-policy">Privacy Policy</ExtLink></li>
            <li><strong>Railway</strong> — backend hosting. <ExtLink href="https://railway.com/legal/privacy">Privacy Policy</ExtLink></li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Data Storage and Transfer</h2>
          <P>Your data is stored on servers within the EU or with providers certified under frameworks like SCCs or equivalent. Processing may involve international transfers protected by contract.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Retention</h2>
          <P>We keep your data while your account is active. If you delete your account, we remove your personal data within 30 days maximum, except where we are legally required to retain it (e.g., invoices for 6 years under Spanish tax law).</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Your Rights (GDPR)</h2>
          <ul style={styles.list}>
            <li><strong>Access:</strong> request a copy of your data</li>
            <li><strong>Rectification:</strong> correct inaccurate data</li>
            <li><strong>Erasure:</strong> delete your account and data</li>
            <li><strong>Objection/Restriction:</strong> limit or stop processing</li>
            <li><strong>Portability:</strong> receive your data in structured format</li>
            <li><strong>Complaint:</strong> file with supervisory authority (AEPD in Spain)</li>
          </ul>
          <P>To exercise these rights, contact: <PH>privacy email</PH></P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Security</h2>
          <P>We use TLS encryption for all communications, hashed passwords, and controlled database access. No system is 100% secure, but we apply reasonable best practices.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Children</h2>
          <P>Prop Forge is not intended for anyone under 18. We do not knowingly collect data from minors.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Changes</h2>
          <P>We may update this policy. Material changes will be notified by email.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Contact</h2>
          <P>For any privacy questions: <PH>privacy email</PH></P>
        </div>
      </div>
    </div>
  );
}
