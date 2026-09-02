import swiftImg from '../assets/swift.jpeg';
import brezzaImg from '../assets/brezza.jpeg';
import jimnyImg from '../assets/jimny.jpeg';
import ertigaImg from '../assets/ertiga.jpeg';
import type { Vehicle } from '../types/vehicle';

export const vehicles: Vehicle[] = [
  {
    key: 'swift',
    name: 'Suzuki Swift',
    image: swiftImg,
    specs: '5 seats · Petrol · Manual · 4 doors',
    specItems: ['5 seats', 'Petrol', 'Manual', '4 doors', '1+2 bags', 'A/C'],
    rateSubtitle: 'Petrol · Manual · 1+2 bags',
    dailyPrice: 'SCR 550',
    weeklyPrice: 'SCR 3,300',
    monthlyPrice: 'SCR 12,500',
    deposit: 'SCR 3,000',
    features: [
      { label: 'Infotainment Suite', description: 'Touchscreen display with Apple CarPlay & Android Auto' },
      { label: 'Climate Control', description: "Ice-cold A/C — essential for Mahé's heat" },
      { label: 'Seating Volume', description: 'Spacious 5-passenger layout with good legroom' },
      { label: 'Storage Adaptability', description: 'Boot space for luggage and day bags' },
      { label: 'Safety System', description: 'Dual airbags + ABS + electronic stability control' },
      { label: 'Parking Assistance', description: 'Rear parking sensors' },
      { label: 'Connection Ports', description: 'Bluetooth audio + USB charging ports' },
    ],
  },
  {
    key: 'brezza',
    name: 'Suzuki Brezza',
    image: brezzaImg,
    specs: '5 seats · Hybrid · Auto · 4 doors',
    specItems: ['5 seats', 'Hybrid', 'Auto', '4 doors', '1+2 bags', 'A/C'],
    rateSubtitle: 'Hybrid · Auto · 1+2 bags',
    dailyPrice: 'SCR 750',
    weeklyPrice: 'SCR 4,500',
    monthlyPrice: 'SCR 17,500',
    deposit: 'SCR 4,000',
    features: [
      { label: 'Infotainment Suite', description: 'Touchscreen with wireless Apple CarPlay & Android Auto' },
      { label: 'Climate Control', description: 'Automatic climate control, all-day comfort' },
      { label: 'Seating Volume', description: 'Spacious 5-passenger SUV layout, raised seating' },
      { label: 'Storage Adaptability', description: 'Generous SUV boot space for luggage' },
      { label: 'Safety System', description: '6 airbags + ABS with EBD + electronic stability program' },
      { label: 'Parking Assistance', description: 'Reverse camera + parking sensors' },
      { label: 'Connection Ports', description: 'Bluetooth audio + USB charging ports' },
    ],
  },
  {
    key: 'jimny',
    name: 'Suzuki Jimny',
    image: jimnyImg,
    specs: '4 seats · Petrol · Manual · 4WD',
    specItems: ['4 seats', 'Petrol', 'Manual', '4 doors', '1+1 bags', '4WD'],
    rateSubtitle: 'Petrol · Manual · 1+1 bags',
    dailyPrice: 'SCR 950',
    weeklyPrice: 'SCR 5,700',
    monthlyPrice: 'SCR 22,000',
    deposit: 'SCR 5,000',
    features: [
      { label: 'Infotainment Suite', description: 'Touchscreen with smartphone connectivity' },
      { label: 'Climate Control', description: 'Manual A/C for on- and off-road comfort' },
      { label: 'Seating Volume', description: 'Compact 4-passenger layout' },
      { label: 'Storage Adaptability', description: 'Compact boot, best for light luggage' },
      { label: 'Safety System', description: 'Airbags + ABS + electronic stability program' },
      { label: 'Off-Road Capability', description: '4x4 ALLGRIP with hill descent control' },
      { label: 'Connection Ports', description: 'Bluetooth audio + USB charging ports' },
    ],
  },
  {
    key: 'ertiga',
    name: 'Suzuki Ertiga',
    image: ertigaImg,
    specs: '7 seats · Hybrid · Auto · 4 doors',
    specItems: ['7 seats', 'Hybrid', 'Auto', '4 doors', '2+3 bags', 'A/C'],
    rateSubtitle: 'Hybrid · Auto · 2+3 bags',
    dailyPrice: 'SCR 1,100',
    weeklyPrice: 'SCR 6,600',
    monthlyPrice: 'SCR 26,000',
    deposit: 'SCR 6,000',
    features: [
      { label: 'Infotainment Suite', description: 'Touchscreen with Apple CarPlay & Android Auto' },
      { label: 'Climate Control', description: 'Automatic climate control + rear A/C vents' },
      { label: 'Seating Volume', description: 'Spacious 7-passenger, 3-row layout' },
      { label: 'Storage Adaptability', description: 'Flexible boot space, expands with folding seats' },
      { label: 'Safety System', description: 'Dual airbags + ABS with EBD + electronic stability control' },
      { label: 'Parking Assistance', description: 'Reverse parking sensors' },
      { label: 'Connection Ports', description: 'Bluetooth audio + USB charging ports' },
    ],
  },
];

export function getVehicle(key: string): Vehicle | undefined {
  return vehicles.find((v) => v.key === key);
}
