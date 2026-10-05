const fs = require('fs');
const path = require('path');

const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'AUDIT']);

// 1. Dependency Graph & Circular Dependency Detection
function getImports(filePath, fileContent) {
  const imports = [];
  const lines = fileContent.split('\n');
  const dir = path.dirname(filePath);

  lines.forEach(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^import\s+.*?\s+from\s+['"](.*?)['"]/);
    const requireMatch = trimmed.match(/require\(['"](.*?)['"]\)/);
    const target = match ? match[1] : (requireMatch ? requireMatch[1] : null);

    if (target && (target.startsWith('.') || target.startsWith('@jobconnect/shared') || target.startsWith('@/'))) {
      let resolved = null;
      if (target.startsWith('.')) {
        const potential = path.resolve(dir, target);
        const candidates = [
          potential,
          potential + '.ts',
          potential + '.tsx',
          potential + '.js',
          potential + '/index.ts',
          potential + '/index.tsx'
        ];
        for (const c of candidates) {
          if (fs.existsSync(c) && !fs.statSync(c).isDirectory()) {
            resolved = c;
            break;
          }
        }
      } else if (target === '@jobconnect/shared') {
        const c = path.resolve(process.cwd(), 'shared/src/index.ts');
        if (fs.existsSync(c)) resolved = c;
      }
      if (resolved) {
        imports.push(path.relative(process.cwd(), resolved).replace(/\\/g, '/'));
      }
    }
  });
  return imports;
}

const graph = {};
const allFiles = [];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath);
    } else {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
        allFiles.push(rel);
        const content = fs.readFileSync(fullPath, 'utf8');
        graph[rel] = getImports(fullPath, content);
      }
    }
  }
}

collectFiles('backend/src');
collectFiles('frontend/src');
collectFiles('shared/src');

// Circular dependency detection
const cycles = [];
const visited = new Set();
const recStack = [];

function dfs(node) {
  visited.add(node);
  recStack.push(node);

  const neighbors = graph[node] || [];
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      dfs(neighbor);
    } else if (recStack.includes(neighbor)) {
      const cyclePath = recStack.slice(recStack.indexOf(neighbor)).concat(neighbor);
      cycles.push(cyclePath);
    }
  }

  recStack.pop();
}

for (const file of allFiles) {
  if (!visited.has(file)) {
    dfs(file);
  }
}

// 2. Layer Violations
const layerViolations = [];
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const imports = graph[file] || [];

  // Rule A: Controllers should not import Mongoose models directly (should go through services)
  if (file.includes('backend/src/controllers/')) {
    imports.forEach(imp => {
      if (imp.includes('backend/src/models/')) {
        layerViolations.push({
          file,
          violation: `Controller directly imports Model: ${imp}`,
          rule: 'Controllers must interact with domain logic via Services, not Mongoose models directly'
        });
      }
    });
  }

  // Rule B: Domain Services should not import Express Request/Response objects
  if (file.includes('backend/src/services/')) {
    if (content.match(/import\s+.*?\{.*?(Request|Response).*?\}\s+from\s+['"]express['"]/)) {
      layerViolations.push({
        file,
        violation: 'Service imports Express Request/Response types',
        rule: 'Services should be decoupled from HTTP transport layer'
      });
    }
  }

  // Rule C: Frontend components directly querying backend DB (check if any mongo/mongoose or server imports)
  if (file.includes('frontend/src/')) {
    imports.forEach(imp => {
      if (imp.includes('backend/src/')) {
        layerViolations.push({
          file,
          violation: `Frontend directly imports backend source: ${imp}`,
          rule: 'Frontend cannot import backend source'
        });
      }
    });
  }
});

// 3. Complexity & Long Functions
const longFunctions = [];
const complexFunctions = [];

function analyzeFunctions(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Simple heuristic parser for function boundaries
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>|([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{/g;
  
  // Find function starts
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const fnName = match[1] || match[3] || match[5];
    if (!fnName || ['if', 'while', 'for', 'switch', 'catch'].includes(fnName)) continue;

    const startIdx = match.index;
    const lineNumber = content.substring(0, startIdx).split('\n').length;

    // find matching brace
    let openBraces = 0;
    let started = false;
    let fnEndLine = lineNumber;
    let cyclomatic = 1;

    for (let i = lineNumber - 1; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          openBraces++;
          started = true;
        } else if (char === '}') {
          openBraces--;
        }
      }

      // count branches for cyclomatic complexity
      const branchMatches = line.match(/\b(if|else\s+if|for|while|case|catch|\?\?|\?|&&|\|\|)\b/g);
      if (branchMatches) cyclomatic += branchMatches.length;

      if (started && openBraces === 0) {
        fnEndLine = i + 1;
        break;
      }
    }

    const fnLength = fnEndLine - lineNumber + 1;
    if (fnLength > 80) {
      longFunctions.push({ file, fnName, lineNumber, fnLength });
    }
    if (cyclomatic >= 10) {
      complexFunctions.push({ file, fnName, lineNumber, cyclomatic, fnLength });
    }
  }
}

allFiles.forEach(analyzeFunctions);

// Sort complexity
complexFunctions.sort((a, b) => b.cyclomatic - a.cyclomatic);
longFunctions.sort((a, b) => b.fnLength - a.fnLength);

// 4. Code Duplication (Simple line chunk hashing)
const chunkSize = 10;
const chunkMap = new Map();
let totalLinesExamined = 0;
let duplicatedLinesCount = 0;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.startsWith('//') && !l.startsWith('/*'));
  totalLinesExamined += lines.length;

  for (let i = 0; i <= lines.length - chunkSize; i += 2) {
    const chunk = lines.slice(i, i + chunkSize).join('\n');
    if (!chunkMap.has(chunk)) {
      chunkMap.set(chunk, []);
    }
    chunkMap.get(chunk).push({ file, line: i + 1 });
  }
});

const duplicatedBlocks = [];
for (const [chunk, occurrences] of chunkMap.entries()) {
  // deduplicate same file overlaps
  const distinctFiles = new Set(occurrences.map(o => o.file));
  if (occurrences.length > 1 && (distinctFiles.size > 1 || occurrences.length > 2)) {
    duplicatedBlocks.push({
      occurrences,
      sample: chunk.substring(0, 150) + '...'
    });
    duplicatedLinesCount += (occurrences.length - 1) * chunkSize;
  }
}

duplicatedBlocks.sort((a, b) => b.occurrences.length - a.occurrences.length);

const duplicationPct = totalLinesExamined > 0 ? ((duplicatedLinesCount / totalLinesExamined) * 100).toFixed(2) : '0.00';

let archReport = '# Architecture & Layering Analysis\n\n';
archReport += `## Circular Dependencies Detected: ${cycles.length}\n`;
if (cycles.length > 0) {
  cycles.forEach((c, idx) => {
    archReport += `Cycle ${idx + 1}:\n  ${c.join(' -> ')}\n\n`;
  });
} else {
  archReport += 'No circular dependencies detected among imported modules.\n\n';
}

archReport += `## Layer Violations Detected: ${layerViolations.length}\n`;
layerViolations.forEach(lv => {
  archReport += `- [${lv.file}] ${lv.violation} (${lv.rule})\n`;
});
archReport += '\n';

archReport += `## Functions Over 80 Lines: ${longFunctions.length}\n`;
archReport += '| Rank | File:Line | Function | Length (LOC) |\n|---|---|---|---|\n';
longFunctions.slice(0, 25).forEach((fn, idx) => {
  archReport += `| ${idx + 1} | ${fn.file}:${fn.lineNumber} | \`${fn.fnName}\` | ${fn.fnLength} |\n`;
});
archReport += '\n';

archReport += `## Top 20 Cyclomatic Complexity Functions:\n`;
archReport += '| Rank | File:Line | Function | Cyclomatic Complexity | Length |\n|---|---|---|---|---|\n';
complexFunctions.slice(0, 20).forEach((fn, idx) => {
  archReport += `| ${idx + 1} | ${fn.file}:${fn.lineNumber} | \`${fn.fnName}\` | ${fn.cyclomatic} | ${fn.fnLength} |\n`;
});
archReport += '\n';

archReport += `## Code Duplication:\n`;
archReport += `- Total lines evaluated: ${totalLinesExamined}\n`;
archReport += `- Estimated duplication percentage: ${duplicationPct}%\n`;
archReport += `- Top duplicated blocks count: ${duplicatedBlocks.length}\n`;

fs.writeFileSync('AUDIT/raw/03_architecture.txt', archReport, 'utf8');
fs.writeFileSync('AUDIT/raw/03_architecture.json', JSON.stringify({
  cycles,
  layerViolations,
  longFunctionsCount: longFunctions.length,
  topLongFunctions: longFunctions.slice(0, 25),
  topComplexFunctions: complexFunctions.slice(0, 20),
  duplicationPct,
  topDuplicatedBlocks: duplicatedBlocks.slice(0, 15)
}, null, 2), 'utf8');

console.log('Architecture analysis complete. Cycles:', cycles.length, 'Violations:', layerViolations.length, 'Long funcs:', longFunctions.length);
