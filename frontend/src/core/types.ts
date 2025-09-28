// --- Type Definitions ---
export interface FilePayload {
  path: string;
  content: string;
}

export interface ContentPart {
  type: 'markdown' | 'code';
  content: string;
  language?: string;
  path?: string;
}

export interface Chunk {
  parts: ContentPart[];
}

export interface ProcessedOutput {
  tree: string;
  chunks: Chunk[];
  isChunked: boolean;
  token_estimate: number;
}
