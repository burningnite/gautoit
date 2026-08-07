import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useBuildStore } from '../store/useBuildStore';
import { compileBatch } from '../utils/tauriCommands';
import { SettingsModal } from './SettingsModal';
import { ImportExportModal } from './ImportExportModal';
import { 
  Play, 
  FolderOpen, 
  Save, 
  Settings, 
  Download, 
  Code, 
  Table, 
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';

import { autoSaveAiproj } from '../utils/tauriCommands';

export const HeaderNav: React.FC = () => {
  const { projectName, setProjectName, getProjectConfig, compilerSettings } = useProjectStore();
  const { isBuilding, initBatch, setActiveTab, activeTab, addLog, setSummary } = useBuildStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleQuickSave = async () => {
    setIsSaving(true);
    try {
      const savedPath = await autoSaveAiproj(getProjectConfig());
      if (savedPath) {
        addLog('success', `💾 Project auto-saved back to disk: ${savedPath}`);
      }
    } catch (err: any) {
      addLog('error', `Failed saving project: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartCompile = async () => {
    const config = getProjectConfig();
    const enabledRows = config.rows.filter((r) => r.enabled);

    if (enabledRows.length === 0) {
      alert('No rows selected/enabled for batch compilation!');
      return;
    }

    initBatch(enabledRows.map((r) => r.id));
    setActiveTab('logs');

    try {
      addLog('info', `Starting compilation with toolchain: ${compilerSettings.aut2exePath}`);
      const summary = await compileBatch(config, compilerSettings);
      setSummary(summary);
      addLog(
        'success',
        `🎉 Batch Complete! Passed: ${summary.totalSuccess}, Failed: ${summary.totalFailed} (Total time: ${summary.totalDurationMs} ms)`
      );
    } catch (err: any) {
      addLog('error', `Batch compilation system failure: ${err?.message || err}`);
    }
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg select-none">
        {/* Left section: App Brand & Project Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-md">
            <Cpu className="w-6 h-6 animate-pulse" />
            <span className="font-bold text-sm tracking-wider uppercase">AutoIt Factory</span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-slate-950/50 hover:bg-slate-950 focus:bg-slate-950 border border-slate-700/50 focus:border-blue-500 rounded px-2.5 py-1 text-sm font-medium text-slate-200 outline-none transition w-64"
              placeholder="Project Name..."
            />
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded border border-slate-700">
              v1.0 Windows Native
            </span>
          </div>
        </div>

        {/* Center section: View Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'grid'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Data Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'template'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Master Template</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Build Logs</span>
          </button>
        </div>

        {/* Right section: Action Buttons & Compile Launcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleQuickSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            title="Save project back to local .aiproj file"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Save .aiproj'}</span>
          </button>

          <button
            onClick={() => setIsImportExportOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition border border-slate-700"
            title="Import / Export Data"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Import/Export</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition border border-slate-700"
            title="Compiler & Toolchain Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={handleStartCompile}
            disabled={isBuilding}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg transition transform active:scale-95 ${
              isBuilding
                ? 'bg-slate-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
            }`}
          >
            <Play className={`w-4 h-4 ${isBuilding ? 'animate-spin' : 'fill-current'}`} />
            <span>{isBuilding ? 'Compiling Batch...' : 'Compile Batch'}</span>
          </button>
        </div>
      </header>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ImportExportModal isOpen={isImportExportOpen} onClose={() => setIsImportExportOpen(false)} />
    </>
  );
};
