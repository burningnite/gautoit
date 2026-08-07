import React from 'react';
import { HeaderNav } from './components/HeaderNav';
import { GridEditor } from './components/GridEditor';
import { TemplateEditor } from './components/TemplateEditor';
import { CompilerConsole } from './components/CompilerConsole';
import { useBuildStore } from './store/useBuildStore';

export const App: React.FC = () => {
  const { activeTab } = useBuildStore();

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
