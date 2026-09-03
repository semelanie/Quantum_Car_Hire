import { useState } from 'react';

type FaqPanelKey = 'before' | 'during' | 'after';

interface FaqEntry {
  question: string;
  answer: React.ReactNode;
  openByDefault?: boolean;
}

const FAQ_TABS: { key: FaqPanelKey; label: string }[] = [
  { key: 'before', label: 'Before Rental' },
  { key: 'during', label: 'During Rental' },
  { key: 'after', label: 'After Rental' },
];

const FAQ_CONTENT: Record<FaqPanelKey, FaqEntry[]> = {
  before: [
    {
      question: 'What do I need to rent a car?',
      answer: "A valid driver's license held for at least one year, a passport or Seychellois ID, and a refundable deposit at pickup.",
      openByDefault: true,
    },
    {
      question: 'Is there a minimum age to rent?',
      answer: "18 years or older, with a valid driver's license held for at least one year.",
    },
    {
      question: 'Can I add a baby car seat?',
      answer: 'Yes, on any vehicle — tick the option when booking or mention it when you message us.',
    },
    {
      question: 'Where can I pick up and drop off?',
      answer:
        "Airport, jetty, and hotel are our most common points, but we're not limited to these — we'll arrange any address on Mahé at booking.",
    },
  ],
  during: [
    {
      question: "What's the fuel policy?",
      answer: 'Handed over full, returned full. Nearest fuel stations are listed in your confirmation.',
      openByDefault: true,
    },
    {
      question: 'Is insurance included?',
      answer:
        "Third-party cover comes standard with every rental. A full-cover upgrade is available if you'd like extra peace of mind.",
    },
    {
      question: 'Can I extend my rental?',
      answer: "Usually yes, subject to availability. Message us on WhatsApp before your return time and we'll do our best to accommodate it.",
    },
    {
      question: 'What if I have a breakdown or accident?',
      answer: (
        <>
          Call or WhatsApp us right away at{' '}
          <a
            href="https://wa.me/2482600010"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--ocean)', fontWeight: 600 }}
          >
            +248 2600 010
          </a>
          . We&apos;re reachable 24/7 and will guide you through next steps.
        </>
      ),
    },
  ],
  after: [
    {
      question: 'Is there a cleaning fee?',
      answer: "Normal wear isn't charged. A fee applies only if a car comes back excessively dirty.",
      openByDefault: true,
    },
    {
      question: 'When is my deposit returned?',
      answer: 'The same day you return the car, condition permitting.',
    },
    {
      question: 'Can I get a receipt?',
      answer: "Yes — just ask and we'll email one over after your rental ends.",
    },
    {
      question: 'What if I return the car late?',
      answer: "A late fee may apply. If you know you'll be delayed, message us ahead of time and we'll work with you on it.",
    },
  ],
};

export default function FAQSection() {
  const [activeTab, setActiveTab] = useState<FaqPanelKey>('before');

  return (
    <section id="faq">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="section-head">
          <span className="eyebrow">FAQ</span>
          <h2>A few more questions</h2>
        </div>

        <div className="faq-tabs">
          {FAQ_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`faq-tab${activeTab === tab.key ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {FAQ_TABS.map((tab) => (
          <div
            className="faq-panel"
            key={tab.key}
            data-panel={tab.key}
            style={{ display: activeTab === tab.key ? undefined : 'none' }}
          >
            {FAQ_CONTENT[tab.key].map((entry) => (
              <details className="faq-item" open={entry.openByDefault} key={entry.question}>
                <summary>{entry.question}</summary>
                <p>{entry.answer}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
