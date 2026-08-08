import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { useProjectStore } from '../store/useProjectStore';
import { Code, Key, HelpCircle, Layers, PlusCircle } from 'lucide-react';

export const TemplateEditor: React.FC = () => {
  const { templateCode, setTemplateCode, columns } = useProjectStore();

  const detectedBlocksCount = useMemo(() => {
    const lines = templateCode.split('\n');
    const matches = lines.filter((l) => l.trim().startsWith('|||') || l.trim().startsWith('¬¬¬'));
    return matches.length > 0 ? matches.length : 1;
  }, [templateCode]);

  const insertPlaceholder = (key: string) => {
    const placeholder = `{{ ${key} }}`;
    setTemplateCode(templateCode + '\n' + placeholder);
  };

  const insertScriptBlock = () => {
    const blockSnippet = `\n\n||| filename = Secondary_{{ id }}.exe\n#RequireAdmin\n; Secondary script block code...\nExit\n`;
    setTemplateCode(templateCode + blockSnippet);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl p-4 shadow-2xl border border-slate-800">
      {/* Editor Header Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <Code className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-100">Master AutoIt (.au3) Script Template</h2>
              <span className="bg-indigo-500/10 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-indigo-500/30 flex items-center space-x-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>{detectedBlocksCount} Executable Block{detectedBlocksCount > 1 ? 's' : ''} Detected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Write AutoIt3 code using mustache placeholders or multi-script blocks (||| filename = ...)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={insertScriptBlock}
            className="flex items-center space-x-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-md transition font-medium"
            title="Add secondary executable script block"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Script Block (|||)</span>
          </button>

          <span className="text-xs text-slate-400">Keys:</span>
          <div className="flex items-center space-x-1 flex-wrap">
            {columns.map((col) => (
              <button
                key={col.id}
                onClick={() => insertPlaceholder(col.key)}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/50 text-indigo-300 text-xs px-2.5 py-1 rounded-md transition font-mono"
                title={`Click to insert {{ ${col.key} }}`}
              >
                <Key className="w-3 h-3 text-indigo-400" />
                <span>{`{{ ${col.key} }}`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CodeMirror Editor Area */}
      <div className="flex-1 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 font-mono text-sm shadow-inner">
        <CodeMirror
          value={templateCode}
          height="100%"
          theme="dark"
          extensions={[cpp()]}
          onChange={(value) => setTemplateCode(value)}
          className="h-full"
        />
      </div>

      {/* Footer Helper Note */}
      <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>Tip:</strong> During batch processing, backslashes inside Windows path parameters (e.g. <code>C:\Program Files</code>) are preserved automatically without escaping issues.
        </span>
      </div>
    </div>
  );
};
