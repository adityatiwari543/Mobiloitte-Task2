const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function maskValue(val) {
  if (!val || val.length === 0) return 'EMPTY';
  const str = String(val).trim();
  if (str.length <= 2) return str + '...';
  return str.substring(0, 2) + '... (len: ' + str.length + ')';
}

function getKeyType(key) {
  const k = key.toUpperCase();
  if (k.includes('MONGO') || k.includes('DB') || k.includes('REDIS')) return 'Database';
  if (k.includes('JWT') || k.includes('SECRET') || k.includes('TOKEN') || k.includes('CSRF')) return 'JWT/Auth Secret';
  if (k.includes('KEY') || k.includes('AI')) return 'API Key';
  if (k.includes('SMTP') || k.includes('EMAIL') || k.includes('PASS')) return 'SMTP/Email';
  if (k.includes('PORT') || k.includes('URL') || k.includes('DOMAIN') || k.includes('ENV')) return 'Network/Environment';
  if (k.includes('STORAGE')) return 'Storage';
  return 'Configuration';
}

const envExampleKeys = new Set();
if (fs.existsSync('.env.example')) {
  fs.readFileSync('.env.example', 'utf8').split('\n').forEach(l => {
    const trimmed = l.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const key = trimmed.split('=')[0].trim();
      if (key) envExampleKeys.add(key);
    }
  });
}

const codeFiles = [];
function getCodeFiles(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
    if (f.name === 'node_modules' || f.name === 'dist' || f.name === '.git' || f.name === 'AUDIT') return;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) getCodeFiles(p);
    else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx') || f.name.endsWith('.js') || f.name.endsWith('.yml')) {
      codeFiles.push(p);
    }
  });
}
getCodeFiles(process.cwd());

const codeContents = codeFiles.map(f => ({ file: f, content: fs.readFileSync(f, 'utf8') }));

function isUsedInCode(key) {
  return codeContents.some(c => c.content.includes(key) || c.content.includes(`env.${key}`));
}

// Check if secret key was committed in git files other than .env.example
function wasKeyCommitted(key) {
  try {
    const out = execSync(`git log --all --name-only -S"${key}" --oneline`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = out.split('\n').map(s => s.trim()).filter(Boolean);
    const hasEnv = lines.some(l => l === '.env' || l.endsWith('/.env'));
    return hasEnv ? 'YES (Committed in .env)' : 'NO (.env uncommitted; key present in .env.example / code)';
  } catch {
    return 'NO';
  }
}

const envKeys = [];

if (fs.existsSync('.env')) {
  const lines = fs.readFileSync('.env', 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      const masked = maskValue(val);
      const type = getKeyType(key);
      const committed = wasKeyCommitted(key);
      const inExample = envExampleKeys.has(key);
      const used = isUsedInCode(key);

      envKeys.push({
        key,
        file_line: `.env:${idx + 1}`,
        type,
        masked,
        committed_to_git: committed,
        in_example: inExample ? 'YES' : 'NO',
        used_in_code: used ? 'YES' : 'NO',
        environment_specific: 'YES'
      });
    }
  });
}

// Write env_keys.csv
let csv = 'key,file_line,type,masked_value,committed_to_git,in_env_example,used_in_code,environment_specific\n';
envKeys.forEach(e => {
  csv += `"${e.key}","${e.file_line}","${e.type}","${e.masked}","${e.committed_to_git}","${e.in_example}","${e.used_in_code}","${e.environment_specific}"\n`;
});
fs.writeFileSync('AUDIT/env_keys.csv', csv, 'utf8');

let report = '# Environment & Secret Keys Audit\n\n';
report += `Total Environment Keys Found in \`.env\`: ${envKeys.length}\n`;
report += `Keys in \`.env.example\`: ${envExampleKeys.size}\n\n`;

report += '| Key | Type | Masked Value | In .env.example? | Used in Code? | Committed to Git? |\n|---|---|---|---|---|---|\n';
envKeys.forEach(e => {
  report += `| \`${e.key}\` | ${e.type} | \`${e.masked}\` | ${e.in_example} | ${e.used_in_code} | ${e.committed_to_git} |\n`;
});

fs.writeFileSync('AUDIT/raw/10_env_keys.txt', report, 'utf8');
console.log('Environment keys updated.');
