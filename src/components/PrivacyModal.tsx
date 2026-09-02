interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrivacyRow {
  title: string;
  description: React.ReactNode;
}

const PRIVACY_ROWS: PrivacyRow[] = [
  {
    title: 'What we collect',
    description:
      "Name, contact details, driver's license and ID or passport information, and payment details needed to process a booking.",
  },
  {
    title: 'Why we collect it',
    description: 'To confirm your booking, verify you\'re eligible to drive, take payment and deposits, and contact you about your rental.',
  },
  {
    title: 'How it\'s stored',
    description:
      'Your information is kept only as long as needed for the rental and any legal or accounting requirements, and is not sold to third parties.',
  },
  {
    title: 'Who else sees it',
    description: 'Only staff involved in preparing and handing over your rental, and any payment processor needed to complete a transaction.',
  },
  {
    title: 'Your rights',
    description: 'You can ask to see, correct, or delete the personal data we hold about you at any time by contacting us below.',
  },
  {
    title: 'Questions or requests',
    description: (
      <>
        Email{' '}
        <a href="mailto:info@quantumcarhire.com" style={{ color: 'var(--ocean)', fontWeight: 600 }}>
          info@quantumcarhire.com
        </a>{' '}
        or message us on WhatsApp at{' '}
        <a
          href="https://wa.me/2482599333"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--ocean)', fontWeight: 600 }}
        >
          +248 2599 333
        </a>
        .
      </>
    ),
  },
];

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      id="privacyModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          &times;
        </button>
        <span className="eyebrow">Data protection</span>
        <h2>How we handle your information</h2>
        <p style={{ color: '#5a5f66', fontSize: '0.94rem', marginTop: 6 }}>
          A short summary of what we collect, why, and how it&apos;s kept safe.
        </p>
        <div className="info-list" style={{ gridTemplateColumns: '1fr', borderTop: '1px solid var(--sand-line)', marginTop: 20 }}>
          {PRIVACY_ROWS.map((row, i) => (
            <div className="info-row" key={row.title}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{row.title}</h3>
                <p>{row.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
