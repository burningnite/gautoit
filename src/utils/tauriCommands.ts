import { invoke } from '@tauri-apps/api/core';
import { ProjectConfig, CompilerSettings, BuildResult, BatchSummary } from '../types';

export async function autoLoadAiproj(): Promise<ProjectConfig | null> {
  try {
    return await invoke<ProjectConfig | null>('auto_load_aiproj');
  } catch (err) {
    console.warn('Auto-load .aiproj check skipped (web preview or non-Tauri mode).', err);
    return null;
  }
}

export async function detectAut2exePath(): Promise<string> {
  try {
    return await invoke<string>('detect_aut2exe_path');
  } catch (err) {
    console.warn('Tauri IPC not available, using default fallback path.', err);
    return 'C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe';
  }
}

export async function compileBatch(
  projectConfig: ProjectConfig,
  compilerSettings: CompilerSettings
): Promise<BatchSummary> {
  try {
    return await invoke<BatchSummary>('compile_batch', {
      projectConfig,
      compilerSettings,
    });
  } catch (err) {
    console.error('Batch compilation invoke failed:', err);
    throw err;
  }
}

export async function saveProject(filePath: string, config: ProjectConfig): Promise<void> {
  try {
    await invoke('save_project_file', { filePath, config });
  } catch (err) {
    console.error('Save project failed:', err);
    throw err;
  }
}

export async function loadProject(filePath: string): Promise<ProjectConfig> {
  try {
    return await invoke<ProjectConfig>('load_project_file', { filePath });
  } catch (err) {
    console.error('Load project failed:', err);
    throw err;
  }
}
