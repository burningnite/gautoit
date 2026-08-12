export interface PlatformAccount {
  user: string;
  password?: string;
}

export interface PlatformConfig {
  launcher: string;
  gameBasePath: string;
  gameExt: string;
  games: string[];
  templateCode: string;
}

export interface FardoPC {
  id: string;
  enabled: boolean;
  shortwait: number;
  prepasswait: number;
  accounts: Record<string, PlatformAccount>; // e.g., 'epic': { user: '...' }
  disabledGames: string[]; // games that this PC should not compile for
}

export interface FardoConfig {
  version: string;
  projectName: string;
  outputDir: string;
  namingPattern: string;
  timerBasePath: string;
  platforms: Record<string, PlatformConfig>;
  pcs: FardoPC[];
}

export interface CompilerSettings {
  aut2exePath: string;               // Path to Aut2exe.exe on Windows
  architecture: 'x64' | 'x86';       // Target architecture flag for Aut2exe (/x64 or /x86)
  compressionLevel: number;           // Compression switch /comp 0..4
  isConsoleApp: boolean;              // /console flag
  customIconPath?: string;            // Default .ico path
  maxParallelBuilds: number;          // Worker pool count (e.g. 4 parallel builds)
}

export type BuildStatus = 'idle' | 'queued' | 'building' | 'success' | 'failed';

export interface RowBuildState {
  rowId: string;
  status: BuildStatus;
  outputExePath?: string;
  errorMessage?: string;
  buildDurationMs?: number;
}

export interface BuildResult {
  row_id: string;
  success: boolean;
  output_exe_path: string;
  error_message?: string;
  duration_ms: number;
}

export interface BatchSummary {
  totalSuccess: number;
  totalFailed: number;
  totalDurationMs: number;
}
