export type VehicleKey = 'swift' | 'brezza' | 'jimny' | 'ertiga';

export interface VehicleFeature {
  label: string;
  description: string;
}

export interface Vehicle {
  key: VehicleKey;
  name: string;
  image: string;
  /** Short spec line used in the vehicle detail modal, e.g. "5 seats · Petrol · Manual · 4 doors" */
  specs: string;
  /** Short bullet items shown on the fleet card grid */
  specItems: string[];
  /** Short subtitle shown under the model name in the rates list, e.g. "Petrol · Manual · 1+2 bags" */
  rateSubtitle: string;
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  deposit: string;
  features: VehicleFeature[];
}
