export interface ColumnDef {
  id: string;          // e.g. "col_pc_name", "col_exe_path"
  headerName: string;  // e.g. "Target PC", "Executable Path"
  key: string;         // Placeholder key used in template: e.g. "PC_NAME"
  type: 'text' | 'number' | 'boolean' | 'filepath';
  defaultValue?: string;
}

export interface RowData {
  id: string;                         // Unique UUID for the row
  enabled: boolean;                   // Toggle to include/exclude row from batch compile
  values: Record<string, string>;     // Key-value map: { "PC_NAME": "SERVER-01", "EXE_PATH": "C:\\app.exe" }
}

export interface ProjectConfig {
  version: string;
  projectName: string;
  templateCode: string;               // AutoIt script with {{PLACEHOLDERS}}
  columns: ColumnDef[];
  rows: RowData[];
  outputDir: string;
  namingPattern: string;              // e.g. "Build_{{PC_NAME}}_{{EXE_NAME}}.exe"
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
