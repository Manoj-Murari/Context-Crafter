import { describe, it, expect } from 'vitest';
import { processProject, type FilePayload } from './engine';

describe('processProject Engine', () => {

  it('should create a basic project tree and content', () => {
    const files: FilePayload[] = [
      { path: 'README.md', content: '# My Project' },
      { path: 'src/index.js', content: 'console.log("hello");' },
    ];
    const projectName = 'test-project';
    const ignorePatterns: string[] = [];

    const result = processProject(files, projectName, ignorePatterns);

    // Check 1: Make sure the project tree looks correct
    expect(result.tree).toContain('test-project');
    expect(result.tree).toContain('├── README.md');
    expect(result.tree).toContain('└── src/');
    expect(result.tree).toContain('└── index.js');

    // Check 2: Make sure it's not chunked for a small project
    expect(result.isChunked).toBe(false);

    // Check 3: Make sure there's only one chunk
    expect(result.chunks.length).toBe(1);

    // Check 4: Make sure the file content is included correctly
    const readmeContent = result.chunks[0].parts.find(p => p.path === 'README.md');
    const indexJsContent = result.chunks[0].parts.find(p => p.path === 'src/index.js');
    expect(readmeContent?.content).toBe('# My Project');
    expect(indexJsContent?.content).toBe('console.log("hello");');
  });

  it('should ignore default patterns like node_modules and .env', () => {
    const files: FilePayload[] = [
      { path: 'package.json', content: '{"name": "test"}' },
      { path: 'src/app.js', content: 'console.log("app");' },
      { path: '.env', content: 'SECRET=123' }, // Should be ignored
      { path: 'node_modules/react/index.js', content: 'import React from "react";' }, // Should be ignored
    ];
    const projectName = 'ignore-test';
    const ignorePatterns: string[] = [];

    const result = processProject(files, projectName, ignorePatterns);

    // Check 1: Make sure the ignored files are NOT in the tree
    expect(result.tree).not.toContain('.env');
    expect(result.tree).not.toContain('node_modules');

    // Check 2: Make sure the good files ARE in the tree
    expect(result.tree).toContain('package.json');
    expect(result.tree).toContain('src/');
    expect(result.tree).toContain('app.js');

    // Check 3: Make sure the content of ignored files is not included
    const envFile = result.chunks[0].parts.find(p => p.path === '.env');
    const nodeModuleFile = result.chunks[0].parts.find(p => p.path === 'node_modules/react/index.js');
    expect(envFile).toBeUndefined();
    expect(nodeModuleFile).toBeUndefined();
  });

  // FINAL TEST! This checks our custom rules.
  it('should use custom and .gitignore rules to ignore files', () => {
    const files: FilePayload[] = [
      { path: 'index.js', content: 'console.log("run");' },
      { path: 'data.log', content: 'log data' }, // Should be ignored by custom rule
      { path: 'dist/bundle.js', content: 'minified code' }, // Should be ignored by .gitignore rule
    ];
    const projectName = 'custom-ignore-test';
    
    // These are like the rules a user would type in the settings.
    const customIgnorePatterns = ['*.log']; 
    
    // This is like the content of a .gitignore file in the project.
    const gitignoreContent = 'dist/';

    const allIgnoreRules = [
        ...customIgnorePatterns,
        ...gitignoreContent.split('\n')
    ];

    const result = processProject(files, projectName, allIgnoreRules);

    // Check 1: Make sure the ignored files are NOT in the results
    expect(result.tree).not.toContain('data.log');
    expect(result.tree).not.toContain('dist/');
    const logFile = result.chunks[0].parts.find(p => p.path === 'data.log');
    expect(logFile).toBeUndefined();

    // Check 2: Make sure the good file IS in the results
    expect(result.tree).toContain('index.js');
    const goodFile = result.chunks[0].parts.find(p => p.path === 'index.js');
    expect(goodFile).toBeDefined();
  });

});
