const fs = require('fs');
const path = require('path');

// 1. Parse App.tsx for routes
const appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf8');
const routes = [];

// Match Route elements: <Route path="..." element={<... />} ... />
const routeRegex = /<Route\s+([^>]*?)>/g;
let rm;
while ((rm = routeRegex.exec(appTsx)) !== null) {
  const props = rm[1];
  const pathMatch = props.match(/path="([^"]+)"/);
  const elementMatch = props.match(/element=\{([^}]+)\}/);
  
  if (pathMatch && elementMatch) {
    const routePath = pathMatch[1];
    const element = elementMatch[1].trim();

    // Check if wrapped in ProtectedRoute
    // Example: <ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>
    let guard = 'None';
    let rolesAllowed = 'Public';
    let component = element;

    if (element.includes('ProtectedRoute')) {
      guard = 'ProtectedRoute (Client-side)';
      const rolesMatch = element.match(/allowedRoles=\{\[([^\]]+)\]\}/);
      if (rolesMatch) {
        rolesAllowed = rolesMatch[1].replace(/['"\s]/g, '');
      } else {
        rolesAllowed = 'Authenticated (Any)';
      }
      const compMatch = element.match(/<([A-Z][a-zA-Z0-9]+)/g);
      if (compMatch && compMatch.length > 1) {
        component = compMatch[1].replace('<', '');
      }
    } else {
      const compMatch = element.match(/<([A-Z][a-zA-Z0-9]+)/);
      if (compMatch) component = compMatch[1];
    }

    // Check if lazy loaded in App.tsx (React.lazy)
    const isLazy = appTsx.includes(`lazy(`) && appTsx.includes(component);

    routes.push({
      path: routePath,
      component,
      lazy_loaded: isLazy ? 'YES' : 'NO',
      guard,
      roles_allowed: rolesAllowed,
      api_calls_on_load: 'Inferred on mount'
    });
  }
}

// Write routes_frontend.csv
let routesCsv = 'path,component,lazy_loaded,guard,roles_allowed,api_calls_on_load\n';
routes.forEach(r => {
  routesCsv += `"${r.path}","${r.component}","${r.lazy_loaded}","${r.guard}","${r.roles_allowed}","${r.api_calls_on_load}"\n`;
});
fs.writeFileSync('AUDIT/routes_frontend.csv', routesCsv, 'utf8');

// 2. Storage checks (localStorage / sessionStorage)
const storageUsages = [];
function checkStorage(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === 'dist') continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) checkStorage(p);
    else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx') || f.name.endsWith('.js')) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('localStorage') || line.includes('sessionStorage')) {
          const rel = path.relative(process.cwd(), p).replace(/\\/g, '/');
          storageUsages.push({ file_line: `${rel}:${idx + 1}`, code: line.trim() });
        }
      });
    }
  }
}
checkStorage('frontend/src');

// 3. Hardcoded / Fake Data Detector
const hardcoded = [];
const patterns = [
  { regex: /\b(mock|dummy|fake|faker|sample|demo|lorem|placeholder)\b/i, category: 'MOCK_KEYWORD' },
  { regex: /Math\.random\(\)/, category: 'RANDOM_GENERATION' },
  { regex: /setTimeout\s*\(\s*(?:\(\)\s*=>|function)/, category: 'SIMULATED_ASYNC' },
  { regex: /₹\s*[0-9,]+|\$\s*[0-9,]+/, category: 'HARDCODED_CURRENCY' },
  { regex: /['"](?:Operational|Verified|Certified|Connected)['"]/, category: 'HARDCODED_STATUS_BADGE' }
];

function checkHardcoded(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === 'dist' || f.name === '__tests__') continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) checkHardcoded(p);
    else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      const rel = path.relative(process.cwd(), p).replace(/\\/g, '/');

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
        patterns.forEach(({ regex, category }) => {
          if (regex.test(trimmed)) {
            hardcoded.push({
              file_line: `${rel}:${idx + 1}`,
              category,
              snippet: trimmed.substring(0, 120)
            });
          }
        });
      });
    }
  }
}

checkHardcoded('frontend/src');
checkHardcoded('backend/src');

// Write hardcoded_data.csv
let hcCsv = 'file_line,category,snippet\n';
hardcoded.forEach(h => {
  hcCsv += `"${h.file_line}","${h.category}","${h.snippet.replace(/"/g, '""')}"\n`;
});
fs.writeFileSync('AUDIT/raw/hardcoded_data.csv', hcCsv, 'utf8');

// Report
let feReport = '# Frontend Architecture & State Management\n\n';
feReport += `## Total Frontend Routes: ${routes.length}\n`;
feReport += `## Routes with No Guard: ${routes.filter(r => r.guard === 'None').length}\n`;
feReport += `## Client-Side Guarded Routes: ${routes.filter(r => r.guard.includes('Client-side')).length}\n\n`;

feReport += `## Storage Usage (localStorage / sessionStorage): ${storageUsages.length}\n`;
storageUsages.forEach(su => {
  feReport += `- \`${su.file_line}\`: \`${su.code}\`\n`;
});
feReport += '\n';

feReport += `## Hard-coded / Fake Data Occurrences: ${hardcoded.length}\n`;
const catCounts = {};
hardcoded.forEach(h => { catCounts[h.category] = (catCounts[h.category] || 0) + 1; });
for (const [c, cnt] of Object.entries(catCounts)) {
  feReport += `- ${c}: ${cnt}\n`;
}

fs.writeFileSync('AUDIT/raw/05_frontend_summary.txt', feReport, 'utf8');
console.log('Frontend analysis complete. Routes:', routes.length, 'Storage usages:', storageUsages.length, 'Hardcoded entries:', hardcoded.length);
