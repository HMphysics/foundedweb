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

export default function Cookies() {
  const { t } = useT();

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <Link to="/" style={styles.backLink}>{t('legal_back_to_app')}</Link>
        
        <h1 style={styles.title}>Cookie Policy</h1>
        <p style={styles.updated}>{t('legal_last_updated')}: <PH>date</PH></p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. What Are Cookies</h2>
          <P>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you use it.</P>
          <P>Similar technologies include local storage, session storage, and pixels.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Cookies We Use</h2>
          <ul style={styles.list}>
            <li><strong>Essential cookies:</strong> Required for the app to function. This includes Supabase Auth session tokens that keep you logged in.</li>
            <li><strong>Third-party cookies:</strong> Stripe sets its own cookies during checkout to process payments and prevent fraud.</li>
            <li><strong>Analytics/Advertising:</strong> We do NOT currently use analytics or advertising cookies.</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Managing Cookies</h2>
          <P>You can configure your browser to reject cookies. However, if you reject essential cookies, the website will not function correctly — you won't be able to log in or use the service.</P>
          <P>Most browsers allow you to: see what cookies are stored, delete all or specific cookies, block third-party cookies, or block all cookies.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Third-Party Cookie Policies</h2>
          <ul style={styles.list}>
            <li><strong>Stripe:</strong> <ExtLink href="https://stripe.com/cookies-policy/legal">Cookie Policy</ExtLink></li>
            <li><strong>Supabase:</strong> <ExtLink href="https://supabase.com/privacy">Privacy Policy</ExtLink></li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Changes</h2>
          <P>If we introduce additional cookies in the future (analytics, marketing), we will update this policy and add a consent banner where required by law.</P>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Contact</h2>
          <P>For questions about our cookie practices: <PH>privacy email</PH></P>
        </div>
      </div>
    </div>
  );
}
