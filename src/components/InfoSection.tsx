interface InfoItem {
  title: string;
  description: string;
}

const INFO_ITEMS: InfoItem[] = [
  { title: 'Reserve online', description: "Pick dates and a vehicle — you'll get a confirmation code by email or WhatsApp." },
  { title: 'Meet anywhere on Mahé', description: 'Airport, jetty, and hotel are common, but any address works — just ask.' },
  { title: 'Return with a full tank', description: 'Same location and time as agreed. Deposit is released same day.' },
  { title: 'Requirements', description: 'Valid license (1+ year), passport or Seychellois ID, refundable deposit at pickup.' },
  { title: 'Insurance', description: 'Third-party cover included in every rate; full-cover upgrade available.' },
  { title: 'Cancellation', description: 'Free up to 48 hours before pickup. Date changes subject to availability.' },
];

export default function InfoSection() {
  return (
    <section id="info" style={{ background: '#F7F9FC', borderTop: '1px solid var(--sand-line)', borderBottom: '1px solid var(--sand-line)' }}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>Everything you need to know, at a glance</h2>
        </div>
        <div className="info-list">
          {INFO_ITEMS.map((item, i) => (
            <div className="info-row" key={item.title}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
