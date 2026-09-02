import FleetCard from './FleetCard';
import RatesList from './RatesList';
import { useVehicles } from '../context/VehiclesContext';

interface FleetProps {
  onSelectVehicle: (key: string) => void;
  onBookVehicle: (name: string) => void;
}

export default function Fleet({ onSelectVehicle, onBookVehicle }: FleetProps) {
  const { vehicles } = useVehicles();

  return (
    <section id="fleet">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Fleet & rates</span>
          <h2>Pick the right car for your trip</h2>
          <p>Prices per day, insurance included. Weekly and monthly rates apply a discount automatically.</p>
        </div>

        <div className="fleet-grid">
          {vehicles.map((vehicle) => (
            <FleetCard vehicle={vehicle} onOpen={onSelectVehicle} onBookVehicle={onBookVehicle} key={vehicle.key} />
          ))}
        </div>

        <RatesList vehicles={vehicles} onBookVehicle={onBookVehicle} />

        <p className="foot-note">
          + Baby car seat available on any vehicle, small daily fee. A cleaning fee applies if a car is returned
          excessively dirty.
        </p>
      </div>
    </section>
  );
}
