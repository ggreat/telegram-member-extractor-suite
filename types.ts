
export interface AppConfig {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  targetGroup: string;
}

export enum ViewMode {
  CONFIG = 'CONFIG',
  SCRIPT = 'SCRIPT',
  SIMULATOR = 'SIMULATOR',
  AI_HELPER = 'AI_HELPER'
}

export interface TerminalLine {
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'input';
}
