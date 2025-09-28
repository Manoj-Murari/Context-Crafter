import { useState, useCallback, useEffect, useRef } from 'react';
import { Wand2, AlertCircle, Settings, LoaderCircle } from 'lucide-react';
// ⛔️ REMOVED: No longer importing the synchronous engine
// ✅ ADDED: Importing types from their new dedicated file
import type { FilePayload, ProcessedOutput } from './core/types';
import { SettingsModal } from './components/SettingsModal';
import { IdleScreen } from './components/IdleScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { IgnoreWizardModal } from './components/IgnoreWizardModal';

// --- Main App Component ---
export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressMessage, setProgressMessage] = useState('Processing project...');
  const [inputType, setInputType] = useState<'drop' | 'github'>('drop');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSmartMode, setIsSmartMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customIgnorePatterns, setCustomIgnorePatterns] = useState('');
  const [processedData, setProcessedData] = useState<ProcessedOutput | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [copiedChunks, setCopiedChunks] = useState<boolean[]>([]);
  const [isRewindMode, setIsRewindMode] = useState(false);
  const [isIgnoreWizardOpen, setIsIgnoreWizardOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FilePayload[]>([]);
  const [pendingProjectName, setPendingProjectName] = useState('');
  const nextChunkToCopyIndex = processedData ? copiedChunks.findIndex(copied => !copied) : -1;
  const lastCopiedIndex = (nextChunkToCopyIndex === -1 ? copiedChunks.length : nextChunkToCopyIndex) - 1;

  // ✅ ADD a ref to hold our worker instance
  const workerRef = useRef<Worker | null>(null);

  // This hook loads our saved progress when the app opens!
  useEffect(() => {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['sessionData'], (result) => {
        if (result.sessionData) {
          console.log('[App] Found saved session, restoring...');
          setProcessedData(result.sessionData.processedData);
          setCopiedChunks(result.sessionData.copiedChunks);
          setStatus('success');
        }
      });
    }
  }, []);

  // ✅ ADD useEffect to initialize and terminate the worker
  useEffect(() => {
    // Create a new worker
    workerRef.current = new Worker('/worker.js');

    // Listen for messages from the worker
    workerRef.current.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SUCCESS') {
            console.log('[App] Worker finished successfully.');
            const newCopiedChunks = new Array(payload.chunks.length).fill(false);
            setProcessedData(payload);
            setCopiedChunks(newCopiedChunks);
            setStatus('success');
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ sessionData: { processedData: payload, copiedChunks: newCopiedChunks } });
            }
        } else if (type === 'ERROR') {
            console.error('[App] Worker encountered an error:', payload);
            handleApiError(new Error(payload.message));
        } else if (type === 'PROGRESS') {
            // This gives the user live feedback!
            setProgressMessage(payload);
        }
    };

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
        workerRef.current?.terminate();
    };
}, []); // The empty dependency array ensures this runs only once

  const copyToClipboard = (text: string) => {
    const ta = document.createElement('textarea');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.value = text;
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(ta);
  };

  const handleApiError = (error: any) => {
    console.error("[App] An error occurred:", error);
    setStatus('error');
    setErrorMessage(error.message || "An unexpected error occurred. Check the extension console for details.");
  };

  // ✅ REFACTORED: This function now sends the job to the worker instead of running it directly.
  const runProjectProcessing = (files: FilePayload[], projectName: string) => {
    console.log(`[App] Handing off ${files.length} files to worker for project: ${projectName}`);
    if (files.length === 0) {
        handleApiError(new Error("The selected folder is empty or no readable files were found after filtering."));
        return;
    }

    // If smart mode is enabled, show the ignore wizard first
    if (isSmartMode) {
      setPendingFiles(files);
      setPendingProjectName(projectName);
      // Keep loading state active while wizard is open
      setProgressMessage('Analyzing project structure...');
      setIsIgnoreWizardOpen(true);
      return;
    }

    // Otherwise, proceed with the original workflow
    setStatus('loading');
    setProgressMessage('Processing project...');
    processWithIgnorePatterns(files, projectName, customIgnorePatterns);
  };

  const processWithIgnorePatterns = (files: FilePayload[], projectName: string, ignorePatterns: string) => {
    const gitignoreFile = files.find(file => file.path.endsWith('.gitignore'));
    const gitignoreContent = gitignoreFile ? gitignoreFile.content : '';

    // Parse ignore patterns properly - filter out comments and empty lines
    const parsedIgnorePatterns = ignorePatterns
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));

    console.log(`[App] Processing with ${parsedIgnorePatterns.length} ignore patterns:`, parsedIgnorePatterns);

    // Post the job to the worker
    workerRef.current?.postMessage({
        files,
        projectName,
        customIgnorePatterns: parsedIgnorePatterns,
        gitignoreContent
    });
  };

  const handleApplyIgnoreList = (ignoreList: string) => {
    if (pendingFiles.length > 0 && pendingProjectName) {
      setStatus('loading');
      setProgressMessage('Processing project with custom ignore list...');
      processWithIgnorePatterns(pendingFiles, pendingProjectName, ignoreList);
    }
  };

  const handleCancelIgnoreWizard = () => {
    // Reset the app state when wizard is cancelled
    setStatus('idle');
    setPendingFiles([]);
    setPendingProjectName('');
    setIsIgnoreWizardOpen(false);
    setErrorMessage('');
    setProgressMessage('Processing project...');
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setStatus('loading');
    setProgressMessage('Reading dropped folder...');
    setErrorMessage('');
    setProcessedData(null);
    console.log('[App] File drop detected.');

    try {
        const items = e.dataTransfer.items;
        if (!items || items.length === 0) throw new Error('No folder was dropped.');

        const rootEntry = items[0].webkitGetAsEntry();
        if (!rootEntry || !rootEntry.isDirectory) throw new Error("Please drop a single folder, not files.");

        const projectName = rootEntry.name;
        console.log(`[App] Dropped folder: ${projectName}`);

        const getAllFileEntries = async (dataTransferItemList: DataTransferItemList) => {
            const fileEntries: FileSystemFileEntry[] = [];
            const queue: FileSystemEntry[] = [];

            for (let i = 0; i < dataTransferItemList.length; i++) {
                const entry = dataTransferItemList[i].webkitGetAsEntry();
                if(entry) queue.push(entry);
            }

            let filesProcessed = 0;
            while (queue.length > 0) {
                const entry = queue.shift();
                if (entry?.isFile) {
                    fileEntries.push(entry as FileSystemFileEntry);
                } else if (entry?.isDirectory) {
                    const reader = (entry as FileSystemDirectoryEntry).createReader();
                    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                        reader.readEntries(resolve);
                    });
                    queue.push(...entries);
                }
                filesProcessed++;
                if (filesProcessed % 20 === 0) {
                    setProgressMessage(`Finding files... (${filesProcessed})`);
                }
            }
            return fileEntries;
        };

        const fileEntries = await getAllFileEntries(items);
        console.log(`[App] Found ${fileEntries.length} total file entries.`);
        setProgressMessage(`Found ${fileEntries.length} files. Reading contents...`);

        const filePromises = fileEntries.map(entry => 
            new Promise<FilePayload>((resolve, reject) => {
                entry.file(
                    file => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const path = entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath;
                            // For simplicity in this non-binary context, we assume text files.
                            // A more robust solution would check file type before reading as text.
                            if (typeof reader.result === 'string') {
                                resolve({ path, content: reader.result });
                            } else {
                                // Resolve with empty content for non-text files to avoid errors
                                resolve({ path, content: '' });
                            }
                        };
                        reader.onerror = () => reject(new Error(`Failed to read file: ${entry.fullPath}`));
                        // A small check to avoid trying to read huge files as text
                        if (file.size < 20 * 1024 * 1024) { // 20MB limit for reading as text
                            reader.readAsText(file);
                        } else {
                            console.warn(`[App] Skipping large file (>${file.size} bytes): ${entry.fullPath}`);
                            resolve({ path: entry.fullPath.substring(1), content: '' });
                        }
                    },
                    err => reject(err)
                );
            })
        );

        const results = await Promise.allSettled(filePromises);
        
        const successfulFiles: FilePayload[] = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.content) { // Only include files with content
                successfulFiles.push(result.value);
            } else if (result.status === 'rejected') {
                console.warn('[App] Skipped a file due to read error:', result.reason);
            }
        });
        
        console.log(`[App] Successfully read ${successfulFiles.length} files.`);
        if (successfulFiles.length > 0) {
          runProjectProcessing(successfulFiles, projectName);
        } else {
          throw new Error("No readable text files were found in the dropped folder.");
        }

    } catch(error) {
        handleApiError(error);
    }
  }, [customIgnorePatterns]);
  
  const handleProcessGithub = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    setProcessedData(null);
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
        handleApiError(new Error("Invalid GitHub URL format. Use 'github.com/owner/repo'."));
        return;
    }
    const [_, owner, repo] = match;
    console.log(`[App] Processing GitHub repo: ${owner}/${repo}`);

    try {
      setProgressMessage('Fetching repository details...');
      const repoDataRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoDataRes.ok) throw new Error(`Could not fetch repo data. Status: ${repoDataRes.status}`);
      const repoData = await repoDataRes.json();

      const defaultBranch = repoData.default_branch;
      setProgressMessage('Reading file structure...');
      const treeDataRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
      if (!treeDataRes.ok) throw new Error(`Could not fetch repo tree. Status: ${treeDataRes.status}`);
      const treeData = await treeDataRes.json();
      
      const filesToFetch = treeData.tree.filter((node: any) => node.type === 'blob');

      if (treeData.truncated) {
          handleApiError(new Error(`This repository is too large and the file list is incomplete. Please download it and use the drag-and-drop method.`));
          return;
      }
      
      // Increased limit, as API fetching is lighter than local reading, but still a safeguard.
      const GITHUB_FILE_LIMIT = 1000;
      if (filesToFetch.length > GITHUB_FILE_LIMIT) {
        handleApiError(new Error(`This repository has too many files (${filesToFetch.length}) to process via the API. Please use the drag-and-drop method.`));
        return;
      }
      
      setProgressMessage(`Fetching content for ${filesToFetch.length} files...`);

      const filePayloads = await Promise.all(
        filesToFetch.map(async (node: any) => {
          const path = node.path;
          try {
            const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
            if (!res.ok) return null;
            const content = await res.text();
            return { path, content };
          } catch (e) {
            console.warn(`[App] Failed to fetch file: ${path}`, e);
            return null;
          }
        })
      );
      
      const successfulFiles = filePayloads.filter(Boolean) as FilePayload[];
      if (successfulFiles.length > 0) {
        runProjectProcessing(successfulFiles, repo);
      } else {
        throw new Error("Could not fetch any files from the repository.");
      }

    } catch (error: any) {
      handleApiError(error);
    }
  }, [githubUrl, customIgnorePatterns]);


  const handleReset = () => {
    setStatus('idle');
    setProcessedData(null);
    setErrorMessage('');
    setGithubUrl('');
    setCopiedChunks([]);
    setCopiedStates({});
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove('sessionData');
    }
  };

  const handleCopy = (textToCopy: string, key: string) => {
    if(!textToCopy) return;
    copyToClipboard(textToCopy);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
  };

  const handleCopyFullPrompt = () => {
    if (!processedData || processedData.isChunked) return;
    const fullPromptContent = processedData.chunks[0].parts.map(p => {
        if (p.type === 'code') {
            return `---
### \`${p.path}\`

\`\`\`${p.language || ''}
${p.content}
\`\`\``;
        }
        return p.content;
    }).join('\n');
    handleCopy(fullPromptContent, 'fullPrompt');
  };

  const getChunkContent = (index: number): string => {
    if (!processedData || !processedData.chunks[index]) return '';
    return processedData.chunks[index].parts.map(p => {
        if (p.type === 'code') {
            return `---
### \`${p.path}\`

\`\`\`${p.language || ''}
${p.content}
\`\`\``;
        }
        return p.content;
    }).join('\n');
  }

  const handleCopyNextChunk = () => {
    if (nextChunkToCopyIndex === -1) return;
    copyToClipboard(getChunkContent(nextChunkToCopyIndex));
    const newCopied = [...copiedChunks];
    newCopied[nextChunkToCopyIndex] = true;
    setCopiedChunks(newCopied);
    setIsRewindMode(false);
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ sessionData: { processedData, copiedChunks: newCopied }});
    }
  };

  const handleCopyPreviousChunk = () => {
    if (lastCopiedIndex < 0) return;
    copyToClipboard(getChunkContent(lastCopiedIndex));
    setIsRewindMode(false);
  };
  
  const handleResetCopy = () => {
    if (!processedData) return;
    const newCopied = new Array(processedData.chunks.length).fill(false);
    setCopiedChunks(newCopied);
    setIsRewindMode(false);
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ sessionData: { processedData, copiedChunks: newCopied }});
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
            <LoaderCircle size={40} className="text-purple-400 animate-spin mb-4"/>
            <p className="font-semibold text-slate-300">{progressMessage}</p> 
            <p className="text-sm text-slate-400">Please wait while we craft your context.</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle size={40} className="text-red-500 mb-4"/>
            <p className="font-semibold text-red-400">An Error Occurred</p>
            <p className="text-sm text-slate-400 mb-4">{errorMessage}</p>
            <button onClick={handleReset} className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-5 rounded-lg transition-all">Try Again</button>
          </div>
        );
      case 'success':
        if (processedData) {
          return (
            <SuccessScreen
              processedData={processedData}
              copiedStates={copiedStates}
              copiedChunks={copiedChunks}
              isRewindMode={isRewindMode}
              nextChunkToCopyIndex={nextChunkToCopyIndex}
              lastCopiedIndex={lastCopiedIndex}
              handleCopy={handleCopy}
              handleCopyFullPrompt={handleCopyFullPrompt}
              handleCopyNextChunk={handleCopyNextChunk}
              handleCopyPreviousChunk={handleCopyPreviousChunk}
              handleResetCopy={handleResetCopy}
              setIsRewindMode={setIsRewindMode}
              getChunkContent={getChunkContent}
            />
          );
        }
        return null;
      case 'idle':
      default:
        return (
          <IdleScreen
            inputType={inputType}
            setInputType={setInputType}
            githubUrl={githubUrl}
            setGithubUrl={setGithubUrl}
            handleProcessGithub={handleProcessGithub}
            handleFileDrop={handleFileDrop}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            isSmartMode={isSmartMode}
          />
        );
    }
  };

  return (
    <div className="w-full h-screen bg-[#0A0F19] text-slate-200 font-sans flex flex-col p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/40 blur-[100px] rounded-full z-0 opacity-60"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-sky-900/40 blur-[100px] rounded-full z-0 opacity-60"></div>
      <div className="z-10 w-full h-full mx-auto flex flex-col">
        <header className="w-full text-center mb-4"><h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><Wand2 size={24} className="text-purple-400" /> Context Crafter</h1></header>
        <div className="flex-grow flex flex-col space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
          {renderContent()}
        </div>
        <footer className="flex-shrink-0 pt-3 flex justify-between items-center">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:text-white transition-colors"><Settings size={18} /></button>
            {status !== 'idle' && <button onClick={handleReset} className="text-slate-500 hover:text-white font-semibold text-sm transition-colors">Start Over</button>}
        </footer>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customIgnorePatterns={customIgnorePatterns}
        setCustomIgnorePatterns={setCustomIgnorePatterns}
        isSmartMode={isSmartMode}
        setIsSmartMode={setIsSmartMode}
      />

      <IgnoreWizardModal
        isOpen={isIgnoreWizardOpen}
        onClose={handleCancelIgnoreWizard}
        files={pendingFiles}
        projectName={pendingProjectName}
        onApplyIgnoreList={handleApplyIgnoreList}
      />
    </div>
  );
}
