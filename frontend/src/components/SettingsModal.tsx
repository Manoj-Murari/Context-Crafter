import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customIgnorePatterns: string;
  setCustomIgnorePatterns: (patterns: string) => void;
  isSmartMode: boolean;
  setIsSmartMode: (isSmart: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  customIgnorePatterns,
  setCustomIgnorePatterns,
  isSmartMode,
  setIsSmartMode
}: SettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-fast">
      <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md m-4 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-purple-300">Custom Ignore Patterns</label>
            <p className="text-xs text-slate-400 mb-2">Ignore files/folders. One per line (e.g., `docs` or `*.test.js`).</p>
            <textarea
              value={customIgnorePatterns}
              onChange={(e) => setCustomIgnorePatterns(e.target.value)}
              rows={6}
              className="w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-md px-3 py-2 border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition font-mono text-sm"
              placeholder="*.log
dist
coverage"/>
          </div>
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
            <div >
                <h3 className="font-semibold text-white text-sm">Smart Mode</h3>
                <p className="text-xs text-slate-400">Auto-ignore `node_modules`, `.git`, etc.</p>
            </div>
            <button onClick={() => setIsSmartMode(!isSmartMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSmartMode ? 'bg-purple-600' : 'bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSmartMode ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
           <button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-all">
             Done
           </button>
        </div>
      </div>
    </div>
  );
}
