import { create } from 'zustand';
import { ColumnDef, RowData, ProjectConfig, CompilerSettings } from '../types';

interface ProjectState {
  projectName: string;
  templateCode: string;
  columns: ColumnDef[];
  rows: RowData[];
  outputDir: string;
  namingPattern: string;
  compilerSettings: CompilerSettings;

  // Setters
  setProjectName: (name: string) => void;
  setTemplateCode: (code: string) => void;
  setOutputDir: (dir: string) => void;
  setNamingPattern: (pattern: string) => void;
  setCompilerSettings: (settings: Partial<CompilerSettings>) => void;
  
  // Column actions
  addColumn: (column: ColumnDef) => void;
  removeColumn: (columnId: string) => void;
  
  // Row actions
  addRow: () => void;
  updateRowCell: (rowId: string, key: string, value: string) => void;
  toggleRowEnabled: (rowId: string, enabled: boolean) => void;
  deleteRows: (rowIds: string[]) => void;
  
  // Bulk persistence & loading
  loadProject: (config: ProjectConfig) => void;
  getProjectConfig: () => ProjectConfig;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'New AutoIt Batch Project',
  templateCode: `; Master AutoIt Script Template\n#include <MsgBoxConstants.au3>\n\nGlobal Const $PC_NAME = "{{ PC_NAME }}"\nGlobal Const $EXE_PATH = "{{ EXE_PATH }}"\nGlobal Const $EXEC_PARAMS = "{{ EXEC_PARAMS }}"\n\nMsgBox($MB_ICONINFORMATION, "Deployment", "Target PC: " & $PC_NAME)\n`,
  columns: [
    { id: 'col_pc', headerName: 'Target PC', key: 'PC_NAME', type: 'text' },
    { id: 'col_exe', headerName: 'Executable Path', key: 'EXE_PATH', type: 'filepath' },
    { id: 'col_args', headerName: 'Arguments', key: 'EXEC_PARAMS', type: 'text' },
  ],
  rows: [
    {
      id: 'row-1',
      enabled: true,
      values: {
        PC_NAME: 'DESKTOP-FINANCE-01',
        EXE_PATH: 'C:\\Apps\\FinanceApp.exe',
        EXEC_PARAMS: '--silent --log',
      },
    },
    {
      id: 'row-2',
      enabled: true,
      values: {
        PC_NAME: 'DESKTOP-HR-02',
        EXE_PATH: 'C:\\Apps\\HrApp.exe',
        EXEC_PARAMS: '--mode=auto',
      },
    },
  ],
  outputDir: 'C:\\AutoItBuilds\\Output',
  namingPattern: 'Build_{{ PC_NAME }}.exe',
  compilerSettings: {
    aut2exePath: 'C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe',
    architecture: 'x64',
    compressionLevel: 2,
    isConsoleApp: false,
    maxParallelBuilds: 4,
  },

  setProjectName: (projectName) => set({ projectName }),
  setTemplateCode: (templateCode) => set({ templateCode }),
  setOutputDir: (outputDir) => set({ outputDir }),
  setNamingPattern: (namingPattern) => set({ namingPattern }),
  setCompilerSettings: (settings) =>
    set((state) => ({
      compilerSettings: { ...state.compilerSettings, ...settings },
    })),

  addColumn: (col) =>
    set((state) => ({
      columns: [...state.columns, col],
    })),

  removeColumn: (colId) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== colId),
    })),

  addRow: () =>
    set((state) => {
      const newRowId = `row-${Date.now()}`;
      const defaultValues: Record<string, string> = {};
      state.columns.forEach((col) => {
        defaultValues[col.key] = col.defaultValue || '';
      });
      return {
        rows: [
          ...state.rows,
          { id: newRowId, enabled: true, values: defaultValues },
        ],
      };
    }),

  updateRowCell: (rowId, key, value) =>
    set((state) => ({
      rows: state.rows.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [key]: value } }
          : row
      ),
    })),

  toggleRowEnabled: (rowId, enabled) =>
    set((state) => ({
      rows: state.rows.map((row) =>
        row.id === rowId ? { ...row, enabled } : row
      ),
    })),

  deleteRows: (rowIds) =>
    set((state) => ({
      rows: state.rows.filter((row) => !rowIds.includes(row.id)),
    })),

  loadProject: (config) =>
    set({
      projectName: config.projectName,
      templateCode: config.templateCode,
      columns: config.columns,
      rows: config.rows,
      outputDir: config.outputDir,
      namingPattern: config.namingPattern,
    }),

  getProjectConfig: () => {
    const s = get();
    return {
      version: '1.0.0',
      projectName: s.projectName,
      templateCode: s.templateCode,
      columns: s.columns,
      rows: s.rows,
      outputDir: s.outputDir,
      namingPattern: s.namingPattern,
    };
  },
}));
