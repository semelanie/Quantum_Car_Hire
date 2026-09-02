import { useVehicles } from '../context/VehiclesContext';
import { placeGroups, OTHER_ADDRESS } from '../data/places';
import type { ServiceType } from '../types/location';

interface BookingFormProps {
  activeServiceType: ServiceType;
  onServiceTypeChange: (type: ServiceType) => void;
  pickupLoc: string;
  onPickupLocChange: (value: string) => void;
  dropoffLoc: string;
  onDropoffLocChange: (value: string) => void;
  otherAddress: string;
  onOtherAddressChange: (value: string) => void;
  carType: string;
  onCarTypeChange: (value: string) => void;
  passengers: number;
  onPassengersChange: (value: number) => void;
  pickupDate: string;
  onPickupDateChange: (value: string) => void;
  pickupTime: string;
  onPickupTimeChange: (value: string) => void;
  dropoffDate: string;
  onDropoffDateChange: (value: string) => void;
  dropoffTime: string;
  onDropoffTimeChange: (value: string) => void;
  babySeat: boolean;
  onBabySeatChange: (value: boolean) => void;
  onCheckAvailability: () => void;
}

function shows(allowed: ServiceType[], active: ServiceType) {
  return allowed.includes(active);
}

function PlaceOptions() {
  return (
    <>
      {placeGroups.map((group) => (
        <optgroup label={group.label} key={group.label}>
          {group.places.map((place) => (
            <option key={place}>{place}</option>
          ))}
        </optgroup>
      ))}
      <option>{OTHER_ADDRESS}</option>
    </>
  );
}

export default function BookingForm({
  activeServiceType,
  onServiceTypeChange,
  pickupLoc,
  onPickupLocChange,
  dropoffLoc,
  onDropoffLocChange,
  otherAddress,
  onOtherAddressChange,
  carType,
  onCarTypeChange,
  passengers,
  onPassengersChange,
  pickupDate,
  onPickupDateChange,
  pickupTime,
  onPickupTimeChange,
  dropoffDate,
  onDropoffDateChange,
  dropoffTime,
  onDropoffTimeChange,
  babySeat,
  onBabySeatChange,
  onCheckAvailability,
}: BookingFormProps) {
  const { vehicles } = useVehicles();
  const vehicleOptions = ['Any', ...vehicles.map((v) => v.name)];

  return (
    <div className="booking" id="book">
      <div className="booking-grid">
        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="pickup-loc">Pick-up</label>
          <select id="pickup-loc" value={pickupLoc} onChange={(e) => onPickupLocChange(e.target.value)}>
            <PlaceOptions />
          </select>
        </div>

        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="dropoff-loc">Drop-off</label>
          <select id="dropoff-loc" value={dropoffLoc} onChange={(e) => onDropoffLocChange(e.target.value)}>
            <PlaceOptions />
          </select>
        </div>

        <div className="field" style={{ display: shows(['rental'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="car-type">Vehicle</label>
          <select id="car-type" value={carType} onChange={(e) => onCarTypeChange(e.target.value)}>
            {vehicleOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ display: shows(['transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="passengers">Passengers</label>
          <input
            type="number"
            id="passengers"
            min={1}
            value={passengers}
            onChange={(e) => onPassengersChange(Number(e.target.value))}
          />
        </div>

        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="pickup-date" id="pickupDateLabel">
            {activeServiceType === 'rental' ? 'Pick-up date' : 'Date'}
          </label>
          <input type="date" id="pickup-date" value={pickupDate} onChange={(e) => onPickupDateChange(e.target.value)} />
        </div>

        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="pickup-time">Pick-up time</label>
          <input type="time" id="pickup-time" value={pickupTime} onChange={(e) => onPickupTimeChange(e.target.value)} />
        </div>

        <div className="field" style={{ display: shows(['rental'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="dropoff-date">Drop-off date</label>
          <input type="date" id="dropoff-date" value={dropoffDate} onChange={(e) => onDropoffDateChange(e.target.value)} />
        </div>

        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="dropoff-time">Drop-off time</label>
          <input type="time" id="dropoff-time" value={dropoffTime} onChange={(e) => onDropoffTimeChange(e.target.value)} />
        </div>

        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="other-address">Other address (if selected)</label>
          <input
            type="text"
            id="other-address"
            placeholder="e.g. villa or guesthouse name"
            value={otherAddress}
            onChange={(e) => onOtherAddressChange(e.target.value)}
          />
        </div>

        <div className="field" style={{ display: shows(['rental', 'transfer', 'tour'], activeServiceType) ? undefined : 'none' }}>
          <label htmlFor="serviceTypeField">Type of service</label>
          <select
            id="serviceTypeField"
            value={activeServiceType}
            onChange={(e) => onServiceTypeChange(e.target.value as ServiceType)}
          >
            <option value="rental">Car Rentals</option>
            <option value="transfer">Transfers</option>
            <option value="tour">Tours</option>
          </select>
        </div>

        <button className="btn btn-primary" type="button" onClick={onCheckAvailability}>
          Check availability
        </button>
      </div>
      <label className="booking-extra">
        <input type="checkbox" id="baby-seat" checked={babySeat} onChange={(e) => onBabySeatChange(e.target.checked)} />
        Add a baby car seat
      </label>
    </div>
  );
}
