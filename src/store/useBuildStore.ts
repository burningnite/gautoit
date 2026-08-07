import { create } from 'zustand';
import { RowBuildState, BuildStatus, BuildResult, BatchSummary } from '../types';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface BuildState {
  isBuilding: boolean;
  rowStates: Record<string, RowBuildState>;
  logs: LogEntry[];
  summary: BatchSummary | null;
  activeTab: 'grid' | 'template' | 'logs';

  setIsBuilding: (isBuilding: boolean) => void;
  setActiveTab: (tab: 'grid' | 'template' | 'logs') => void;
  initBatch: (rowIds: string[]) => void;
  updateRowStatus: (rowId: string, status: BuildStatus, result?: Partial<BuildResult>) => void;
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLogs: () => void;
  setSummary: (summary: BatchSummary) => void;
}

export const useBuildStore = create<BuildState>((set) => ({
  isBuilding: false,
  rowStates: {},
  logs: [],
  summary: null,
  activeTab: 'grid',

  setIsBuilding: (isBuilding) => set({ isBuilding }),
  setActiveTab: (activeTab) => set({ activeTab }),

  initBatch: (rowIds) =>
    set((state) => {
      const initialRowStates: Record<string, RowBuildState> = {};
      rowIds.forEach((id) => {
        initialRowStates[id] = {
          rowId: id,
          status: 'queued',
        };
      });
      return {
        isBuilding: true,
        summary: null,
        rowStates: initialRowStates,
        logs: [
          ...state.logs,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'info',
            message: `🚀 Batch compilation task initiated for ${rowIds.length} target row(s)...`,
          },
        ],
      };
    }),

  updateRowStatus: (rowId, status, result) =>
    set((state) => {
      const current = state.rowStates[rowId] || { rowId, status: 'idle' };
      const updated: RowBuildState = {
        ...current,
        status,
        outputExePath: result?.output_exe_path ?? current.outputExePath,
        errorMessage: result?.error_message ?? current.errorMessage,
        buildDurationMs: result?.duration_ms ?? current.buildDurationMs,
      };

      const newLogs = [...state.logs];
      if (result) {
        if (result.success) {
          newLogs.push({
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'success',
            message: `✅ Row [${rowId}] successfully compiled to: ${result.output_exe_path} (${result.duration_ms} ms)`,
          });
        } else {
          newLogs.push({
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `❌ Row [${rowId}] compilation failed: ${result.error_message || 'Unknown error'}`,
          });
        }
      }

      return {
        rowStates: { ...state.rowStates, [rowId]: updated },
        logs: newLogs,
      };
    }),

  addLog: (level, message) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level,
          message,
        },
      ],
    })),

  clearLogs: () => set({ logs: [], summary: null }),

  setSummary: (summary) => set({ summary, isBuilding: false }),
}));
