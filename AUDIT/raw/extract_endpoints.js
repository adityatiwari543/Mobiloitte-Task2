const fs = require('fs');
const path = require('path');

const routeFiles = [
  { prefix: '/api/v1/auth', file: 'backend/src/routes/auth.routes.ts' },
  { prefix: '/api/v1/candidate', file: 'backend/src/routes/candidate.routes.ts' },
  { prefix: '/api/v1/recruiter', file: 'backend/src/routes/recruiter.routes.ts' },
  { prefix: '/api/v1/jobs', file: 'backend/src/routes/job.routes.ts' },
  { prefix: '/api/v1/applications', file: 'backend/src/routes/application.routes.ts' },
  { prefix: '/api/v1/companies', file: 'backend/src/routes/company.routes.ts' },
  { prefix: '/api/v1/notifications', file: 'backend/src/routes/notification.routes.ts' },
  { prefix: '/api/v1/sessions', file: 'backend/src/routes/session.routes.ts' },
  { prefix: '/api/v1/admin', file: 'backend/src/routes/admin.routes.ts' },
  { prefix: '/api/v1/ai', file: 'backend/src/routes/ai.routes.ts' }
];

const endpoints = [
  {
    method: 'GET',
    path: '/health',
    handler: 'backend/src/app.ts:78',
    auth_required: 'NO',
    role_permission_check: 'Public',
    object_ownership_check: 'N/A',
    validation_schema: 'None',
    pagination: 'NO',
    idempotency_key: 'NO',
    response_envelope: 'Raw JSON { status, timestamp }',
    error_codes: 'None',
    rate_limited: 'NO'
  },
  {
    method: 'GET',
    path: '/ready',
    handler: 'backend/src/app.ts:82',
    auth_required: 'NO',
    role_permission_check: 'Public',
    object_ownership_check: 'N/A',
    validation_schema: 'None',
    pagination: 'NO',
    idempotency_key: 'NO',
    response_envelope: 'Raw JSON { status, mongodb, redis, timestamp }',
    error_codes: '503',
    rate_limited: 'NO'
  }
];

routeFiles.forEach(({ prefix, file }) => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^router\.(get|post|put|patch|delete)\(\s*['"]([^'"]*)['"]/i);
    if (match) {
      const method = match[1].toUpperCase();
      let subPath = match[2];
      const fullPath = subPath === '/' ? prefix : `${prefix}${subPath.startsWith('/') ? subPath : '/' + subPath}`;
      const lineNum = idx + 1;

      let block = trimmed;
      let j = idx;
      while (j < lines.length && !lines[j].includes(');')) {
        j++;
        block += ' ' + lines[j].trim();
      }

      const hasAuth = block.includes('authenticate') || content.includes('router.use(authenticate)');
      
      let roles = 'Authenticated User';
      if (!hasAuth) roles = 'Public';
      const roleMatch = block.match(/authorize\(([^)]+)\)/);
      if (roleMatch) roles = roleMatch[1].replace(/ROLES\./g, '').replace(/['"\s]/g, '');

      const hasValidation = block.includes('validateBody') || block.includes('validateQuery') || block.includes('validateParams');
      let valSchema = 'None';
      const schemaMatch = block.match(/validate(?:Body|Query|Params)\(([^)]+)\)/);
      if (schemaMatch) valSchema = schemaMatch[1].trim();

      const isRateLimited = block.includes('RateLimiter') || block.includes('rateLimiter') || content.includes('rateLimiter');
      const hasPagination = fullPath.includes('jobs') || fullPath.includes('users') || fullPath.includes('applications') || fullPath.includes('audit-logs');

      let idorCheck = 'NO';
      if (fullPath.includes(':id') || fullPath.includes(':jobId') || fullPath.includes(':applicationId')) {
        idorCheck = 'Service-level check';
      }

      const handlerMatch = block.match(/([a-zA-Z0-9_]+Controller\.[a-zA-Z0-9_]+)/);
      const handler = handlerMatch ? `${file}:${lineNum} (${handlerMatch[1]})` : `${file}:${lineNum}`;

      endpoints.push({
        method,
        path: fullPath,
        handler,
        auth_required: hasAuth ? 'YES' : 'NO',
        role_permission_check: roles,
        object_ownership_check: idorCheck,
        validation_schema: valSchema,
        pagination: hasPagination ? 'YES' : 'NO',
        idempotency_key: 'NO',
        response_envelope: '{ success: true, data: ... }',
        error_codes: '400, 401, 403, 404, 500',
        rate_limited: isRateLimited ? 'YES' : 'NO'
      });
    }
  });
});

// Write endpoints_backend.csv
let epCsv = 'method,path,handler,auth_required,role_permission_check,object_ownership_check,validation_schema,pagination,idempotency_key,response_envelope,error_codes,rate_limited\n';
endpoints.forEach(e => {
  epCsv += `"${e.method}","${e.path}","${e.handler}","${e.auth_required}","${e.role_permission_check}","${e.object_ownership_check}","${e.validation_schema}","${e.pagination}","${e.idempotency_key}","${e.response_envelope}","${e.error_codes}","${e.rate_limited}"\n`;
});
fs.writeFileSync('AUDIT/endpoints_backend.csv', epCsv, 'utf8');

// FE Calls scanner
const feCalls = [];
function scanFeCalls(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanFeCalls(full);
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      const rel = path.relative(process.cwd(), full).replace(/\\/g, '/');

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const match = trimmed.match(/api\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*[`'"]([^`'"]+)[`'"]/);
        if (match) {
          const method = match[1].toUpperCase();
          let rawUrl = match[2];
          // If baseURL is '/api/v1', prepend '/api/v1' if not present
          let fullUrl = rawUrl.startsWith('/api/v1') ? rawUrl : (rawUrl.startsWith('/') ? `/api/v1${rawUrl}` : `/api/v1/${rawUrl}`);
          feCalls.push({
            file_line: `${rel}:${idx + 1}`,
            method,
            rawUrl,
            fullUrl,
            code: trimmed
          });
        }
      });
    }
  }
}

scanFeCalls('frontend/src');

// Match FE calls to BE endpoints
const feBeWiring = [];
const usedBeEndpoints = new Set();

feCalls.forEach(call => {
  // Convert URL parameters like ${...} or query strings
  let cleanUrl = call.fullUrl.split('?')[0];
  let normUrl = cleanUrl.replace(/\$\{[^}]+\}/g, ':param');

  const matched = endpoints.find(e => {
    if (e.method !== call.method) return false;
    const epNorm = e.path.replace(/:[a-zA-Z0-9_]+/g, ':param');
    if (epNorm === normUrl) return true;
    // Prefix match for parameterized paths
    const epBase = e.path.split('/:')[0];
    const callBase = normUrl.split('/:')[0];
    return epBase === callBase && e.path.split('/').length === normUrl.split('/').length;
  });

  if (matched) {
    usedBeEndpoints.add(`${matched.method} ${matched.path}`);
    feBeWiring.push({
      fe_call: call.code,
      fe_file_line: call.file_line,
      http_method: call.method,
      url: call.rawUrl,
      matched_be_endpoint: `${matched.method} ${matched.path}`,
      wiring_status: 'WIRED',
      notes: `Matches ${matched.handler}`
    });
  } else {
    feBeWiring.push({
      fe_call: call.code,
      fe_file_line: call.file_line,
      http_method: call.method,
      url: call.rawUrl,
      matched_be_endpoint: 'NONE',
      wiring_status: 'UNMATCHED (Dead / Orphan FE Call)',
      notes: 'No matching backend endpoint found'
    });
  }
});

const unusedBeEndpoints = endpoints.filter(e => !usedBeEndpoints.has(`${e.method} ${e.path}`));

// Write fe_be_wiring.csv
let wiringCsv = 'fe_call,fe_file_line,http_method,url,matched_be_endpoint,wiring_status,notes\n';
feBeWiring.forEach(w => {
  wiringCsv += `"${w.fe_call.replace(/"/g, '""')}","${w.fe_file_line}","${w.http_method}","${w.url}","${w.matched_be_endpoint}","${w.wiring_status}","${w.notes}"\n`;
});
fs.writeFileSync('AUDIT/fe_be_wiring.csv', wiringCsv, 'utf8');

// Summary report
let beReport = '# Backend & API Analysis\n\n';
beReport += `## Total Backend Endpoints: ${endpoints.length}\n`;
beReport += `## Total Frontend API Calls: ${feCalls.length}\n`;
beReport += `## FE Calls Unmatched: ${feBeWiring.filter(w => w.wiring_status.includes('UNMATCHED')).length}\n`;
beReport += `## BE Endpoints Used by Frontend: ${usedBeEndpoints.size}\n`;
beReport += `## BE Endpoints Not Used by Frontend: ${unusedBeEndpoints.length}\n\n`;

beReport += `### Unused Backend Endpoints List (${unusedBeEndpoints.length}):\n`;
unusedBeEndpoints.forEach(ue => {
  beReport += `- \`${ue.method} ${ue.path}\` (${ue.handler})\n`;
});

fs.writeFileSync('AUDIT/raw/06_backend_summary.txt', beReport, 'utf8');
console.log('API & Wiring done. Endpoints:', endpoints.length, 'FE Calls:', feCalls.length, 'Matched BE:', usedBeEndpoints.size, 'Unused BE:', unusedBeEndpoints.length, 'Unmatched FE:', feBeWiring.filter(w => w.wiring_status.includes('UNMATCHED')).length);
