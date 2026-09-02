import { namedStops } from './locations';

export interface PlaceGroup {
  label: string;
  places: string[];
}

/**
 * Full pickup/drop-off place list shown in the booking form's dropdowns.
 * "Common pickup points" mirrors the four map-pinned stops in data/locations.ts
 * (so picking one from either place keeps things in sync); the rest are
 * well-known hotels, guesthouses/villas and landmarks around Mahé that don't
 * have a pin on the map but are still valid pickup/drop-off points.
 */
export const placeGroups: PlaceGroup[] = [
  {
    label: 'Common pickup points',
    places: namedStops.map((s) => s.name),
  },
  {
    label: 'Hotels & resorts',
    places: [
      'Four Seasons Resort Seychelles',
      'Constance Ephelia Resort',
      'Savoy Seychelles Resort & Spa',
      'Kempinski Seychelles Resort',
      'Banyan Tree Seychelles Resort & Spa',
      'Anantara Maia Seychelles Villas',
      'Enchanted Island Resort',
      'Story Seychelles',
    ],
  },
  {
    label: 'Guesthouses & villas',
    places: [
      'Chez Batista Villas',
      'Anse Soleil Beachcomber',
      "Emma's Guest House & Self-Catering",
      'Tropical Garden Self Catering',
      'Villa Kayola',
      'La Nature Apartments Au Cap',
    ],
  },
  {
    label: 'Landmarks & beaches',
    places: [
      'Victoria Market',
      'Clock Tower, Victoria',
      'National Botanical Gardens',
      'Anse Royale',
      'Anse Intendance',
      'Eden Island',
      'Mission Lodge Lookout',
    ],
  },
];

export const OTHER_ADDRESS = 'Other address';
