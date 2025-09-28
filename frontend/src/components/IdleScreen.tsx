import { UploadCloud, Github } from 'lucide-react';
import { useCallback } from 'react';

interface IdleScreenProps {
  inputType: 'drop' | 'github';
  setInputType: (type: 'drop' | 'github') => void;
  githubUrl: string;
  setGithubUrl: (url: string) => void;
  handleProcessGithub: () => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  isSmartMode: boolean;
}

export function IdleScreen({
  inputType,
  setInputType,
  githubUrl,
  setGithubUrl,
  handleProcessGithub,
  handleFileDrop,
  isDragging,
  setIsDragging,
  isSmartMode,
}: IdleScreenProps) {
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [setIsDragging]);

  return (
    <div className="flex-grow flex flex-col space-y-4">
      {isSmartMode && (
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-purple-300">Smart Mode Enabled</span>
          </div>
          <p className="text-xs text-slate-300">
            AI-powered ignore list generation will help you create the perfect context for your project.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-md border border-slate-700">
        <button onClick={() => setInputType('drop')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputType === 'drop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>Drag & Drop</button>
        <button onClick={() => setInputType('github')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${inputType === 'github' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>GitHub Repo</button>
      </div>

      {inputType === 'drop' ? (
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleFileDrop} className={`flex-grow flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-300 cursor-pointer ${isDragging ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 hover:border-purple-600'}`}>
          <UploadCloud className={`h-12 w-12 mb-4 transition-colors ${isDragging ? 'text-purple-400' : 'text-slate-500'}`} />
          <p className="text-slate-400 text-center font-semibold">Drag & drop a folder here</p>
        </div>
      ) : (
        <div className="flex-grow flex flex-col space-y-4 justify-center">
          <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="w-full bg-slate-900/80 text-slate-200 placeholder-slate-500 rounded-md px-4 py-3 border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"/>
          <button onClick={handleProcessGithub} disabled={!githubUrl} className="w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:bg-slate-700 disabled:cursor-not-allowed">
            <Github size={18}/> Process Repository
          </button>
        </div>
      )}
    </div>
  );
}
