import MaheMap from './MaheMap';
import type { MapMode, PickedLocations, ServiceType } from '../types/location';

interface RouteCardProps {
  activeServiceType: ServiceType;
  onServiceTypeChange: (type: ServiceType) => void;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  picked: PickedLocations;
  onSelectLocation: (name: string, lat: number, lng: number, isCustom: boolean) => void;
  googleMapsUrl: string;
}

const SERVICE_TABS: { value: ServiceType; label: string }[] = [
  { value: 'rental', label: 'Car Rentals' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'tour', label: 'Tours' },
];

export default function RouteCard({
  activeServiceType,
  onServiceTypeChange,
  mode,
  onModeChange,
  picked,
  onSelectLocation,
  googleMapsUrl,
}: RouteCardProps) {
  return (
    <div className="route-card">
      <span className="title">Pickup & drop-off</span>
      <p className="hint">Tap a pin, or anywhere else on Mahé</p>

      <div className="service-tabs">
        {SERVICE_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`service-tab${activeServiceType === tab.value ? ' active' : ''}`}
            type="button"
            onClick={() => onServiceTypeChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="map-modes">
        <button
          className={`mode-btn${mode === 'pickup' ? ' active' : ''}`}
          type="button"
          onClick={() => onModeChange('pickup')}
        >
          Set pickup
        </button>
        <button
          className={`mode-btn${mode === 'dropoff' ? ' active' : ''}`}
          type="button"
          onClick={() => onModeChange('dropoff')}
        >
          Set drop-off
        </button>
      </div>

      <MaheMap mode={mode} picked={picked} onSelectLocation={onSelectLocation} />

      <div className="map-status">
        <span>
          Pickup: <b>{picked.pickup ?? 'not set'}</b>
        </span>
        <span>
          Drop-off: <b>{picked.dropoff ?? 'not set'}</b>
        </span>
      </div>
      <a className="open-maps-link" href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
        Open in Google Maps ↗
      </a>
      <p className="map-tip">Common points are marked — but pickup and drop-off aren't limited to these.</p>
    </div>
  );
}
