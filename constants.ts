
import { BatterySpecs } from "./types";

export const COLORS = {
  primary: '#78AD3E',
  secondary: '#B4D192',
  text: '#41463F',
  accent: '#525254',
  background: '#F8F9F8',
  white: '#FFFFFF'
};

export const LOGO_URL = "https://bfkxdpripwjxenfvwpfu.supabase.co/storage/v1/object/public/Logo/DC_Energy.png";
export const STAMP_URL = "https://bfkxdpripwjxenfvwpfu.supabase.co/storage/v1/object/public/Logo/DC_Stamp.png";

export const DEFAULT_SPECS: BatterySpecs = {
  chemistry: 'LFP',
  nominalVoltage: 12.8,
  ratedCapacity: 100,
  ratedLifeCycle: 2000,
  bms: 'Yes passive',
  warrantyPeriod: '3 Years',
  cellType: '32700',
  series: 4,
  parallel: 1,
  applications: [],
  terminalType: 'Spot Welded Nickel / M6 Bolted',
  dimensions: '(L) x (W) x (H) mm',
  weight: 'numeric entry kg'
};

export const CELL_SPECS: Record<string, { capacity: number, weight: number }> = {
  '21700': { capacity: 4.5, weight: 0.07 },
  '32140': { capacity: 15, weight: 0.305 },
  '32700': { capacity: 6, weight: 0.145 },
  '18650': { capacity: 2.6, weight: 0.048 },
  '26650': { capacity: 5, weight: 0.1 },
  '628Ah': { capacity: 628, weight: 11.5 },
  '50Ah': { capacity: 50, weight: 1.5 },
  '100Ah': { capacity: 100, weight: 2.3 },
  '105Ah': { capacity: 105, weight: 2.04 },
  '230Ah': { capacity: 230, weight: 4.264 }
};
