# Frontend Architecture: AG-Grid & Template Integration Guide

> **Document Purpose:** Complete technical specification for the React frontend of the **AutoIt Executable Factory**, detailing AG-Grid spreadsheet state management, dynamic column key generation, CodeMirror syntax-highlighted editor, and JSON/CSV persistence.

---

## 1. Overview & UI State Flow

The application frontend manages two core user spaces:
1. **Grid Data Editor (AG-Grid):** A spreadsheet interface representing PC & Executable parameter rows ($X$ rows $\times$ $Y$ columns).
2. **Template Script Editor (CodeMirror):** A code editor displaying the master `.au3` script containing mustache-style placeholders (`{{ KEY }}`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Zustand Store (`useProjectStore`)               │
│                                                                        │
│  - columns: ColumnDef[]  -> Defines dynamic grid headers & keys        │
│  - rows: RowData[]      -> Holds spreadsheet row parameter values     │
│  - templateCode: string  -> Holds master .au3 code with {{ placeholders }}│
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ Syncs Columns & Data           │ Syncs Code & Keys
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│     AG-Grid React Component          │ │    CodeMirror Editor          │
│  - Dynamic column rendering          │ │  - AutoIt syntax highlighting │
│  - Inline cell editing               │ │  - Autocomplete placeholder   │
│  - Checkbox selection & row add/del  │ │    keys from `columns` store  │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Zustand Store Implementation (`src/store/useProjectStore.ts`)

```typescript
import { create } from 'zustand';
import { ColumnDef, RowData, ProjectConfig } from '../types';

interface ProjectState {
  projectName: string;
  templateCode: string;
  columns: ColumnDef[];
  rows: RowData[];
  outputDir: string;
  namingPattern: string;

  // Actions
  setProjectName: (name: string) => void;
  setTemplateCode: (code: string) => void;
  setOutputDir: (dir: string) => void;
  setNamingPattern: (pattern: string) => void;
  
  // Column actions
  addColumn: (column: ColumnDef) => void;
  removeColumn: (columnId: string) => void;
  
  // Row actions
  addRow: () => void;
  updateRowCell: (rowId: string, key: string, value: string) => void;
  toggleRowEnabled: (rowId: string, enabled: boolean) => void;
  deleteRows: (rowIds: string[]) => void;
  
  // Bulk persistence
  loadProject: (config: ProjectConfig) => void;
  getProjectConfig: () => ProjectConfig;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'New AutoIt Batch Project',
  templateCode: `; Master AutoIt Script Template\nGlobal $PC_NAME = "{{ PC_NAME }}"\nGlobal $EXE_PATH = "{{ EXE_PATH }}"\nRun($EXE_PATH)`,
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

  setProjectName: (projectName) => set({ projectName }),
  setTemplateCode: (templateCode) => set({ templateCode }),
  setOutputDir: (outputDir) => set({ outputDir }),
  setNamingPattern: (namingPattern) => set({ namingPattern }),

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
```

---

## 3. AG-Grid Dynamic Integration Component (`src/components/GridEditor.tsx`)

This component dynamically builds AG-Grid column definitions from the Zustand store's `columns` array.

```tsx
import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ColDef, CellValueChangedEvent } from '@ag-grid-community/core';
import { useProjectStore } from '../store/useProjectStore';
import { Plus, Trash2, FileSpreadsheet } from 'lucide-react';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

export const GridEditor: React.FC = () => {
  const { columns, rows, addRow, updateRowCell, toggleRowEnabled, deleteRows } = useProjectStore();

  // Transform store dynamic columns into AG-Grid ColDef array
  const columnDefs = useMemo<ColDef[]>(() => {
    const baseCols: ColDef[] = [
      {
        headerName: '',
        field: 'enabled',
        width: 60,
        checkboxSelection: false,
        cellRenderer: (params: any) => (
          <input
            type="checkbox"
            checked={params.value}
            onChange={(e) => toggleRowEnabled(params.data.id, e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
        ),
      },
    ];

    const dynamicCols: ColDef[] = columns.map((col) => ({
      headerName: `${col.headerName} ({{${col.key}}})`,
      field: `values.${col.key}`,
      editable: true,
      filter: 'agTextColumnFilter',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data.values[col.key] || '',
      valueSetter: (params) => {
        updateRowCell(params.data.id, col.key, params.newValue);
        return true;
      },
    }));

    return [...baseCols, ...dynamicCols];
  }, [columns, toggleRowEnabled, updateRowCell]);

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      // Cell changes auto-persisted via valueSetter
    },
    []
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-lg p-4 shadow-xl border border-slate-800">
      {/* Table Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Executable & PC Configuration Grid</h2>
          <span className="bg-slate-800 text-xs px-2.5 py-1 rounded-full text-slate-400">
            {rows.length} Entries
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={addRow}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* AG-Grid React Container */}
      <div className="ag-theme-alpine-dark flex-1 w-full rounded-lg overflow-hidden">
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            resizable: true,
          }}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
};
```

---

## 4. Project File Persistence Schema (`.aiproj`)

Projects are stored locally on Windows as human-readable `.aiproj` JSON files:

```json
{
  "version": "1.0.0",
  "projectName": "Finance & HR Deployment Batch",
  "outputDir": "C:\\Builds\\Deployables",
  "namingPattern": "Deploy_{{ PC_NAME }}.exe",
  "templateCode": "#include <MsgBoxConstants.au3>\n\nLocal $sPC = \"{{ PC_NAME }}\"\nLocal $sExe = \"{{ EXE_PATH }}\"\n\nRun($sExe & \" \" & \"{{ EXEC_PARAMS }}\")\n",
  "columns": [
    { "id": "col_pc", "headerName": "Target PC", "key": "PC_NAME", "type": "text" },
    { "id": "col_exe", "headerName": "Executable Path", "key": "EXE_PATH", "type": "filepath" },
    { "id": "col_params", "headerName": "Arguments", "key": "EXEC_PARAMS", "type": "text" }
  ],
  "rows": [
    {
      "id": "row-101",
      "enabled": true,
      "values": {
        "PC_NAME": "SERVER-FIN-01",
        "EXE_PATH": "C:\\Finance\\app.exe",
        "EXEC_PARAMS": "--silent"
      }
    }
  ]
}
```

### Tauri Rust Persistence Command (`src-tauri/src/file_manager.rs`)

```rust
use std::fs;
use std::path::Path;
use crate::models::ProjectConfig;

pub fn save_project_file(path: &str, config: &ProjectConfig) -> Result<(), String> {
    let json_data = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(path, json_data)
        .map_err(|e| format!("Failed to write file to disk: {}", e))
}

pub fn load_project_file(path: &str) -> Result<ProjectConfig, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed reading file: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid project file format: {}", e))
}
```
