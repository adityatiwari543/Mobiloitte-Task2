const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', 'AUDIT']);

function getTree(dir, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return '';
  let str = '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    str += '  '.repeat(depth) + entry.name + (entry.isDirectory() ? '/' : '') + '\n';
    if (entry.isDirectory() && depth < maxDepth) {
      str += getTree(path.join(dir, entry.name), depth + 1, maxDepth);
    }
  }
  return str;
}

const tree = getTree(process.cwd(), 0, 4);
fs.writeFileSync('AUDIT/raw/01_tree.txt', tree, 'utf8');

const exts = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.js': 'JavaScript',
  '.json': 'JSON',
  '.css': 'CSS',
  '.html': 'HTML',
  '.md': 'Markdown',
  '.yml': 'YAML',
  '.yaml': 'YAML'
};

const stats = {};
const allSourceFiles = [];
let totalFeLoc = 0;
let totalBeLoc = 0;
let totalSharedLoc = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      const ext = path.extname(entry.name);
      const rel = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      
      let cat = 'config';
      if (rel.includes('/__tests__/') || rel.includes('.test.') || rel.includes('.spec.')) {
        cat = 'tests';
      } else if (rel.startsWith('backend/src/')) {
        cat = 'source';
        totalBeLoc += lines;
      } else if (rel.startsWith('frontend/src/')) {
        cat = 'source';
        totalFeLoc += lines;
      } else if (rel.startsWith('shared/src/')) {
        cat = 'source';
        totalSharedLoc += lines;
      } else if (rel.startsWith('docs/')) {
        cat = 'docs';
      }

      const lang = exts[ext] || 'Other';
      if (!stats[lang]) stats[lang] = { source: 0, tests: 0, config: 0, docs: 0, total: 0, files: 0 };
      stats[lang][cat] = (stats[lang][cat] || 0) + lines;
      stats[lang].total += lines;
      stats[lang].files += 1;

      if (cat === 'source' || cat === 'tests') {
        allSourceFiles.push({ path: rel, lines, cat });
      }
    }
  }
}

walk(process.cwd());

let locReport = 'Language | Files | Source LOC | Test LOC | Config/Other LOC | Total LOC\n';
locReport += '---|---|---|---|---|---\n';
for (const [lang, s] of Object.entries(stats)) {
  locReport += `${lang} | ${s.files} | ${s.source} | ${s.tests} | ${(s.config || 0) + (s.docs || 0)} | ${s.total}\n`;
}
locReport += `\nFE Source LOC: ${totalFeLoc}\nBE Source LOC: ${totalBeLoc}\nShared Source LOC: ${totalSharedLoc}\n`;
fs.writeFileSync('AUDIT/raw/01_loc.txt', locReport, 'utf8');

allSourceFiles.sort((a, b) => b.lines - a.lines);
const top25 = allSourceFiles.slice(0, 25);
let largestReport = 'Rank | File | Lines | Over 500 LOC?\n---|---|---|---\n';
top25.forEach((f, idx) => {
  largestReport += `${idx + 1} | ${f.path} | ${f.lines} | ${f.lines > 500 ? 'YES (FLAGGED)' : 'NO'}\n`;
});
fs.writeFileSync('AUDIT/raw/01_largest_files.txt', largestReport, 'utf8');

// Check git committed files
const gitFiles = execSync('git ls-files', { encoding: 'utf8' }).split('\n').map(s => s.trim()).filter(Boolean);
const suspiciousExts = ['.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz', '.sql', '.dump', '.key', '.pem', '.env'];
const suspicious = gitFiles.filter(f => {
  const lower = f.toLowerCase();
  return suspiciousExts.some(ext => lower.endsWith(ext) || lower === '.env' || lower.startsWith('.env.'));
});
fs.writeFileSync('AUDIT/raw/01_committed_suspicious_files.txt', suspicious.join('\n'), 'utf8');

console.log('Done inventory. Total FE LOC:', totalFeLoc, 'BE LOC:', totalBeLoc, 'Shared LOC:', totalSharedLoc);
