import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { X, Layers, Code } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformConfigModal: React.FC<PlatformModalProps> = ({ isOpen, onClose }) => {
  const { platforms, updatePlatform } = useProjectStore();
  const [activePlatform, setActivePlatform] = useState<string>('epic');

  if (!isOpen) return null;

  const currentPlatform = platforms[activePlatform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 p-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold">Platform Configurations</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-slate-950 border-r border-slate-800 p-2 space-y-1">
            {Object.keys(platforms).map(platformId => (
              <button
                key={platformId}
                onClick={() => setActivePlatform(platformId)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  activePlatform === platformId 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                {platformId} Platform
              </button>
            ))}
          </div>

          {/* Config Editor */}
          {currentPlatform && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Launcher Path</label>
                  <input
                    type="text"
                    value={currentPlatform.launcher}
                    onChange={(e) => updatePlatform(activePlatform, { launcher: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-blue-500 outline-none w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Game Base Path</label>
                    <input
                      type="text"
                      value={currentPlatform.gameBasePath}
                      onChange={(e) => updatePlatform(activePlatform, { gameBasePath: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-blue-500 outline-none w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Game Extension</label>
                    <input
                      type="text"
                      value={currentPlatform.gameExt}
                      onChange={(e) => updatePlatform(activePlatform, { gameExt: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-blue-500 outline-none w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Games (Comma-separated)</label>
                  <input
                    type="text"
                    value={currentPlatform.games.join(', ')}
                    onChange={(e) => {
                      const games = e.target.value.split(',').map(g => g.trim()).filter(Boolean);
                      updatePlatform(activePlatform, { games });
                    }}
                    className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <Code className="w-4 h-4 text-blue-400" />
                  <label className="text-xs font-semibold text-slate-400">Platform AutoIt Template</label>
                </div>
                <div className="rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                  <CodeMirror
                    value={currentPlatform.templateCode}
                    height="300px"
                    extensions={[cpp()]}
                    theme="dark"
                    onChange={(val) => updatePlatform(activePlatform, { templateCode: val })}
                    className="text-sm text-left"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Use {'{{ placeholders }}'} matching the Fardo parameters (user, password, id, shortwait, prepasswait, gamename, gamepath, launcher, timer).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
