
export interface BatterySpecs {
  chemistry: 'LFP' | 'NMC';
  nominalVoltage: number;
  ratedCapacity: number;
  ratedLifeCycle: number;
  bms: 'Yes active' | 'Yes passive' | 'No';
  warrantyPeriod: string;
  // New fields
  cellType: string;
  series: number;
  parallel: number;
}

export interface DataPoint {
  duration: number; // in seconds or minutes
  voltage: number;
  current: number;
  capacity: number;
  temperature: number;
}

export interface LogEntry {
  step: string;
  phase: string;
  voltage: string;
  capacity: string;
  exitCondition: string;
  exitPhase: string;
}

export interface LoopSummary {
  metric: string;
  value: string | number;
}

export interface ProcessedData {
  fileName: string;
  timeSeries: DataPoint[];
  logs: LogEntry[];
  loopSummary: LoopSummary[];
}
