export interface ServiceDocument {
  name: string;
  path: string;
  size: number;
  url: string | null;
}

export interface ServiceEvent {
  id: string;
  createdAt: string;
  updatedAt: string;

  vehicleKey: string;
  vehicleLabel: string;
  registration: string;

  serviceType: string;
  serviceDate: string;
  serviceTime: string;
  /** Last day the vehicle is unavailable for — same as serviceDate for a same-day job. */
  unavailableUntil: string;

  mileage: number | null;
  provider: string;
  cost: number | null;
  nextServiceDate: string | null;
  notes: string;

  documents: ServiceDocument[];
}
