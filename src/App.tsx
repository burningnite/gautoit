import React, { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { HeaderNav } from './components/HeaderNav';
import { GridEditor } from './components/GridEditor';
import { TemplateEditor } from './components/TemplateEditor';
import { CompilerConsole } from './components/CompilerConsole';
import { useBuildStore } from './store/useBuildStore';
import { useProjectStore } from './store/useProjectStore';
import { autoLoadAiproj } from './utils/tauriCommands';
import { BuildResult, BatchSummary } from './types';

export const App: React.FC = () => {
  const { activeTab, updateRowStatus, setSummary, addLog } = useBuildStore();
  const { loadProject } = useProjectStore();

  useEffect(() => {
    let unlistenStarted: (() => void) | undefined;
    let unlistenCompleted: (() => void) | undefined;
    let unlistenFinished: (() => void) | undefined;

    const setupApp = async () => {
      // 1. Auto-import any .aiproj file found in the execution directory
      try {
        const autoProject = await autoLoadAiproj();
        if (autoProject) {
          loadProject(autoProject);
          addLog('info', `📂 Automatically loaded project configuration from local .aiproj file: "${autoProject.projectName}"`);
        }
      } catch (err) {
        console.warn('Auto-import check skipped:', err);
      }

      // 2. Setup Tauri event listeners for real-time progress
      try {
        unlistenStarted = await listen<{ row_id: string }>('row-build-started', (event) => {
          updateRowStatus(event.payload.row_id, 'building');
          addLog('info', `⏳ Compiling row [${event.payload.row_id}]...`);
        });

        unlistenCompleted = await listen<BuildResult>('row-build-completed', (event) => {
          const res = event.payload;
          updateRowStatus(res.row_id, res.success ? 'success' : 'failed', res);
        });

        unlistenFinished = await listen<BatchSummary>('batch-finished', (event) => {
          setSummary(event.payload);
        });
      } catch (err) {
        console.warn('Tauri event listener setup skipped (web preview mode).', err);
      }
    };

    setupApp();

    return () => {
      if (unlistenStarted) unlistenStarted();
      if (unlistenCompleted) unlistenCompleted();
      if (unlistenFinished) unlistenFinished();
    };
  }, [updateRowStatus, setSummary, addLog, loadProject]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Navbar */}
      <HeaderNav />

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 overflow-hidden relative">
        {activeTab === 'grid' && (
          <div className="h-full w-full">
            <GridEditor />
          </div>
        )}

        {activeTab === 'template' && (
          <div className="h-full w-full">
            <TemplateEditor />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="h-full w-full">
            <CompilerConsole />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
