const fs = require('fs');
const path = require('path');

const classes = [];
const godClasses = [];
const anaemicModels = [];
const magicValues = [];

const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'AUDIT']);

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  // Check for classes
  const classMatches = content.matchAll(/(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?(?:\s+implements\s+([^{]+))?\s*\{/g);
  for (const m of classMatches) {
    const name = m[1];
    const ext = m[2] || '';
    const imp = (m[3] || '').trim();
    
    // Count methods
    const methodMatches = content.matchAll(/(?:public|private|protected|static|async)?\s*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*(?::\s*[^=]+)?\s*\{/g);
    let methodsCount = 0;
    for (const mm of methodMatches) {
      if (!['constructor', 'if', 'for', 'while', 'switch', 'catch'].includes(mm[1])) {
        methodsCount++;
      }
    }

    const loc = lines.length;
    classes.push({
      name,
      kind: content.includes(`abstract class ${name}`) ? 'abstract class' : 'class',
      file_line: `${rel}:${content.substring(0, m.index).split('\n').length}`,
      extends: ext,
      implements: imp,
      methods_count: methodsCount,
      loc
    });

    if (methodsCount > 15 || loc > 400) {
      godClasses.push({ name, file: rel, methodsCount, loc });
    }
  }

  // Check for interfaces
  const ifaceMatches = content.matchAll(/(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([^{]+))?\s*\{/g);
  for (const m of ifaceMatches) {
    const name = m[1];
    const ext = (m[2] || '').trim();
    const lineNum = content.substring(0, m.index).split('\n').length;
    classes.push({
      name,
      kind: 'interface',
      file_line: `${rel}:${lineNum}`,
      extends: ext,
      implements: '',
      methods_count: 0,
      loc: lines.length
    });
  }

  // Check for types
  const typeMatches = content.matchAll(/(?:export\s+)?type\s+([a-zA-Z0-9_$]+)\s*=/g);
  for (const m of typeMatches) {
    const name = m[1];
    const lineNum = content.substring(0, m.index).split('\n').length;
    classes.push({
      name,
      kind: 'type',
      file_line: `${rel}:${lineNum}`,
      extends: '',
      implements: '',
      methods_count: 0,
      loc: lines.length
    });
  }

  // Check for enums
  const enumMatches = content.matchAll(/(?:export\s+)?enum\s+([a-zA-Z0-9_$]+)\s*\{/g);
  for (const m of enumMatches) {
    const name = m[1];
    const lineNum = content.substring(0, m.index).split('\n').length;
    classes.push({
      name,
      kind: 'enum',
      file_line: `${rel}:${lineNum}`,
      extends: '',
      implements: '',
      methods_count: 0,
      loc: lines.length
    });
  }

  // Mongoose models anaemic check
  if (rel.startsWith('backend/src/models/')) {
    const hasMethods = content.includes('.methods.') || content.includes('.statics.');
    if (!hasMethods && !rel.endsWith('index.ts')) {
      anaemicModels.push({ file: rel, hasMethods: false });
    }
  }

  // Magic numbers and strings in business logic
  if (rel.startsWith('backend/src/services/')) {
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) return;
      // find magic numbers
      const numMatches = trimmed.match(/\b(?<![a-zA-Z_])(15|300|900|86400|604800|1000|500|400|5000|100)\b/g);
      if (numMatches && !trimmed.includes('PORT') && !trimmed.includes('HTTP_STATUS') && !trimmed.includes('statusCode')) {
        numMatches.forEach(num => {
          magicValues.push({ file_line: `${rel}:${idx + 1}`, value: num, context: trimmed.substring(0, 100) });
        });
      }
    });
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        analyzeFile(fullPath);
      }
    }
  }
}

walk('backend/src');
walk('shared/src');

// Write classes.csv
let csv = 'name,kind,file_line,extends,implements,methods_count,loc\n';
classes.forEach(c => {
  csv += `"${c.name}","${c.kind}","${c.file_line}","${c.extends}","${c.implements}",${c.methods_count},${c.loc}\n`;
});
fs.writeFileSync('AUDIT/raw/classes.csv', csv, 'utf8');

// Write object model report
let report = '# Object Model & Patterns Analysis\n\n';
report += `Total classes/interfaces/types/enums: ${classes.length}\n\n`;

report += `## God Classes / Services (>15 public methods or >400 LOC):\n`;
report += '| Service/Class | File | Methods | LOC |\n|---|---|---|---|\n';
godClasses.forEach(g => {
  report += `| \`${g.name}\` | ${g.file} | ${g.methodsCount} | ${g.loc} |\n`;
});
report += '\n';

report += `## Anaemic Domain Models (Mongoose Schemas with No Business Methods):\n`;
anaemicModels.forEach(m => {
  report += `- \`${m.file}\` (Pure schema definition; all rules and transitions placed in Services)\n`;
});
report += '\n';

report += `## Magic Values in Services (Sample 20):\n`;
report += '| File:Line | Value | Code Context |\n|---|---|---|\n';
magicValues.slice(0, 20).forEach(mv => {
  report += `| ${mv.file_line} | \`${mv.value}\` | \`${mv.context.replace(/\|/g, '\\|')}\` |\n`;
});

fs.writeFileSync('AUDIT/raw/04_object_model.txt', report, 'utf8');
console.log('Object model analysis done. Total entities:', classes.length, 'God classes:', godClasses.length, 'Anaemic models:', anaemicModels.length);
