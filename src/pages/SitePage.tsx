import { useState } from 'react';
import Header from '../components/Header';
import SloganBanner from '../components/SloganBanner';
import Hero from '../components/Hero';
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

  return (
    <>
      <Header />
      <SloganBanner />

      <main id="top">
        <Hero />
        <Fleet onSelectVehicle={setVehicleModalKey} />
        <InfoSection />
        <FAQSection />
        <ContactSection />
      </main>

      <VehicleModal vehicleKey={vehicleModalKey} onClose={() => setVehicleModalKey(null)} />
      <PrivacyModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />

      <Footer onOpenPrivacyModal={() => setPrivacyModalOpen(true)} />
    </>
  );
}
