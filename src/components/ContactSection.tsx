import { WhatsAppIcon } from './Icons';

export default function ContactSection() {
  return (
    <section id="contact" style={{ background: '#fff', borderTop: '1px solid var(--sand-line)' }}>
      <div className="wrap contact-grid">
        <div>
          <div className="section-head">
            <span className="eyebrow">Contact</span>
            <h2>Reach us directly</h2>
          </div>
          <div className="contact-info">
            <div>
              <span className="label">Location</span>
              <p>Perseverance, Mahé</p>
            </div>
            <div>
              <span className="label">WhatsApp</span>
              <a href="https://wa.me/2482600010" target="_blank" rel="noopener noreferrer">
                +248 2600 010
              </a>
            </div>
            <div>
              <span className="label">Email</span>
              <a href="mailto:info@quantumcarhire.com">info@quantumcarhire.com</a>
            </div>
            <div>
              <span className="label">Hours</span>
              <p>Open 24/7</p>
            </div>
          </div>
        </div>

        <div className="contact-cta">
          <span className="eyebrow">Prefer to just message us?</span>
          <h3>Chat with us on WhatsApp</h3>
          <p>
            It's the fastest way to reach us — we're online 24/7 and usually reply within minutes. Send us your
            dates, pickup point and the vehicle you're after, and we'll confirm availability right away.
          </p>
          <a href="https://wa.me/2482600010" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp contact-cta-btn">
            <WhatsAppIcon />
            Chat on WhatsApp
          </a>
          <p className="contact-cta-alt">
            Prefer email? Write to{' '}
            <a href="mailto:info@quantumcarhire.com" style={{ color: 'var(--ocean)', fontWeight: 600 }}>
              info@quantumcarhire.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
