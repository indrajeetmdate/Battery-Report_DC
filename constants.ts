
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
  parallel: 1
};
