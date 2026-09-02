import { useState } from 'react';
import Header from '../components/Header';
import SloganBanner from '../components/SloganBanner';
import Hero from '../components/Hero';
import type { RequestedVehicle } from '../components/Hero';
import Fleet from '../components/Fleet';
import InfoSection from '../components/InfoSection';
import FAQSection from '../components/FAQSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import VehicleModal from '../components/VehicleModal';
import PrivacyModal from '../components/PrivacyModal';

export default function SitePage() {
  const [vehicleModalKey, setVehicleModalKey] = useState<string | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [requestedVehicle, setRequestedVehicle] = useState<RequestedVehicle | null>(null);

  // "Book this car" from a Fleet card, a rate row, or the vehicle profile
  // modal — close the modal (if any) and hand the vehicle down to Hero,
  // which owns the booking form's actual state. The #book anchor on those
  // links already handles scrolling there.
  function handleBookVehicle(name: string) {
    setVehicleModalKey(null);
    setRequestedVehicle({ name, nonce: Date.now() });
  }

  return (
    <>
      <Header />
      <SloganBanner />

      <main id="top">
        <Hero requestedVehicle={requestedVehicle} />
        <Fleet onSelectVehicle={setVehicleModalKey} onBookVehicle={handleBookVehicle} />
        <InfoSection />
        <FAQSection />
        <ContactSection />
      </main>

      <VehicleModal vehicleKey={vehicleModalKey} onClose={() => setVehicleModalKey(null)} onBookVehicle={handleBookVehicle} />
      <PrivacyModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />

      <Footer onOpenPrivacyModal={() => setPrivacyModalOpen(true)} />
    </>
  );
}
