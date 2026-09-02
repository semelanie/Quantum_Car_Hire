import { useState } from 'react';
import RouteCard from './RouteCard';
import BookingForm from './BookingForm';
import BookingModal from './BookingModal';
import { namedStops, mapCenter } from '../data/locations';
import { OTHER_ADDRESS } from '../data/places';
import { ClockIcon, CarIcon, TagIcon, WhatsAppIcon } from './Icons';
import type { MapMode, PickedLocations, ServiceType } from '../types/location';

export interface RequestedVehicle {
  name: string;
  /** Changes on every request, even for the same vehicle, so the effect below re-fires. */
  nonce: number;
}

interface HeroProps {
  /** Set when a "Book this car" link elsewhere on the page (Fleet card, rate
   * row, or the vehicle profile modal) asks the booking form to switch to a
   * specific vehicle and jump into rental mode. */
  requestedVehicle: RequestedVehicle | null;
}

const DEFAULT_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${mapCenter[0]},${mapCenter[1]}`;

/** Google Maps link for a picked place: an exact pin if we know its coordinates, otherwise a text search. */
function mapsUrlFor(name: string, lat?: number, lng?: number) {
  if (lat !== undefined && lng !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, Mahé, Seychelles`)}`;
}

export default function Hero({ requestedVehicle }: HeroProps) {
  const [activeServiceType, setActiveServiceType] = useState<ServiceType>('rental');

  const [mode, setMode] = useState<MapMode>('pickup');
  // Pick-up/Drop-off both default to "Airport" below — start the map status
  // and "Open in Google Maps" link already showing that name instead of
  // "not set", so the map reflects the dropdowns from the very first render
  // instead of only after the user touches one of them.
  const airportStop = namedStops.find((s) => s.name === 'Airport');
  const [picked, setPicked] = useState<PickedLocations>({ pickup: 'Airport', dropoff: 'Airport' });
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    airportStop ? mapsUrlFor(airportStop.name, airportStop.lat, airportStop.lng) : DEFAULT_MAPS_URL,
  );

  const [pickupLoc, setPickupLoc] = useState('Airport');
  const [dropoffLoc, setDropoffLoc] = useState('Airport');
  const [otherAddress, setOtherAddress] = useState('');
  const [carType, setCarType] = useState('Any');
  const [passengers, setPassengers] = useState(1);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [babySeat, setBabySeat] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // A "Book this car" link elsewhere on the page (Fleet card, rate row, or
  // the vehicle profile modal) sets requestedVehicle — carry it into the
  // booking form: switch to rental mode (vehicle choice only applies there)
  // and select that vehicle. This adjusts state during render rather than in
  // an effect (React's recommended pattern for "sync state to a changed
  // prop") so a click doesn't cost an extra render.
  const [lastRequestedVehicle, setLastRequestedVehicle] = useState(requestedVehicle);
  if (requestedVehicle !== lastRequestedVehicle) {
    setLastRequestedVehicle(requestedVehicle);
    if (requestedVehicle) {
      setActiveServiceType('rental');
      setCarType(requestedVehicle.name);
    }
  }

  // Selecting a pickup/drop-off point on the map (either a named pin or a
  // custom tap) always drives the matching field below — pickupLoc when
  // "Set pickup" is active, dropoffLoc when "Set drop-off" is active — and
  // vice versa (see handlePickupLocChange/handleDropoffLocChange): the map
  // and the booking form stay in sync in both directions.
  function handleSelectLocation(name: string, lat: number, lng: number, isCustom: boolean) {
    setPicked((prev) => ({ ...prev, [mode]: name }));

    if (mode === 'pickup') {
      if (isCustom) {
        setPickupLoc(OTHER_ADDRESS);
        setOtherAddress(name);
      } else {
        setPickupLoc(name);
      }
    } else {
      if (isCustom) {
        setDropoffLoc(OTHER_ADDRESS);
        setOtherAddress(name);
      } else {
        setDropoffLoc(name);
      }
    }

    setGoogleMapsUrl(mapsUrlFor(name, lat, lng));
  }

  function handlePickupLocChange(value: string) {
    setPickupLoc(value);
    if (value === OTHER_ADDRESS) return;
    setPicked((prev) => ({ ...prev, pickup: value }));
    const match = namedStops.find((s) => s.name === value);
    setGoogleMapsUrl(mapsUrlFor(value, match?.lat, match?.lng));
  }

  function handleDropoffLocChange(value: string) {
    setDropoffLoc(value);
    if (value === OTHER_ADDRESS) return;
    setPicked((prev) => ({ ...prev, dropoff: value }));
    const match = namedStops.find((s) => s.name === value);
    setGoogleMapsUrl(mapsUrlFor(value, match?.lat, match?.lng));
  }

  // "Check availability" doesn't hit a real inventory system (there isn't
  // one) — it just makes sure the trip is filled in, then opens the booking
  // request form, which is what actually reaches the business (by email).
  function handleCheckAvailability() {
    if (!pickupDate) {
      alert('Please choose a pick-up date first.');
      return;
    }
    if (activeServiceType === 'rental' && !dropoffDate) {
      alert('Please choose a drop-off date first.');
      return;
    }
    setBookingModalOpen(true);
  }

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow">Perseverance, Mahé — Seychelles</span>
          <h1>
            Self-drive Mahé,
            <br />
            <em>on your own schedule.</em>
          </h1>
          <p className="lead">
            A small, well-maintained fleet based in Perseverance. Reserve online — we&apos;ll meet you at the airport,
            jetty, your hotel, or anywhere else on the island.
          </p>
          <div className="hero-actions">
            <a href="#book" className="btn btn-primary">
              Check availability
            </a>
            <a href="https://wa.me/2482599333" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon />
              +248 2599 333
            </a>
          </div>
          <div className="facts">
            <div className="fact">
              <ClockIcon />
              <span className="k">24/7</span>&nbsp;opening hours
            </div>
            <div className="fact">
              <CarIcon />
              <span className="k">4 models</span>&nbsp;in the fleet
            </div>
            <div className="fact">
              <TagIcon />
              <span className="k">SCR 550+</span>&nbsp;per day
            </div>
          </div>
        </div>

        <RouteCard
          activeServiceType={activeServiceType}
          onServiceTypeChange={setActiveServiceType}
          mode={mode}
          onModeChange={setMode}
          picked={picked}
          onSelectLocation={handleSelectLocation}
          googleMapsUrl={googleMapsUrl}
        />
      </div>

      <div className="wrap">
        <BookingForm
          activeServiceType={activeServiceType}
          onServiceTypeChange={setActiveServiceType}
          pickupLoc={pickupLoc}
          onPickupLocChange={handlePickupLocChange}
          dropoffLoc={dropoffLoc}
          onDropoffLocChange={handleDropoffLocChange}
          otherAddress={otherAddress}
          onOtherAddressChange={setOtherAddress}
          carType={carType}
          onCarTypeChange={setCarType}
          passengers={passengers}
          onPassengersChange={setPassengers}
          pickupDate={pickupDate}
          onPickupDateChange={setPickupDate}
          pickupTime={pickupTime}
          onPickupTimeChange={setPickupTime}
          dropoffDate={dropoffDate}
          onDropoffDateChange={setDropoffDate}
          dropoffTime={dropoffTime}
          onDropoffTimeChange={setDropoffTime}
          babySeat={babySeat}
          onBabySeatChange={setBabySeat}
          onCheckAvailability={handleCheckAvailability}
        />
      </div>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        trip={{
          serviceType: activeServiceType,
          pickupLoc,
          dropoffLoc,
          otherAddress,
          carType,
          passengers,
          pickupDate,
          pickupTime,
          dropoffDate,
          dropoffTime,
          babySeat,
        }}
      />
    </section>
  );
}
