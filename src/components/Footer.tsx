import { Link } from 'react-router-dom';
import { FacebookIcon, MessengerIcon, EmailIcon } from './Icons';

interface FooterProps {
  onOpenPrivacyModal: () => void;
}

export default function Footer({ onOpenPrivacyModal }: FooterProps) {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-col footer-brand">
            <h4 style={{ color: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: '1rem', letterSpacing: 0, textTransform: 'none', marginBottom: 8 }}>
              Quantum Car Hire
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#8FB0D6', maxWidth: '30ch', lineHeight: 1.6 }}>
              Rentals, transfers & tours across Mahé. Based in Perseverance, open 24/7.
            </p>
          </div>
          <div className="footer-col">
            <h4>Site</h4>
            <a href="#fleet">Fleet & Rates</a>
            <a href="#info">How it Works</a>
            <a href="#faq">FAQ</a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenPrivacyModal();
              }}
            >
              Data Protection
            </a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="https://wa.me/2482599333" target="_blank" rel="noopener noreferrer">
              WhatsApp: +248 2599 333
            </a>
            <a href="mailto:info@quantumcarhire.com">info@quantumcarhire.com</a>
          </div>
          <div className="footer-col">
            <h4>Follow</h4>
            <div className="social-icons">
              <a href="https://facebook.com/quantumcarhire" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="https://m.me/quantumcarhire" target="_blank" rel="noopener noreferrer" aria-label="Messenger">
                <MessengerIcon />
              </a>
              <a href="mailto:info@quantumcarhire.com" aria-label="Email">
                <EmailIcon />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Quantum Car Hire, Perseverance, Mahé.</span>
          <span style={{ opacity: 0.7 }}>Developed by VERTEX</span>
          <span>
            Open 24/7 · <Link to="/admin" style={{ opacity: 0.6 }}>Admin</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
