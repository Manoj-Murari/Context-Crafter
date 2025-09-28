import { Copy, Check, ArrowUp, RefreshCw } from 'lucide-react';
// ✅ FIXED: Updated import path to the new types file and added Chunk/ContentPart
import type { ProcessedOutput, Chunk, ContentPart } from '../core/types';

interface SuccessScreenProps {
  processedData: ProcessedOutput;
  copiedStates: Record<string, boolean>;
  copiedChunks: boolean[];
  isRewindMode: boolean;
  nextChunkToCopyIndex: number;
  lastCopiedIndex: number;
  handleCopy: (textToCopy: string, key: string) => void;
  handleCopyFullPrompt: () => void;
  handleCopyNextChunk: () => void;
  handleCopyPreviousChunk: () => void;
  handleResetCopy: () => void;
  setIsRewindMode: (isRewind: boolean) => void;
  getChunkContent: (index: number) => string;
}

const CodeBlock = ({ content }: { content: string; }) => (<pre className="bg-slate-900/70 p-4 rounded-md overflow-x-auto text-sm text-slate-300 border border-slate-700"><code>{content}</code></pre>);

export function SuccessScreen({
  processedData,
  copiedStates,
  copiedChunks,
  isRewindMode,
  nextChunkToCopyIndex,
  lastCopiedIndex,
  handleCopy,
  handleCopyFullPrompt,
  handleCopyNextChunk,
  handleCopyPreviousChunk,
  handleResetCopy,
  setIsRewindMode,
}: SuccessScreenProps) {
  return (
    <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-4 animate-fade-in space-y-4">
      <div className='space-y-4'>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Your Prompt</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700">~{processedData.token_estimate} tokens</span>
              {!processedData.isChunked && (
                <button onClick={handleCopyFullPrompt} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-3 rounded-lg transition-all text-sm">
                  {copiedStates['fullPrompt'] ? <><Check size={16}/> Copied</> : <><Copy size={16} /> Copy</>}
                </button>
              )}
            </div>
        </div>

        {processedData.isChunked && (
          <div className="p-3 bg-slate-900/80 border border-purple-500/30 rounded-lg text-xs text-purple-200">
           This project has been split into {processedData.chunks.length} parts. Copy and paste each part in order.
          </div>
        )}

        {processedData.isChunked && (
          <div className="pt-2 text-center">
            <div className="flex items-center gap-2">
              <button onClick={isRewindMode ? handleCopyPreviousChunk : handleCopyNextChunk} disabled={!isRewindMode && nextChunkToCopyIndex === -1} className="flex-grow flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-purple-900/50 hover:shadow-purple-500/40 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none">
                  {isRewindMode ? (
                    <><ArrowUp size={18} /> Copy Previous Part ({lastCopiedIndex + 1}/{processedData.chunks.length})</>
                  ) : (
                    nextChunkToCopyIndex === -1 ? <><Check size={18}/> All Parts Copied</> : <> <Copy size={18} /> Copy Next Part ({nextChunkToCopyIndex + 1}/{processedData.chunks.length})</>
                  )}
              </button>
               <button
                onClick={handleResetCopy}
                className="flex-shrink-0 p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                title="Start copying from the beginning"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            {lastCopiedIndex >= 0 && !isRewindMode && (
                 <button onClick={() => setIsRewindMode(true)} className="text-xs text-slate-400 hover:text-white underline mt-2">
                   Copy previous part again?
                 </button>
            )}
          </div>
        )}

        {/* ✅ FIXED: Added explicit types for map callbacks */}
        {processedData.chunks.map((chunk: Chunk, chunkIndex: number) => (
          <div key={chunkIndex} className="space-y-2">
            {processedData.isChunked && (
               <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-slate-300">Part {chunkIndex + 1} of {processedData.chunks.length}</h3>
                 {copiedChunks[chunkIndex] && <span className="flex items-center gap-1 text-xs text-green-400"><Check size={14}/> Copied</span>}
               </div>
            )}
            <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-700 rounded-lg">
               {/* ✅ FIXED: Added explicit types for map callbacks */}
               {chunk.parts.map((part: ContentPart, partIndex: number) => {
                  const key = `chunk-${chunkIndex}-part-${partIndex}`;
                  return (
                    <div key={key}>
                      {part.type === 'markdown' && <div className="text-slate-300 text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: part.content.replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-purple-300 py-0.5 px-1 rounded-sm font-mono text-xs">$1</code>') }} />}
                      {part.type === 'code' && (
                        <div>
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-mono text-purple-300">{part.path}</span>
                            <button onClick={() => handleCopy(part.content, key)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                              {copiedStates[key] ? <><Check size={14} className="text-green-400"/> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                          </div>
                          <CodeBlock content={part.content} />
                        </div>
                      )}
                    </div>
                  )
               })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
