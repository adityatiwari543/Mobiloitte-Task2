const fs = require('fs');
const path = require('path');

const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'AUDIT']);

const metrics = {
  be: { any: 0, asAny: 0, tsIgnore: 0, eslintDisable: 0, consoleLog: 0, todo: 0, fixme: 0, hack: 0, commentedBlocks: 0 },
  fe: { any: 0, asAny: 0, tsIgnore: 0, eslintDisable: 0, consoleLog: 0, todo: 0, fixme: 0, hack: 0, commentedBlocks: 0 },
  shared: { any: 0, asAny: 0, tsIgnore: 0, eslintDisable: 0, consoleLog: 0, todo: 0, fixme: 0, hack: 0, commentedBlocks: 0 }
};

const details = {
  consoleLogs: [],
  todos: [],
  anyCasts: [],
  tsIgnores: []
};

function checkFile(filePath, pkg) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const isTest = relPath.includes('__tests__') || relPath.includes('.test.') || relPath.includes('.spec.');

  let inBlockComment = false;
  let consecutiveCommentedLines = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Block comments
    if (trimmed.startsWith('/*')) inBlockComment = true;
    if (trimmed.endsWith('*/')) { inBlockComment = false; return; }
    if (inBlockComment) return;

    // Commented out code detection (line comments starting with // and containing code syntax like const, let, if, return, import, <)
    if (trimmed.startsWith('//') && (
      trimmed.match(/^\/\/\s*(const|let|var|if|return|import|function|<[A-Z]|\w+\(.*\);)/)
    )) {
      consecutiveCommentedLines++;
    } else {
      if (consecutiveCommentedLines >= 3) {
        metrics[pkg].commentedBlocks++;
      }
      consecutiveCommentedLines = 0;
    }

    // Skip commented lines for code pattern checks
    if (trimmed.startsWith('//')) {
      if (trimmed.includes('TODO')) { metrics[pkg].todo++; details.todos.push(`${relPath}:${lineNum}: ${trimmed}`); }
      if (trimmed.includes('FIXME')) { metrics[pkg].fixme++; details.todos.push(`${relPath}:${lineNum}: ${trimmed}`); }
      if (trimmed.includes('HACK')) { metrics[pkg].hack++; details.todos.push(`${relPath}:${lineNum}: ${trimmed}`); }
      if (trimmed.includes('@ts-ignore')) { metrics[pkg].tsIgnore++; details.tsIgnores.push(`${relPath}:${lineNum}`); }
      if (trimmed.includes('eslint-disable')) { metrics[pkg].eslintDisable++; }
      return;
    }

    if (trimmed.includes('@ts-ignore')) { metrics[pkg].tsIgnore++; details.tsIgnores.push(`${relPath}:${lineNum}`); }
    if (trimmed.includes('eslint-disable')) { metrics[pkg].eslintDisable++; }

    // console.log
    if (!isTest && trimmed.includes('console.log')) {
      metrics[pkg].consoleLog++;
      details.consoleLogs.push(`${relPath}:${lineNum}: ${trimmed}`);
    }

    // any and as any
    if (trimmed.includes('as any')) {
      metrics[pkg].asAny++;
      details.anyCasts.push(`${relPath}:${lineNum}: ${trimmed}`);
    } else if (trimmed.match(/:\s*any\b/) || trimmed.match(/<any>/)) {
      metrics[pkg].any++;
      details.anyCasts.push(`${relPath}:${lineNum}: ${trimmed}`);
    }
  });

  if (consecutiveCommentedLines >= 3) {
    metrics[pkg].commentedBlocks++;
  }
}

function walk(dir, pkg) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, pkg);
    } else {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        checkFile(fullPath, pkg);
      }
    }
  }
}

if (fs.existsSync('backend/src')) walk('backend/src', 'be');
if (fs.existsSync('frontend/src')) walk('frontend/src', 'fe');
if (fs.existsSync('shared/src')) walk('shared/src', 'shared');

let report = '# Code Health & Static Analysis Inspection\n\n';
report += '| Metric | Backend | Frontend | Shared | Total |\n';
report += '|---|---|---|---|---|\n';
report += `| \`any\` type annotations | ${metrics.be.any} | ${metrics.fe.any} | ${metrics.shared.any} | ${metrics.be.any + metrics.fe.any + metrics.shared.any} |\n`;
report += `| \`as any\` casts | ${metrics.be.asAny} | ${metrics.fe.asAny} | ${metrics.shared.asAny} | ${metrics.be.asAny + metrics.fe.asAny + metrics.shared.asAny} |\n`;
report += `| \`@ts-ignore\` | ${metrics.be.tsIgnore} | ${metrics.fe.tsIgnore} | ${metrics.shared.tsIgnore} | ${metrics.be.tsIgnore + metrics.fe.tsIgnore + metrics.shared.tsIgnore} |\n`;
report += `| \`eslint-disable\` | ${metrics.be.eslintDisable} | ${metrics.fe.eslintDisable} | ${metrics.shared.eslintDisable} | ${metrics.be.eslintDisable + metrics.fe.eslintDisable + metrics.shared.eslintDisable} |\n`;
report += `| \`console.log\` in non-test code | ${metrics.be.consoleLog} | ${metrics.fe.consoleLog} | ${metrics.shared.consoleLog} | ${metrics.be.consoleLog + metrics.fe.consoleLog + metrics.shared.consoleLog} |\n`;
report += `| \`TODO\` comments | ${metrics.be.todo} | ${metrics.fe.todo} | ${metrics.shared.todo} | ${metrics.be.todo + metrics.fe.todo + metrics.shared.todo} |\n`;
report += `| \`FIXME\` comments | ${metrics.be.fixme} | ${metrics.fe.fixme} | ${metrics.shared.fixme} | ${metrics.be.fixme + metrics.fe.fixme + metrics.shared.fixme} |\n`;
report += `| \`HACK\` comments | ${metrics.be.hack} | ${metrics.fe.hack} | ${metrics.shared.hack} | ${metrics.be.hack + metrics.fe.hack + metrics.shared.hack} |\n`;
report += `| Commented-out code blocks (>=3 lines) | ${metrics.be.commentedBlocks} | ${metrics.fe.commentedBlocks} | ${metrics.shared.commentedBlocks} | ${metrics.be.commentedBlocks + metrics.fe.commentedBlocks + metrics.shared.commentedBlocks} |\n\n`;

report += '## Sample console.log occurrences (first 30):\n' + details.consoleLogs.slice(0, 30).join('\n') + '\n\n';
report += '## Sample TODO / FIXME occurrences:\n' + details.todos.join('\n') + '\n\n';
report += '## Sample any / as any occurrences (first 30):\n' + details.anyCasts.slice(0, 30).join('\n') + '\n\n';
report += '## @ts-ignore occurrences:\n' + details.tsIgnores.join('\n') + '\n';

fs.writeFileSync('AUDIT/raw/02_code_health.txt', report, 'utf8');
fs.writeFileSync('AUDIT/raw/02_code_health.json', JSON.stringify({ metrics, details }, null, 2), 'utf8');
console.log('Code health analysis complete.');
