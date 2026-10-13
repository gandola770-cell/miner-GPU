export type MiningAlgorithmId = 'kawpow' | 'ethash' | 'autolykos' | 'kaspa';

export interface MiningAlgorithm {
  id: MiningAlgorithmId;
  name: string;
  coin: string;
  ticker: string;
  dagSizeGb: number;
  currentEpoch: number;
  estRevPer100Mh: number; // USD per day per 100 MH/s
  unit: 'MH/s' | 'GH/s';
  defaultPool: string;
}

export interface GpuDevice {
  id: number;
  name: string;
  architecture: string;
  vram: string;
  pcieSlot: string;
  serialNumber: string;
  vbios: string;
  status: 'mining' | 'paused' | 'rebooting' | 'benchmarking';
  hashrate: number; // in current algo unit
  hashrateUnit: string;
  coreTemp: number; // °C
  vramTemp: number; // °C
  hotspotTemp: number; // °C
  fanSpeedPercent: number;
  fanRpm: number;
  powerDrawWatts: number;
  tdpWatts: number;
  coreClockMhz: number;
  memClockMhz: number;
  voltageV: number;
  sharesAccepted: number;
  sharesRejected: number;
  // Overclock values
  powerLimitPercent: number;
  coreOffsetMhz: number;
  memOffsetMhz: number;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'job' | 'share' | 'thermal' | 'system' | 'cpu' | 'block';
  tag: string;
  message: string;
  highlight?: boolean;
}

export type ViewTab =
  | 'fleet-telemetry'
  | 'gpu-matrix'
  | 'flight-sheet'
  | 'overclock-tuning'
  | 'thermal-power'
  | 'node-terminal';

export type OcPresetType = 'eco' | 'balanced' | 'max-hash';

export type RgbMode = 'cyan' | 'emerald' | 'amber' | 'purple' | 'rainbow' | 'off';

export interface ThermalAlert {
  id: string;
  gpuId: number;
  gpuName: string;
  coreTemp: number;
  vramTemp: number;
  threshold: number;
  timestamp: string;
}
