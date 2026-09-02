import { useState } from 'react';
import { ChevronIcon } from './Icons';
import type { Vehicle, VehicleKey } from '../types/vehicle';

interface RatesListProps {
  vehicles: Vehicle[];
}

export default function RatesList({ vehicles }: RatesListProps) {
  const [openRows, setOpenRows] = useState<Set<VehicleKey>>(new Set());

  function toggleRow(key: VehicleKey) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="rate-list">
      {vehicles.map((vehicle) => {
        const isOpen = openRows.has(vehicle.key);
        return (
          <div className={`rate-row${isOpen ? ' open' : ''}`} key={vehicle.key}>
            <button className="rate-summary" type="button" aria-expanded={isOpen} onClick={() => toggleRow(vehicle.key)}>
              <span className="model-info">
                <h3>{vehicle.name}</h3>
                <small>{vehicle.rateSubtitle}</small>
              </span>
              <span className="right">
                <span className="daily">
                  {vehicle.dailyPrice}
                  <small>/day</small>
                </span>
                <ChevronIcon className="chevron" />
              </span>
            </button>
            <div className="rate-detail">
              <div className="rate-detail-inner">
                <div className="ditem">
                  <span className="label">Weekly</span>
                  <span className="value">{vehicle.weeklyPrice}</span>
                </div>
                <div className="ditem">
                  <span className="label">Monthly</span>
                  <span className="value">{vehicle.monthlyPrice}</span>
                </div>
                <div className="ditem">
                  <span className="label">Deposit</span>
                  <span className="value">{vehicle.deposit}</span>
                </div>
                <div className="book-link">
                  <a href="#book">Book this car →</a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
