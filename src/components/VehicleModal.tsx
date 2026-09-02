import { useVehicles } from '../context/VehiclesContext';

interface VehicleModalProps {
  vehicleKey: string | null;
  onClose: () => void;
  onBookVehicle: (name: string) => void;
}

export default function VehicleModal({ vehicleKey, onClose, onBookVehicle }: VehicleModalProps) {
  const { vehicles } = useVehicles();
  const vehicle = vehicleKey ? vehicles.find((v) => v.key === vehicleKey) : undefined;
  const isOpen = Boolean(vehicle);

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      id="vehicleModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          &times;
        </button>
        <span className="eyebrow">Vehicle profile</span>
        <h2>{vehicle?.name ?? ''}</h2>
        <p style={{ color: '#5a5f66', fontSize: '0.94rem', marginTop: 6 }}>{vehicle?.specs ?? ''}</p>
        <ul className="modal-feature-list" style={{ listStyle: 'none', marginTop: 20, padding: 0, borderTop: '1px solid var(--sand-line)' }}>
          {vehicle?.features.map((f, i) => (
            <li key={`${f.label}-${i}`}>
              <span className="flabel">{f.label}</span>
              <span className="fdesc">{f.description}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--sand-line)' }}>
          <span className="amount" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3rem', color: 'var(--ocean)', fontWeight: 600 }}>
            {vehicle ? `${vehicle.dailyPrice}/day` : ''}
          </span>
          <a
            href="#book"
            className="btn btn-primary"
            onClick={() => {
              if (vehicle) onBookVehicle(vehicle.name);
              onClose();
            }}
          >
            Book this car
          </a>
        </div>
      </div>
    </div>
  );
}
