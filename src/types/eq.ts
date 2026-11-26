export const EQ_FREQUENCIES = [60, 150, 400, 1000, 2500, 6000, 12000, 16000] as const;

export type EqFrequency = (typeof EQ_FREQUENCIES)[number];

export interface BandGain {
  freq: number;
  gain: number;
}

export interface EqProfile {
  id: string;
  name: string;
  description: string;
  preamp: number;
  bands: BandGain[];
  isCustom: boolean;
}

export interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface ApoStatus {
  installed: boolean;
  basePath: string;
  configPath: string;
  writable: boolean;
  error: string | null;
}

export interface ApplyEqPayload {
  deviceName: string;
  profileId: string;
  preamp: number;
  bands: BandGain[];
  bypassed: boolean;
  customApoPath: string | null;
}

export interface ApplyEqResult {
  configPath: string;
  writtenContent: string;
}

export interface TraySyncEvent {
  profileId: string;
  preamp: number;
  bands: BandGain[];
  bypassed: boolean;
}
