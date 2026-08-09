import React, { useMemo, useState, useRef, useCallback } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ModuleRegistry, ColDef, GetRowIdParams, CellValueChangedEvent } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { useProjectStore } from '../store/useProjectStore';
import { useBuildStore } from '../store/useBuildStore';
import { Plus, Trash2, FileSpreadsheet, PlusCircle, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

// Register AG-Community Modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export const GridEditor: React.FC = () => {
  const { columns, rows, addRow, addColumn, updateRowCell, toggleRowEnabled, deleteRows, reorderColumns } = useProjectStore();
  const { rowStates } = useBuildStore();
  const [newColName, setNewColName] = useState('');
  const [newColKey, setNewColKey] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Keep refs to latest store functions so columnDefs don't need to depend on them
  const toggleRowEnabledRef = useRef(toggleRowEnabled);
  toggleRowEnabledRef.current = toggleRowEnabled;
  const updateRowCellRef = useRef(updateRowCell);
  updateRowCellRef.current = updateRowCell;
  const reorderColumnsRef = useRef(reorderColumns);
  reorderColumnsRef.current = reorderColumns;

  // Stable getRowId so AG-Grid can track rows by identity across re-renders
  const getRowId = useCallback((params: GetRowIdParams) => params.data.id, []);

  // Transform store dynamic columns into AG-Grid ColDef array
  // Only depends on columns (schema) and rowStates (build status), NOT on store mutators
  const columnDefs = useMemo<ColDef[]>(() => {
    const baseCols: ColDef[] = [
      {
        headerName: 'Enable',
        field: 'enabled',
        width: 80,
        pinned: 'left',
        cellRenderer: (params: any) => (
          <div className="flex items-center justify-center h-full">
            <input
              type="checkbox"
              checked={params.value}
              onChange={(e) => toggleRowEnabledRef.current(params.data.id, e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>
        ),
      },
      {
        headerName: 'Status',
        field: 'id',
        width: 110,
        pinned: 'left',
        cellRenderer: (params: any) => {
          const state = rowStates[params.value];
          if (!state || state.status === 'idle') {
            return (
              <span className="flex items-center space-x-1 text-slate-500 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Ready</span>
              </span>
            );
          }
          if (state.status === 'queued') {
            return <span className="text-amber-400 text-xs font-mono">Queued...</span>;
          }
          if (state.status === 'building') {
            return <span className="text-blue-400 text-xs font-mono animate-pulse">Building...</span>;
          }
          if (state.status === 'success') {
            return (
              <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success</span>
              </span>
            );
          }
          return (
            <span className="flex items-center space-x-1 text-rose-400 text-xs font-semibold" title={state.errorMessage}>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </span>
          );
        },
      },
    ];

    const dynamicCols: ColDef[] = columns.map((col) => ({
      headerName: col.headerName,
      field: col.key,
      editable: true,
      filter: 'agTextColumnFilter',
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => {
        if (!params.data || !params.data.values) return '';
        const val = params.data.values[col.key];
        if (val !== undefined) return val;
        // Fallback case-insensitive key lookup
        const lowerKey = col.key.toLowerCase();
        const foundKey = Object.keys(params.data.values).find((k) => k.toLowerCase() === lowerKey);
        return foundKey ? params.data.values[foundKey] : '';
      },
      valueSetter: (params) => {
        if (!params.data) return false;
        params.data.values[col.key] = params.newValue || '';
        updateRowCellRef.current(params.data.id, col.key, params.newValue || '');
        return true;
      },
    }));


    return [...baseCols, ...dynamicCols];
  }, [columns, rowStates]);

  // Handle cell edits via grid event instead of inline valueSetter — avoids columnDefs churn
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    if (!event.data || !event.colDef.field) return;
    updateRowCellRef.current(event.data.id, event.colDef.field, event.newValue || '');
  }, []);

  // Handle column reordering via grid event
  const onColumnMoved = useCallback((event: any) => {
    const colState = event.api.getColumnState();
    const orderedKeys = colState
      .map((col: any) => col.colId)
      .filter((colId: any) => colId !== 'enabled' && colId !== 'id');

    const currentKeys = columns.map((c) => c.key);
    const isDifferent =
      orderedKeys.length === currentKeys.length &&
      orderedKeys.some((val: string, index: number) => val !== currentKeys[index]);

    if (isDifferent) {
      reorderColumnsRef.current(orderedKeys);
    }
  }, [columns]);

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName || !newColKey) return;
    const cleanKey = newColKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    addColumn({
      id: `col_${Date.now()}`,
      headerName: newColName.trim(),
      key: cleanKey,
      type: 'text',
    });
    setNewColName('');
    setNewColKey('');
    setShowAddCol(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl p-4 shadow-2xl border border-slate-800">
      {/* Grid Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Executable & Target Parameter Grid</h2>
            <p className="text-xs text-slate-400">Configure PC targets, paths, and dynamic key values for batch generation</p>
          </div>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-mono border border-slate-700">
            {rows.length} Target Rows
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddCol(!showAddCol)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Add Column</span>
          </button>

          <button
            onClick={addRow}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium shadow-md shadow-blue-900/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Add Column Dialog Drawer */}
      {showAddCol && (
        <form onSubmit={handleAddColumnSubmit} className="mb-4 p-3 bg-slate-950/80 border border-indigo-500/30 rounded-lg flex items-center space-x-3">
          <input
            type="text"
            placeholder="Header Label (e.g. Server IP)"
            value={newColName}
            onChange={(e) => {
              setNewColName(e.target.value);
              if (!newColKey) setNewColKey(e.target.value.toUpperCase().replace(/\s+/g, '_'));
            }}
            className="bg-slate-900 border border-slate-700 text-xs rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Template Key (e.g. SERVER_IP)"
            value={newColKey}
            onChange={(e) => setNewColKey(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs rounded px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded font-medium transition"
          >
            Save Column
          </button>
          <button
            type="button"
            onClick={() => setShowAddCol(false)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2"
          >
            Cancel
          </button>
        </form>
      )}

      {/* AG-Grid React Container */}
      <div className="ag-theme-alpine-dark flex-1 w-full rounded-lg overflow-hidden border border-slate-800 shadow-inner">
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          getRowId={getRowId}
          onCellValueChanged={onCellValueChanged}
          onColumnMoved={onColumnMoved}
          defaultColDef={{
            sortable: true,
            resizable: true,
            filter: true,
          }}
          maintainColumnOrder={true}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
};
