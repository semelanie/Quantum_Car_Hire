import type { Vehicle } from '../types/vehicle';

interface FleetCardProps {
  vehicle: Vehicle;
  onOpen: (key: string) => void;
}

export default function FleetCard({ vehicle, onOpen }: FleetCardProps) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('a')) return; // let the Book link behave normally
    onOpen(vehicle.key);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(vehicle.key);
    }
  }

  return (
    <div className="fleet-card" tabIndex={0} role="button" onClick={handleClick} onKeyDown={handleKeyDown}>
      <div className="fleet-photo">
        <img src={vehicle.image} alt={vehicle.name} />
      </div>
      <div className="fleet-body">
        <h3>{vehicle.name}</h3>
        <div className="fleet-specs-grid">
          {vehicle.specItems.map((item) => (
            <div className="spec-item" key={item}>
              {item}
            </div>
          ))}
        </div>
        <div className="price-row">
          <span className="amount">
            {vehicle.dailyPrice}
            <small>/day</small>
          </span>
          <a href="#book">Book →</a>
        </div>
      </div>
    </div>
  );
}
