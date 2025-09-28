// --- Configuration ---
const DEFAULT_IGNORE_PATTERNS = new Set([
  // Version Control & Environment
  ".git/", ".svn/", ".hg/", ".env",

  // IDE & Editor Config
  ".vscode/", ".idea/",

  // Dependency & Package Manager
  "node_modules/", "vendor/", "Pods/", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",

  // Python Specific
  "venv/", ".venv/", "__pycache__/", "*.pyc", "*.pyo", "*.pyd",

  // Build & Distribution Artifacts
  "build/", "dist/", "target/", "out/",

  // OS Specific
  ".DS_Store", "Thumbs.db",

  // Logs & Temp files
  "*.log",

  // Boilerplate Configs
  "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json",
  "vite-env.d.ts", "eslint.config.js", "postcss.config.js",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".pdf", ".zip",
  ".tar.gz", ".rar", ".7z", ".mp3", ".mp4", ".mov", ".avi", ".woff", ".woff2",
  ".eot", ".ttf", ".otf", ".exe", ".dll", ".so", ".a", ".lib", ".dmg", ".app"
]);

// --- Core Engine Logic ---
// ✅ FIXED: A much more robust and accurate implementation of the ignore logic.
function isIgnored(path, allIgnorePatterns) {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];

    for (const pattern of allIgnorePatterns) {
        let isDirOnly = pattern.endsWith('/');
        let cleanPattern = isDirOnly ? pattern.slice(0, -1) : pattern;

        // This handles patterns like "node_modules/" or "build/"
        if (isDirOnly) {
            if (parts.some(part => part === cleanPattern)) {
                return true;
            }
            continue;
        }

        // This handles wildcard patterns like "*.log" or "package-lock.json"
        if (cleanPattern.includes('*')) {
            const regex = new RegExp('^' + cleanPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
            if (regex.test(filename)) { // Test against file/folder name
                return true;
            }
             if (regex.test(path)) { // Test against full path for "**" patterns
                return true;
            }
        } else {
            // This handles exact name matches like ".DS_Store" or "pnpm-lock.yaml"
            if (filename === cleanPattern) {
                return true;
            }
            // Also handles cases where an exact folder name is given without a trailing slash
            if (parts.some(part => part === cleanPattern)) {
                return true;
            }
        }
    }

    // Check for binary file extensions
    const extension = path.includes('.') ? '.' + path.split('.').pop() : '';
    if (BINARY_EXTENSIONS.has(extension)) {
      return true;
    }

    return false;
}

function getLanguage(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    const map = {
        'js': 'javascript', 'ts': 'typescript', 'jsx': 'jsx', 'tsx': 'tsx', 'py': 'python',
        'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown', 'sh': 'bash', 'yml': 'yaml'
    };
    return map[extension || ''] || 'plaintext';
}

function processProject(files, projectName, customIgnorePatterns, gitignoreContent = '') {
    const allIgnorePatterns = [
      ...DEFAULT_IGNORE_PATTERNS,
      ...customIgnorePatterns,
      ...(gitignoreContent.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('#')))
    ];

    self.postMessage({ type: 'PROGRESS', payload: 'Filtering project files...' });
    
    console.log(`[Worker] Starting processing for: ${projectName}`);
    const treeLines = [];
    const filteredFiles = files.filter(file => !isIgnored(file.path, allIgnorePatterns));
    console.log(`[Worker] Found ${files.length} total files, ${filteredFiles.length} files after filtering.`);
    filteredFiles.sort((a, b) => a.path.localeCompare(b.path));

    self.postMessage({ type: 'PROGRESS', payload: 'Building project tree...' });

    const tree = new Map();
    filteredFiles.forEach(file => {
        const parts = file.path.split('/');
        let currentLevel = tree;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                currentLevel.set(part, null);
            } else {
                if (!currentLevel.has(part)) currentLevel.set(part, new Map());
                currentLevel = currentLevel.get(part);
            }
        });
    });

    function buildTree(node, prefix = "") {
        const entries = Array.from(node.keys()).sort();
        entries.forEach((key, index) => {
            const isLast = index === entries.length - 1;
            const connector = isLast ? "└── " : "├── ";
            const newPrefix = prefix + (isLast ? "    " : "│   ");
            const value = node.get(key);
            if (value === null) {
                treeLines.push(prefix + connector + key);
            } else {
                treeLines.push(prefix + connector + key + "/");
                buildTree(value, newPrefix);
            }
        });
    }

    treeLines.push(projectName);
    buildTree(tree);
    const treeString = treeLines.join('\n');

    self.postMessage({ type: 'PROGRESS', payload: 'Formatting final output...' });

    let totalContentChars = 0;
    const contentParts = [
        { type: 'markdown', content: `# Project Context: ${projectName}\n\nThis context was generated by Context Crafter. Below is the project structure followed by the contents of each file.` },
        { type: 'code', language: 'plaintext', content: treeString, path: 'Project Structure' }
    ];

    for (const file of filteredFiles) {
        contentParts.push({ type: 'code', content: file.content, language: getLanguage(file.path), path: file.path });
        totalContentChars += file.content.length;
    }

    const tokenEstimate = Math.ceil((treeString.length + totalContentChars) / 4);
    const TOKEN_LIMIT_PER_CHUNK = 15000 * 4;
    let chunks = [];
    let isChunked = tokenEstimate * 4 > TOKEN_LIMIT_PER_CHUNK;

    if (isChunked) {
        console.log(`[Worker] Project is large (${tokenEstimate} tokens), chunking...`);
        self.postMessage({ type: 'PROGRESS', payload: `Project is large, splitting into chunks...` });
        let currentChunk = { parts: [] };
        let currentChunkSize = 0;

        const addIntro = (partNum, totalParts) => {
          const introContent = `I am providing the context for a project named '${projectName}'. I will send it in ${totalParts} parts. Acknowledge each part by saying 'RECEIVED PART ${partNum} of ${totalParts}' and wait for the final part before summarizing.\n\nHere is Part ${partNum}:\n\n`;
          const introPart = { type: 'markdown', content: introContent };
          currentChunk.parts.push(introPart);
          currentChunkSize += introContent.length;
        };

        addIntro(1, 'multiple');

        for (const part of contentParts) {
            const partSize = part.content.length + (part.path?.length || 0) + 50;
            if (currentChunkSize + partSize > TOKEN_LIMIT_PER_CHUNK && currentChunk.parts.length > 1) {
                chunks.push(currentChunk);
                currentChunk = { parts: [] };
                currentChunkSize = 0;
                addIntro(chunks.length + 1, 'multiple');
            }
            currentChunk.parts.push(part);
            currentChunkSize += partSize;
        }
        chunks.push(currentChunk);

        chunks.forEach((chunk, index) => {
            if (chunk.parts[0]?.type === 'markdown') {
              chunk.parts[0].content = chunk.parts[0].content.replace('multiple parts', `${chunks.length} parts`).replace(/PART \d+ of multiple/, `PART ${index + 1} of ${chunks.length}`);
            }
        });

        const finalPart = { type: 'markdown', content: `\n\nALL CONTEXT PROVIDED. Please confirm you have received all ${chunks.length} parts and are ready for my questions.` };
        chunks[chunks.length - 1].parts.push(finalPart);

    } else {
        console.log(`[Worker] Project is small enough (${tokenEstimate} tokens), not chunking.`);
        chunks.push({ parts: contentParts });
    }

    console.log("[Worker] Processing complete.");
    return { tree: treeString, chunks, isChunked, token_estimate: tokenEstimate };
}


// Listen for messages from the main app
self.onmessage = (event) => {
  const { files, projectName, customIgnorePatterns, gitignoreContent } = event.data;
  
  try {
    const output = processProject(files, projectName, customIgnorePatterns, gitignoreContent);
    // Send the final result back to the main app
    self.postMessage({ type: 'SUCCESS', payload: output });
  } catch (error) {
    // Send an error message back to the main app
    self.postMessage({ type: 'ERROR', payload: { message: error.message } });
  }
};

