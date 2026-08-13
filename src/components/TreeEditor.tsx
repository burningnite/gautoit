import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Settings } from 'lucide-react';

export const TreeEditor: React.FC = () => {
  const { pcs, platforms, addPC, removePC, togglePCEnabled, togglePCGame, updatePC, updatePCAccount, timerBasePath, setTimerBasePath } = useProjectStore();
  
  const [expandedPCs, setExpandedPCs] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedPCs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 bg-slate-950 rounded-xl shadow-inner text-slate-200 font-sans">
      
      {/* Global Header & Settings */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Taurito Deployment Tree
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage hierarchical multi-platform configurations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Timer Base Path:</span>
            <input 
              type="text" 
              value={timerBasePath} 
              onChange={(e) => setTimerBasePath(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-200 focus:outline-none w-48"
            />
          </div>
          <button 
            onClick={addPC} 
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-lg text-sm text-white font-semibold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
          >
            + Add PC Node
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {pcs.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <Settings className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-lg text-slate-400 font-medium">No PC nodes configured.</p>
            <p className="text-sm text-slate-500 mt-1">Click "+ Add PC Node" to start building your deployment tree.</p>
          </div>
        )}

        {pcs.map(pc => {
          const isExpanded = expandedPCs[pc.id] !== false; // expanded by default

          return (
            <div key={pc.id} className="border border-slate-800 rounded-xl bg-slate-900 shadow-sm overflow-hidden transition-all">
              
              {/* PC Header Bar */}
              <div className={`flex items-center justify-between p-4 ${isExpanded ? 'bg-slate-800/50 border-b border-slate-800' : 'hover:bg-slate-800/30'} transition-colors`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleExpand(pc.id)} className="text-slate-400 hover:text-slate-200 transition-colors">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <input 
                    type="checkbox" 
                    checked={pc.enabled} 
                    onChange={(e) => togglePCEnabled(pc.id, e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium uppercase text-xs tracking-wider">PC ID</span>
                    <input
                      type="text"
                      value={pc.id}
                      onChange={(e) => updatePC(pc.id, { id: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-emerald-400 w-16 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Wait (s):</span>
                    <input
                      type="number"
                      value={pc.shortwait}
                      onChange={(e) => updatePC(pc.id, { shortwait: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-16 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">PrePass (s):</span>
                    <input
                      type="number"
                      value={pc.prepasswait}
                      onChange={(e) => updatePC(pc.id, { prepasswait: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 w-16 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="w-px h-6 bg-slate-700"></div>
                  <button 
                    onClick={() => removePC(pc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Delete PC"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-5 grid grid-cols-2 gap-6 bg-slate-900/30">
                  {Object.entries(platforms).map(([platformId, platform]) => {
                    const account = pc.accounts[platformId] || { user: '', password: '' };
                    
                    return (
                      <div key={platformId} className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/60 shadow-sm relative overflow-hidden">
                        {/* Subtle background gradient for platform */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${platformId === 'epic' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
                        
                        <div className="flex justify-between items-center mb-4 pl-2">
                          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{platformId} PLATFORM</h4>
                        </div>
                        
                        <div className="space-y-3 pl-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500 font-medium">Account User/Email</label>
                            <input
                              type="text"
                              value={account.user}
                              placeholder={`Enter ${platformId} user...`}
                              onChange={(e) => updatePCAccount(pc.id, platformId, { ...account, user: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:bg-slate-800 outline-none transition-colors w-full"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500 font-medium">Account Password</label>
                            <input
                              type="text"
                              value={account.password || ''}
                              placeholder="Enter password..."
                              onChange={(e) => updatePCAccount(pc.id, platformId, { ...account, password: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:bg-slate-800 outline-none transition-colors w-full"
                            />
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-800">
                            <label className="text-xs text-slate-500 font-medium block mb-2">Available Games</label>
                            <div className="grid grid-cols-2 gap-2">
                              {platform.games.map(game => {
                                const isEnabled = !pc.disabledGames.includes(game);
                                return (
                                  <label 
                                    key={game} 
                                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${
                                      isEnabled 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/20' 
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isEnabled}
                                      onChange={(e) => togglePCGame(pc.id, game, e.target.checked)}
                                      className="hidden" // Hidden native checkbox, styled parent handles visual
                                    />
                                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center ${isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                      {isEnabled && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="text-xs font-medium truncate" title={game}>{game}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
