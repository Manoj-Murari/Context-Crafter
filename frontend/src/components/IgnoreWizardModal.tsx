import { useState, useEffect } from 'react';
import { X, Copy, Check, ArrowRight, ArrowLeft, Wand2, FileText } from 'lucide-react';
import type { FilePayload } from '../core/types';

interface IgnoreWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FilePayload[];
  projectName: string;
  onApplyIgnoreList: (ignoreList: string) => void;
}

interface TechStack {
  primaryLanguage: string;
  frameworks: string[];
  buildTools: string[];
  packageManagers: string[];
}

export function IgnoreWizardModal({
  isOpen,
  onClose,
  files,
  projectName,
  onApplyIgnoreList
}: IgnoreWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [techStack, setTechStack] = useState<TechStack | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [ignoreList, setIgnoreList] = useState('');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Detect tech stack when modal opens
  useEffect(() => {
    if (isOpen && files.length > 0) {
      const detected = detectTechStack(files);
      setTechStack(detected);
      generatePrompt(detected);
    }
  }, [isOpen, files]);

  const detectTechStack = (files: FilePayload[]): TechStack => {
    const fileExtensions = new Set(files.map(f => f.path.split('.').pop()?.toLowerCase()).filter(Boolean));
    const fileNames = new Set(files.map(f => f.path.split('/').pop()?.toLowerCase()).filter(Boolean));
    
    const techStack: TechStack = {
      primaryLanguage: 'Unknown',
      frameworks: [],
      buildTools: [],
      packageManagers: []
    };

    // Detect primary language
    if (fileExtensions.has('js') || fileExtensions.has('ts') || fileExtensions.has('jsx') || fileExtensions.has('tsx')) {
      techStack.primaryLanguage = 'JavaScript/TypeScript';
    } else if (fileExtensions.has('py')) {
      techStack.primaryLanguage = 'Python';
    } else if (fileExtensions.has('java')) {
      techStack.primaryLanguage = 'Java';
    } else if (fileExtensions.has('cs')) {
      techStack.primaryLanguage = 'C#';
    } else if (fileExtensions.has('go')) {
      techStack.primaryLanguage = 'Go';
    } else if (fileExtensions.has('rs')) {
      techStack.primaryLanguage = 'Rust';
    } else if (fileExtensions.has('php')) {
      techStack.primaryLanguage = 'PHP';
    }

    // Detect frameworks and libraries
    if (fileNames.has('package.json')) {
      techStack.packageManagers.push('npm/yarn/pnpm');
      
      // Try to detect frameworks from package.json content
      const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
      if (packageJsonFile) {
        try {
          const packageJson = JSON.parse(packageJsonFile.content);
          const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          if (dependencies.react) techStack.frameworks.push('React');
          if (dependencies.vue) techStack.frameworks.push('Vue');
          if (dependencies.angular) techStack.frameworks.push('Angular');
          if (dependencies.next) techStack.frameworks.push('Next.js');
          if (dependencies.nuxt) techStack.frameworks.push('Nuxt.js');
          if (dependencies.svelte) techStack.frameworks.push('Svelte');
          if (dependencies.express) techStack.frameworks.push('Express');
          if (dependencies.fastify) techStack.frameworks.push('Fastify');
          if (dependencies.nestjs) techStack.frameworks.push('NestJS');
          if (dependencies.vite) techStack.buildTools.push('Vite');
          if (dependencies.webpack) techStack.buildTools.push('Webpack');
          if (dependencies.rollup) techStack.buildTools.push('Rollup');
        } catch (e) {
          console.warn('Could not parse package.json');
        }
      }
    }

    if (fileNames.has('requirements.txt') || fileNames.has('pyproject.toml') || fileNames.has('setup.py')) {
      techStack.packageManagers.push('pip/poetry');
      
      // Detect Python frameworks
      const requirementsFile = files.find(f => f.path.endsWith('requirements.txt'));
      if (requirementsFile) {
        const content = requirementsFile.content.toLowerCase();
        if (content.includes('django')) techStack.frameworks.push('Django');
        if (content.includes('flask')) techStack.frameworks.push('Flask');
        if (content.includes('fastapi')) techStack.frameworks.push('FastAPI');
        if (content.includes('pytest')) techStack.buildTools.push('pytest');
      }
    }

    if (fileNames.has('pom.xml') || fileNames.has('build.gradle')) {
      techStack.packageManagers.push('Maven/Gradle');
      
      // Detect Java frameworks
      const pomFile = files.find(f => f.path.endsWith('pom.xml'));
      if (pomFile) {
        const content = pomFile.content.toLowerCase();
        if (content.includes('spring-boot')) techStack.frameworks.push('Spring Boot');
        if (content.includes('spring-framework')) techStack.frameworks.push('Spring');
      }
    }

    if (fileNames.has('cargo.toml')) {
      techStack.packageManagers.push('Cargo');
    }

    if (fileNames.has('composer.json')) {
      techStack.packageManagers.push('Composer');
      
      // Detect PHP frameworks
      const composerFile = files.find(f => f.path.endsWith('composer.json'));
      if (composerFile) {
        try {
          const composerJson = JSON.parse(composerFile.content);
          const dependencies = { ...composerJson.require, ...composerJson['require-dev'] };
          
          if (dependencies['laravel/framework']) techStack.frameworks.push('Laravel');
          if (dependencies['symfony/symfony']) techStack.frameworks.push('Symfony');
          if (dependencies['codeigniter/framework']) techStack.frameworks.push('CodeIgniter');
        } catch (e) {
          console.warn('Could not parse composer.json');
        }
      }
    }

    return techStack;
  };

  const generatePrompt = (techStack: TechStack) => {
    const frameworksText = techStack.frameworks.length > 0 
      ? ` that appears to be using the ${techStack.frameworks.join(', ')} framework(s)`
      : '';
    
    const buildToolsText = techStack.buildTools.length > 0 
      ? ` and ${techStack.buildTools.join(', ')} build tools`
      : '';

    const prompt = `You are an expert software developer and code architect.

I am working on a ${techStack.primaryLanguage} project${frameworksText}${buildToolsText}.

Here is the complete file structure of my project:

${generateFileTree(files)}

Based on this context, create a comprehensive .gitignore list to exclude all non-essential files and folders. This includes dependencies, build artifacts, log files, environment variables, and common OS/editor-specific files.

IMPORTANT: 
- Generate ONLY file or folder names/patterns, one per line
- Do NOT include any comments, explanations, or section headers
- Do NOT use # symbols or any explanatory text
- Each line should contain only the ignore pattern (e.g., node_modules/, *.log, dist/)
- Focus on patterns specific to this project's technology stack and structure

Example format:
node_modules/
dist/
build/
*.log
.env
coverage/`;

    setGeneratedPrompt(prompt);
  };

  const generateFileTree = (files: FilePayload[]): string => {
    const tree = new Map();
    
    files.forEach(file => {
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

    const treeLines: string[] = [];
    
    function buildTree(node: Map<string, any>, prefix = "") {
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
    return treeLines.join('\n');
  };

  const copyToClipboard = (text: string, key: string) => {
    const ta = document.createElement('textarea');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.value = text;
    ta.select();
    try {
      document.execCommand('copy');
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(ta);
  };

  const handleNext = () => {
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleApply = () => {
    // Allow empty ignore lists - the app will use default patterns
    onApplyIgnoreList(ignoreList.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-fast">
      <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl m-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Wand2 size={24} className="text-purple-400" />
            <h2 className="text-xl font-bold text-white">Smart Ignore List Generator</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
              Generate Prompt
            </div>
            <div className="w-8 h-px bg-slate-600"></div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
              Apply & Generate
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 1: Generate Your Ignore List</h3>
                <p className="text-slate-300 mb-4">
                  Use your favorite AI to automatically create an ignore list for this project. 
                  The prompt below is tailored to your project's technology stack.
                </p>
                
                {techStack && (
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-2">Detected Technology Stack:</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <div><span className="font-medium">Language:</span> {techStack.primaryLanguage}</div>
                      {techStack.frameworks.length > 0 && (
                        <div><span className="font-medium">Frameworks:</span> {techStack.frameworks.join(', ')}</div>
                      )}
                      {techStack.buildTools.length > 0 && (
                        <div><span className="font-medium">Build Tools:</span> {techStack.buildTools.join(', ')}</div>
                      )}
                      {techStack.packageManagers.length > 0 && (
                        <div><span className="font-medium">Package Managers:</span> {techStack.packageManagers.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-purple-300">
                  AI Prompt (Click to copy)
                </label>
                <div className="relative">
                  <textarea
                    value={generatedPrompt}
                    readOnly
                    rows={12}
                    className="w-full bg-slate-800 text-slate-200 rounded-md px-3 py-3 border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition font-mono text-sm resize-none"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedPrompt, 'prompt')}
                    className="absolute top-3 right-3 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"
                  >
                    {copiedStates.prompt ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Copy this prompt and paste it into your AI assistant (ChatGPT, Claude, etc.)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 2: Apply Ignore List & Generate Context</h3>
                <p className="text-slate-300 mb-4">
                  Paste the ignore list from your AI here. You can review and modify it before applying, or leave empty to use default ignore patterns.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-purple-300">
                  Ignore List
                </label>
                <textarea
                  value={ignoreList}
                  onChange={(e) => setIgnoreList(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-md px-3 py-3 border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition font-mono text-sm resize-none"
                  placeholder="Paste your ignore list here...

node_modules/
vendor/
dist/
build/
target/
*.log
logs/
.env
.env.local
coverage/
__pycache__/"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Paste the ignore list from your AI assistant (one pattern per line, no comments). You can modify it if needed, or leave empty to use default ignore patterns.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-white/10">
          <div>
            {currentStep === 2 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            {currentStep === 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
              >
                <FileText size={16} />
                Apply & Generate Context
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
