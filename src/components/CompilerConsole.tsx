import React from 'react';
import { useBuildStore } from '../store/useBuildStore';
import { Terminal, Trash2, CheckCircle, XCircle, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

export const CompilerConsole: React.FC = () => {
  const { logs, clearLogs, isBuilding, summary } = useBuildStore();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl p-4 shadow-2xl border border-slate-800">
      {/* Console Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Batch Compilation Console</h2>
            <p className="text-xs text-slate-400">Real-time compilation logs and execution metrics from Aut2exe process worker pool</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {summary && (
            <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                {summary.totalSuccess} Passed
              </span>
              <span className="text-rose-400 font-semibold flex items-center space-x-1">
                <XCircle className="w-3.5 h-3.5 inline mr-1" />
                {summary.totalFailed} Failed
              </span>
              <span className="text-slate-400 font-mono">
                {summary.totalDurationMs} ms
              </span>
            </div>
          )}

          <button
            onClick={clearLogs}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Log Output Console */}
      <div className="flex-1 w-full rounded-lg overflow-y-auto bg-slate-950 p-4 font-mono text-xs border border-slate-800 shadow-inner space-y-2">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <Terminal className="w-8 h-8 opacity-40" />
            <span>No compilation logs yet. Click 'Compile Batch' to run.</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2 leading-relaxed border-b border-slate-900/50 pb-1">
              <span className="text-slate-500 text-[11px] shrink-0">[{log.timestamp}]</span>
              {log.level === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {log.level === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {log.level === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {log.level === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}

              <span
                className={
                  log.level === 'success'
                    ? 'text-emerald-300 font-medium'
                    : log.level === 'error'
                    ? 'text-rose-300 font-medium'
                    : log.level === 'warn'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
