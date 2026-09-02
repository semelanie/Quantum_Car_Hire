export interface NamedStop {
  name: string;
  lat: number;
  lng: number;
}

export type MapMode = 'pickup' | 'dropoff';

export type ServiceType = 'rental' | 'transfer' | 'tour';

export interface PickedLocations {
  pickup: string | null;
  dropoff: string | null;
}
