import { useState, useCallback } from 'react';
import { Upload, Wand2, Copy, Check, AlertCircle, BrainCircuit, Github, Computer, ArrowRight, UploadCloud, FolderSearch } from 'lucide-react';
import axios from 'axios';

// --- Helper component for loading skeleton ---
const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
    </div>
);

type InputType = 'dnd' | 'github' | 'path';
interface FilePayload { path: string; content: string; }

export default function App() {
    // --- STATE MANAGEMENT ---
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [errorMessage, setErrorMessage] = useState('');
    const [inputValue, setInputValue] = useState(''); // For GitHub URL or Local Path
    const [tokenEstimate, setTokenEstimate] = useState(0);
    const [inputType, setInputType] = useState<InputType>('dnd');
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // --- Chunking & Copying State ---
    const [isChunked, setIsChunked] = useState(false);
    const [chunks, setChunks] = useState<string[]>([]);
    const [copiedChunks, setCopiedChunks] = useState<boolean[]>([]);
    const [lastCopiedIndex, setLastCopiedIndex] = useState<number | null>(null);
    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
    const [isSmartMode] = useState(true);


    // --- File Processing Logic ---
    const processFiles = async (projectName: string, files: FilePayload[]) => {
        setStatus('loading');
        setLoadingMessage('Crafting your context...');
        setErrorMessage('');
        try {
            // UPDATED: Changed URL to be relative
            const response = await axios.post('/api/process-files', {
                projectName,
                files,
                mode: isSmartMode ? 'intelligent' : 'raw',
            });
            const data = response.data;
            if (data && data.chunks) {
                setTokenEstimate(data.token_estimate || 0);
                setIsChunked(data.isChunked);
                setChunks(data.chunks);
                setCopiedChunks(new Array(data.chunks.length).fill(false));
                setCurrentChunkIndex(0);
                setStatus('success');
            } else { throw new Error('Invalid response from engine.'); }
        } catch (error: any) {
            handleApiError(error);
        }
    };
    
    const processGithub = async () => {
        if (!inputValue) {
            setErrorMessage('Please paste a GitHub URL first!');
            setStatus('error');
            return;
        }
        setStatus('loading');
        setLoadingMessage('Cloning repository...');
        setErrorMessage('');
        try {
            // UPDATED: Changed URL to be relative
            const response = await axios.post('/api/process-github', {
                url: inputValue,
                mode: isSmartMode ? 'intelligent' : 'raw',
            });
             const data = response.data;
            if (data && data.chunks) {
                setTokenEstimate(data.token_estimate || 0);
                setIsChunked(data.isChunked);
                setChunks(data.chunks);
                setCopiedChunks(new Array(data.chunks.length).fill(false));
                setCurrentChunkIndex(0);
                setStatus('success');
            } else { throw new Error('Invalid response from engine.'); }
        } catch (error: any) {
            handleApiError(error);
        }
    }

    const processPath = async () => {
        if (!inputValue) {
            setErrorMessage('Please provide a local folder path!');
            setStatus('error');
            return;
        }
        setStatus('loading');
        setLoadingMessage('Scanning local folder...');
        setErrorMessage('');
        try {
            // UPDATED: Changed URL to be relative
            const response = await axios.post('/api/process-path', {
                path: inputValue,
                mode: isSmartMode ? 'intelligent' : 'raw',
            });
            const data = response.data;
            if (data && data.chunks) {
                setTokenEstimate(data.token_estimate || 0);
                setIsChunked(data.isChunked);
                setChunks(data.chunks);
                setCopiedChunks(new Array(data.chunks.length).fill(false));
                setCurrentChunkIndex(0);
                setStatus('success');
            } else { throw new Error('Invalid response from engine.'); }
        } catch (error: any) {
            handleApiError(error);
        }
    };

    const handleApiError = (error: any) => {
        console.error("API call error:", error);
        setStatus('error');
        if (error.response) {
            setErrorMessage(`Error from engine: ${error.response.data.detail || 'Something went wrong.'}`);
        } else if (error.request) {
            setErrorMessage('Could not talk to the engine. Is it running?');
        } else {
            setErrorMessage(`An unexpected error occurred: ${error.message}`);
        }
    };


    // --- Drag and Drop Handlers ---
    const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(false);
        if (status === 'loading' || inputType !== 'dnd') return;

        const items = event.dataTransfer.items;
        if (items && items.length > 0) {
            setStatus('loading');
            setLoadingMessage('Reading files...');
            const rootEntry = items[0].webkitGetAsEntry();
            if (rootEntry && rootEntry.isDirectory) {
                const files = await getFilesFromDirectory(rootEntry as FileSystemDirectoryEntry);
                await processFiles(rootEntry.name, files);
            } else {
                setErrorMessage('Please drop a folder, not a single file.');
                setStatus('error');
            }
        }
    }, [isSmartMode, status, inputType]);

    const getFilesFromDirectory = async (dirEntry: FileSystemDirectoryEntry): Promise<FilePayload[]> => {
        const reader = dirEntry.createReader();
        return new Promise((resolve, reject) => {
            reader.readEntries(async (entries) => {
                let files: FilePayload[] = [];
                for (const entry of entries) {
                    if (entry.isFile) {
                        try {
                            const file = await getFileFromFileEntry(entry as FileSystemFileEntry);
                            const content = await file.text();
                            files.push({ path: entry.fullPath.substring(1), content });
                        } catch (e) { console.warn(`Could not read file: ${entry.name}`, e); }
                    } else if (entry.isDirectory) {
                        files = files.concat(await getFilesFromDirectory(entry as FileSystemDirectoryEntry));
                    }
                }
                resolve(files);
            }, reject);
        });
    };

    const getFileFromFileEntry = (fileEntry: FileSystemFileEntry): Promise<File> => {
        return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {  
        e.preventDefault();  
        if (inputType === 'dnd') {
            setIsDraggingOver(true);  
        }
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {  
        e.preventDefault();  
        setIsDraggingOver(false);  
    };


    // --- Other Helpers ---
    const handleCopy = (textToCopy: string, index: number) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);

        if (!copiedChunks[index]) {
            const newCopiedChunks = [...copiedChunks];
            newCopiedChunks[index] = true;
            setCopiedChunks(newCopiedChunks);
            if (index === currentChunkIndex && index < chunks.length - 1) {
                setCurrentChunkIndex(index + 1);
            }
        }
        
        setLastCopiedIndex(index);
        setTimeout(() => {
            setLastCopiedIndex(prevIndex => (prevIndex === index ? null : prevIndex));
        }, 2000);
    };
    
    const handleCopyNext = () => {
        if (currentChunkIndex >= chunks.length) return;
        handleCopy(chunks[currentChunkIndex], currentChunkIndex);
    };
    
    const handleReset = () => {
        setStatus('idle');
        setChunks([]);
        setIsChunked(false);
        setTokenEstimate(0);
        setErrorMessage('');
        setInputValue('');
        setCurrentChunkIndex(0);
        setLastCopiedIndex(null);
    };

    const handleInputTypeChange = (newType: InputType) => {
        if (status === 'loading') return;
        setInputType(newType);
        handleReset();
    };

    // --- UI ---
    return (
        <div  
            className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <div className={`absolute inset-0 bg-purple-500/20 z-50 transition-opacity duration-300 pointer-events-none ${isDraggingOver ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex justify-center items-center h-full">
                    <div className="text-center p-8 border-4 border-dashed border-white rounded-2xl">
                        <UploadCloud size={64} className="mx-auto text-white mb-4" />
                        <h2 className="text-2xl font-bold text-white">Drop your project folder here</h2>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-[800px] h-[800px] bg-purple-900/40 blur-[150px] rounded-full z-0"></div>
            <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[800px] h-[800px] bg-sky-900/40 blur-[150px] rounded-full z-0"></div>

            <div className="z-10 w-full max-w-4xl mx-auto flex flex-col flex-grow">
                <header className="w-full mx-auto mb-6 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center justify-center gap-3"><Wand2 size={36} className="text-purple-400" />Context Crafter</h1>
                    <p className="text-gray-400 mt-2">The intelligent way to package your projects for any LLM.</p>
                </header>

                <div className="w-full mx-auto mb-6">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                        <button onClick={() => handleInputTypeChange('dnd')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputType === 'dnd' ? 'bg-purple-600 text-white' : 'bg-gray-800/60 hover:bg-gray-700/80 text-gray-300'}`}><Computer size={18} /> Drag & Drop Folder</button>
                        <button onClick={() => handleInputTypeChange('github')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputType === 'github' ? 'bg-purple-600 text-white' : 'bg-gray-800/60 hover:bg-gray-700/80 text-gray-300'}`}><Github size={18} /> GitHub Repo</button>
                        <button onClick={() => handleInputTypeChange('path')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputType === 'path' ? 'bg-purple-600 text-white' : 'bg-gray-800/60 hover:bg-gray-700/80 text-gray-300'}`}><FolderSearch size={18} /> Local Path</button>
                    </div>

                    {inputType === 'path' && (
                        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center">
                            <FolderSearch className="text-purple-400 h-6 w-6 hidden sm:block" />
                            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder='Paste absolute path to local project folder...' className="w-full bg-gray-900 rounded-md px-4 py-3 border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition" disabled={status === 'loading'} />
                            {status === 'idle' || status === 'error' ? (
                                <button onClick={processPath} className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all whitespace-nowrap"><Upload size={20} /> Process Path</button>
                            ) : (
                                <button onClick={handleReset} className="w-full sm:w-auto flex-shrink-0 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all whitespace-nowrap">Start Over</button>
                            )}
                        </div>
                    )}
                    
                    {inputType === 'github' && (
                        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center">
                            <Github className="text-purple-400 h-6 w-6 hidden sm:block" />
                            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder='Paste GitHub repository URL...' className="w-full bg-gray-900 rounded-md px-4 py-3 border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition" disabled={status === 'loading'} />
                            {status === 'idle' || status === 'error' ? (
                                <button onClick={processGithub} className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all whitespace-nowrap"><Upload size={20} /> Process Repo</button>
                            ) : (
                                <button onClick={handleReset} className="w-full sm:w-auto flex-shrink-0 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all whitespace-nowrap">Start Over</button>
                            )}
                        </div>
                    )}
                    
                    {inputType === 'dnd' && (status === 'idle' || status === 'error') && (
                        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-8 flex flex-col gap-4 items-center text-center text-gray-500">
                            <UploadCloud size={48} className="mb-2 text-gray-600" />
                            <h3 className="font-semibold text-lg text-gray-400">Drag & Drop a Project Folder</h3>
                            <p>Or select a different input method above.</p>
                        </div>
                    )}
                    {status === 'error' && <p className="text-red-400 mt-2 ml-2 flex items-center gap-2"><AlertCircle size={16} /> {errorMessage}</p>}
                    {status === 'loading' && <p className="text-purple-300 mt-2 ml-2 animate-pulse">{loadingMessage}</p>}
                </div>

                <main className="flex-grow w-full mx-auto grid grid-cols-1 gap-6">
                    <div className={`bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-5 flex flex-col min-h-[500px] ${status === 'idle' && inputType === 'dnd' ? 'hidden' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Master Prompt</h2>
                             {status === 'success' && (
                                <div className='text-right'>
                                    {isChunked && <p className='text-sm font-semibold'>{`Part ${Math.min(currentChunkIndex + 1, chunks.length)} of ${chunks.length}`}</p>}
                                    <p className='text-xs text-gray-500'>Token Estimate: ~{tokenEstimate} tokens</p>
                                </div>
                             )}
                        </div>
                        <div className="flex-grow bg-gray-900/80 rounded-md overflow-auto text-sm border border-gray-700 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-purple-500 relative">
                           {status === 'success' && ( isChunked ? (
                                <div className='p-4 space-y-4'>
                                    {chunks.map((chunk, index) => (
                                        <div key={index} className={`p-3 rounded-lg transition-all ${copiedChunks[index] ? 'bg-green-900/50 border-green-700/60' : 'bg-gray-800/50 border-gray-700/60'} border`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-bold text-gray-300">Part {index + 1} of {chunks.length}</p>
                                                <button onClick={() => handleCopy(chunk, index)} className={`flex items-center gap-2 text-xs font-semibold py-1 px-3 rounded-md transition-all ${lastCopiedIndex === index ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
                                                    {lastCopiedIndex === index ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy Part {index + 1}</>}
                                                </button>
                                            </div>
                                            <pre className="whitespace-pre-wrap break-words text-gray-400 text-xs">{chunk.substring(0, 200)}...</pre>
                                        </div> ))}
                                </div>
                            ) : ( <pre className="whitespace-pre-wrap break-words p-4">{chunks[0]}</pre> ))}
                           {status === 'loading' && <div className='p-4'><SkeletonLoader /></div>}
                           {(status === 'idle' || status === 'error') && (
                                <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                                    <BrainCircuit size={48} className="mb-4 text-gray-600" />
                                    <h3 className="font-semibold text-lg text-gray-400">Ready to build</h3>
                                    <p>Your AI-ready prompt will appear here.</p>
                                </div>
                           )}
                        </div>
                         {status === 'success' && ( isChunked ? (
                            <div className="mt-4">
                               <button onClick={handleCopyNext} disabled={currentChunkIndex >= chunks.length} className="w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all">
                                   {currentChunkIndex >= chunks.length ? 'All Parts Copied!' : `Copy Next Part (${currentChunkIndex + 1}/${chunks.length})`}
                                   {currentChunkIndex < chunks.length && <ArrowRight size={20} />}
                               </button>
                            </div>
                         ) : (
                             <div className="mt-4">
                               <button onClick={() => handleCopy(chunks[0], 0)} className="w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all">
                                   {lastCopiedIndex === 0 ? <><Check size={20}/> Copied!</> : 'Copy Full Prompt'}
                               </button>
                            </div>
                         ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
