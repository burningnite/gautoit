import { invoke } from '@tauri-apps/api/core';
import { FardoConfig, CompilerSettings, BuildResult, BatchSummary } from '../types';

export async function autoLoadFardo(): Promise<FardoConfig | null> {
  try {
    return await invoke<FardoConfig | null>('auto_load_fardo');
  } catch (err) {
    console.warn('Auto-load .fardo check skipped (web preview or non-Tauri mode).', err);
    return null;
  }
}

export async function autoSaveFardo(config: FardoConfig): Promise<string | null> {
  try {
    return await invoke<string>('auto_save_fardo', { config });
  } catch (err) {
    console.warn('Auto-save .fardo skipped.', err);
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
  fardoConfig: FardoConfig,
  compilerSettings: CompilerSettings
): Promise<BatchSummary> {
  try {
    return await invoke<BatchSummary>('compile_batch', {
      fardoConfig,
      compilerSettings,
    });
  } catch (err) {
    console.error('Batch compilation invoke failed:', err);
    throw err;
  }
}

export async function saveFardo(filePath: string, config: FardoConfig): Promise<void> {
  try {
    await invoke('save_fardo_file', { filePath, config });
  } catch (err) {
    console.error('Save fardo failed:', err);
    throw err;
  }
}

export async function loadFardo(filePath: string): Promise<FardoConfig> {
  try {
    return await invoke<FardoConfig>('load_fardo_file', { filePath });
  } catch (err) {
    console.error('Load fardo failed:', err);
    throw err;
  }
}
