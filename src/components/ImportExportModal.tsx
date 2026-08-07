import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { X, Upload, Download, FileCode, Check } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { getProjectConfig, loadProject } = useProjectStore();
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const config = getProjectConfig();
    setJsonText(JSON.stringify(config, null, 2));
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.columns || !parsed.rows) {
        alert('Invalid project structure! Missing required columns or rows.');
        return;
      }
      loadProject(parsed);
      alert('Project configuration loaded successfully!');
      onClose();
    } catch (err: any) {
      alert(`JSON Parse Error: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Import / Export Project Data</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs">
          <div className="flex space-x-2">
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>Generate JSON Export</span>
            </button>
            {jsonText && (
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <FileCode className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              Project Data (.aiproj / JSON format)
            </label>
            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste .aiproj JSON data here to import or click Export above..."
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <button
            onClick={handleImportJson}
            disabled={!jsonText}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON into Project</span>
          </button>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
