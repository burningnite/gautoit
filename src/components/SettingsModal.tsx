import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { detectAut2exePath } from '../utils/tauriCommands';
import { X, Search, Sliders, HardDrive, Cpu, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { compilerSettings, setCompilerSettings, outputDir, setOutputDir, namingPattern, setNamingPattern } =
    useProjectStore();

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    const path = await detectAut2exePath();
    setCompilerSettings({ aut2exePath: path });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold">Compiler & Build Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs">
          {/* Zero-Config Portable Badges */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">🚀 Embedded Toolchain:</span>
              <span className="font-mono text-emerald-400">./tmp/aut2exe/ (Auto-Extracted)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">📁 Output Directory:</span>
              <span className="font-mono text-blue-400">./outputs/ (Relative to .exe)</span>
            </div>
          </div>

          {/* Output Naming Pattern */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">Executable Naming Pattern</label>
            <input
              type="text"
              value={namingPattern}
              onChange={(e) => setNamingPattern(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Architecture & Compression */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Target Architecture</label>
              <select
                value={compilerSettings.architecture}
                onChange={(e) => setCompilerSettings({ architecture: e.target.value as 'x64' | 'x86' })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="x64">Windows 64-bit (/x64)</option>
                <option value="x86">Windows 32-bit (/x86)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Compression Level</label>
              <select
                value={compilerSettings.compressionLevel}
                onChange={(e) => setCompilerSettings({ compressionLevel: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value={0}>0 - None (Fastest)</option>
                <option value={2}>2 - Standard (Default)</option>
                <option value={4}>4 - Maximum LZMA</option>
              </select>
            </div>
          </div>

          {/* Parallel Tasks */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-slate-300 font-semibold">
              Max Concurrent Build Tasks (Tokio Semaphore limit)
            </label>
            <input
              type="number"
              min={1}
              max={16}
              value={compilerSettings.maxParallelBuilds}
              onChange={(e) => setCompilerSettings({ maxParallelBuilds: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
