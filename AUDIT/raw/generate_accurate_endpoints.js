const fs = require('fs');
const path = require('path');

const endpoints = [
  // app.ts
  { method: 'GET', path: '/health', handler: 'backend/src/app.ts:78', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ status, timestamp }', err: 'None', rate: 'NO' },
  { method: 'GET', path: '/ready', handler: 'backend/src/app.ts:82', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ status, mongodb, redis, timestamp }', err: '503', rate: 'NO' },

  // auth.routes.ts
  { method: 'POST', path: '/api/v1/auth/register', handler: 'backend/src/routes/auth.routes.ts:21', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'RegisterSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 409', rate: 'YES (authRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/verify-otp', handler: 'backend/src/routes/auth.routes.ts:22', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'VerifyOtpSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 429', rate: 'YES (otpRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/resend-otp', handler: 'backend/src/routes/auth.routes.ts:23', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'ResendOtpSchema', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '400, 429', rate: 'YES (otpRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/login', handler: 'backend/src/routes/auth.routes.ts:24', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'LoginSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'YES (authRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/refresh', handler: 'backend/src/routes/auth.routes.ts:25', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'None (Cookie)', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401', rate: 'NO' },
  { method: 'POST', path: '/api/v1/auth/forgot-password', handler: 'backend/src/routes/auth.routes.ts:28', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'ForgotPasswordSchema', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '400, 404', rate: 'YES (authRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/verify-reset-otp', handler: 'backend/src/routes/auth.routes.ts:34', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'VerifyResetOtpSchema', pag: 'NO', idemp: 'NO', env: '{ success, resetToken }', err: '400, 429', rate: 'YES (otpRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/reset-password', handler: 'backend/src/routes/auth.routes.ts:40', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'ResetPasswordSchema', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '400, 401', rate: 'YES (authRateLimiter)' },
  { method: 'POST', path: '/api/v1/auth/logout', handler: 'backend/src/routes/auth.routes.ts:47', auth: 'YES', roles: 'Authenticated', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401', rate: 'NO' },
  { method: 'GET', path: '/api/v1/auth/me', handler: 'backend/src/routes/auth.routes.ts:48', auth: 'YES', roles: 'Authenticated', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401', rate: 'NO' },
  { method: 'POST', path: '/api/v1/auth/change-password', handler: 'backend/src/routes/auth.routes.ts:50', auth: 'YES', roles: 'Authenticated', idor: 'N/A', val: 'ChangePasswordSchema', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '400, 401', rate: 'NO' },
  { method: 'POST', path: '/api/v1/auth/avatar', handler: 'backend/src/routes/auth.routes.ts:55', auth: 'YES', roles: 'Authenticated', idor: 'N/A', val: 'Multipart/form-data', pag: 'NO', idemp: 'NO', env: '{ success, avatarUrl }', err: '400, 401', rate: 'NO' },
  { method: 'DELETE', path: '/api/v1/auth/avatar', handler: 'backend/src/routes/auth.routes.ts:56', auth: 'YES', roles: 'Authenticated', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401', rate: 'NO' },

  // candidate.routes.ts
  { method: 'GET', path: '/api/v1/candidate/profile', handler: 'backend/src/routes/candidate.routes.ts:13', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403, 404', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/candidate/profile', handler: 'backend/src/routes/candidate.routes.ts:14', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'UpdateProfileSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },
  { method: 'POST', path: '/api/v1/candidate/resume', handler: 'backend/src/routes/candidate.routes.ts:15', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'Multipart/form-data', pag: 'NO', idemp: 'NO', env: '{ success, resumeUrl }', err: '400, 401', rate: 'NO' },
  { method: 'DELETE', path: '/api/v1/candidate/resume', handler: 'backend/src/routes/candidate.routes.ts:16', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/candidate/dashboard', handler: 'backend/src/routes/candidate.routes.ts:17', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },

  // recruiter.routes.ts
  { method: 'GET', path: '/api/v1/recruiter/profile', handler: 'backend/src/routes/recruiter.routes.ts:12', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/recruiter/profile', handler: 'backend/src/routes/recruiter.routes.ts:13', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Scoped to req.user.userId)', val: 'UpdateRecruiterProfileSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },

  // job.routes.ts
  { method: 'GET', path: '/api/v1/jobs', handler: 'backend/src/routes/job.routes.ts:15', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'JobFilterQuerySchema', pag: 'YES', idemp: 'NO', env: '{ success, data, pagination }', err: '400, 500', rate: 'NO' },
  { method: 'GET', path: '/api/v1/jobs/saved/all', handler: 'backend/src/routes/job.routes.ts:19', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/jobs/:id', handler: 'backend/src/routes/job.routes.ts:16', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '404', rate: 'NO' },
  { method: 'POST', path: '/api/v1/jobs/:id/save', handler: 'backend/src/routes/job.routes.ts:20', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401, 404', rate: 'NO' },
  { method: 'DELETE', path: '/api/v1/jobs/:id/save', handler: 'backend/src/routes/job.routes.ts:21', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401, 404', rate: 'NO' },
  { method: 'POST', path: '/api/v1/jobs', handler: 'backend/src/routes/job.routes.ts:24', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (recruiterId set from req.user)', val: 'CreateJobSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/jobs/:id', handler: 'backend/src/routes/job.routes.ts:31', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verified job.recruiterId === userId)', val: 'UpdateJobSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403, 404', rate: 'NO' },
  { method: 'POST', path: '/api/v1/jobs/:id/publish', handler: 'backend/src/routes/job.routes.ts:39', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verified job.recruiterId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403, 404', rate: 'NO' },
  { method: 'POST', path: '/api/v1/jobs/:id/pause', handler: 'backend/src/routes/job.routes.ts:45', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verified job.recruiterId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403, 404', rate: 'NO' },
  { method: 'POST', path: '/api/v1/jobs/:id/close', handler: 'backend/src/routes/job.routes.ts:51', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verified job.recruiterId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403, 404', rate: 'NO' },
  { method: 'DELETE', path: '/api/v1/jobs/:id', handler: 'backend/src/routes/job.routes.ts:56', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verified job.recruiterId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401, 403, 404', rate: 'NO' },

  // application.routes.ts
  { method: 'POST', path: '/api/v1/applications/jobs/:jobId/apply', handler: 'backend/src/routes/application.routes.ts:17', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (candidateId set to req.user.userId)', val: 'ApplyJobSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 404, 409', rate: 'NO' },
  { method: 'GET', path: '/api/v1/applications/me', handler: 'backend/src/routes/application.routes.ts:23', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Scoped to candidateId: req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/applications/:id/withdraw', handler: 'backend/src/routes/application.routes.ts:24', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Verifies candidateId === req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403, 404', rate: 'NO' },
  { method: 'GET', path: '/api/v1/applications/jobs/:jobId/applicants', handler: 'backend/src/routes/application.routes.ts:31', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verifies job.recruiterId === userId)', val: 'None', pag: 'YES', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/applications/:id/status', handler: 'backend/src/routes/application.routes.ts:36', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verifies job.recruiterId === userId)', val: 'UpdateApplicationStatusSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403, 404', rate: 'NO' },
  { method: 'GET', path: '/api/v1/applications/recruiter/applicants', handler: 'backend/src/routes/application.routes.ts:42', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Scoped to recruiter jobs)', val: 'None', pag: 'YES', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/applications/recruiter/interviews', handler: 'backend/src/routes/application.routes.ts:47', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Scoped to recruiter interviews)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'POST', path: '/api/v1/applications/interviews', handler: 'backend/src/routes/application.routes.ts:52', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verifies application recruiter ownership)', val: 'ScheduleInterviewSchema', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/applications/:id', handler: 'backend/src/routes/application.routes.ts:60', auth: 'YES', roles: 'Authenticated', idor: 'YES (Verifies candidateId OR recruiterId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403, 404', rate: 'NO' },

  // company.routes.ts
  { method: 'GET', path: '/api/v1/companies/actions/dashboard', handler: 'backend/src/routes/company.routes.ts:14', auth: 'YES', roles: 'RECRUITER', idor: 'YES (Scoped to recruiterId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403 (BLOCKED BY SHADOW ROUTE)', rate: 'NO' },
  { method: 'GET', path: '/api/v1/companies/:id', handler: 'backend/src/routes/company.routes.ts:9', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '404', rate: 'NO' },
  { method: 'POST', path: '/api/v1/companies', handler: 'backend/src/routes/company.routes.ts:12', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Sets recruiterId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/companies/:id', handler: 'backend/src/routes/company.routes.ts:13', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'YES (Verifies company.recruiterId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },

  // notification.routes.ts
  { method: 'GET', path: '/api/v1/notifications', handler: 'backend/src/routes/notification.routes.ts:9', auth: 'YES', roles: 'Authenticated', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/notifications/actions/read-all', handler: 'backend/src/routes/notification.routes.ts:11', auth: 'YES', roles: 'Authenticated', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/notifications/:id/read', handler: 'backend/src/routes/notification.routes.ts:10', auth: 'YES', roles: 'Authenticated', idor: 'YES (Verifies recipientId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 404', rate: 'NO' },

  // session.routes.ts
  { method: 'GET', path: '/api/v1/sessions', handler: 'backend/src/routes/session.routes.ts:9', auth: 'YES', roles: 'Authenticated', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401', rate: 'NO' },
  { method: 'DELETE', path: '/api/v1/sessions/actions/revoke-others', handler: 'backend/src/routes/session.routes.ts:11', auth: 'YES', roles: 'Authenticated', idor: 'YES (Scoped to req.user.userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401 (BLOCKED BY SHADOW ROUTE)', rate: 'NO' },
  { method: 'DELETE', path: '/api/v1/sessions/:sessionId', handler: 'backend/src/routes/session.routes.ts:10', auth: 'YES', roles: 'Authenticated', idor: 'YES (Verifies session.userId === userId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, message }', err: '401, 404', rate: 'NO' },

  // admin.routes.ts
  { method: 'GET', path: '/api/v1/admin/dashboard', handler: 'backend/src/routes/admin.routes.ts:12', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/admin/users', handler: 'backend/src/routes/admin.routes.ts:13', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'YES', idemp: 'NO', env: '{ success, data, pagination }', err: '401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/admin/users/:id/status', handler: 'backend/src/routes/admin.routes.ts:14', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403, 404', rate: 'NO' },
  { method: 'GET', path: '/api/v1/admin/jobs', handler: 'backend/src/routes/admin.routes.ts:15', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'YES', idemp: 'NO', env: '{ success, data, pagination }', err: '401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/admin/jobs/:id/moderate', handler: 'backend/src/routes/admin.routes.ts:16', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403, 404', rate: 'NO' },
  { method: 'GET', path: '/api/v1/admin/applications', handler: 'backend/src/routes/admin.routes.ts:17', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'YES', idemp: 'NO', env: '{ success, data, pagination }', err: '401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/admin/audit-logs', handler: 'backend/src/routes/admin.routes.ts:18', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'YES', idemp: 'NO', env: '{ success, data, pagination }', err: '401, 403', rate: 'NO' },
  { method: 'GET', path: '/api/v1/admin/profile', handler: 'backend/src/routes/admin.routes.ts:19', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '401, 403', rate: 'NO' },
  { method: 'PATCH', path: '/api/v1/admin/profile', handler: 'backend/src/routes/admin.routes.ts:20', auth: 'YES', roles: 'ADMIN', idor: 'N/A (Platform Admin)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'NO' },

  // ai.routes.ts
  { method: 'POST', path: '/api/v1/ai/job-summary', handler: 'backend/src/routes/ai.routes.ts:13', auth: 'NO', roles: 'Public', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 500', rate: 'YES (aiRateLimiter)' },
  { method: 'POST', path: '/api/v1/ai/match-score', handler: 'backend/src/routes/ai.routes.ts:15', auth: 'YES', roles: 'CANDIDATE', idor: 'YES (Candidate profile matched to jobId)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'YES (aiRateLimiter)' },
  { method: 'POST', path: '/api/v1/ai/generate-jd', handler: 'backend/src/routes/ai.routes.ts:22', auth: 'YES', roles: 'RECRUITER, ADMIN', idor: 'N/A', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 403', rate: 'YES (aiRateLimiter)' },
  { method: 'POST', path: '/api/v1/ai/chat', handler: 'backend/src/routes/ai.routes.ts:29', auth: 'YES', roles: 'Authenticated', idor: 'YES (Context grounded in user role)', val: 'None', pag: 'NO', idemp: 'NO', env: '{ success, data }', err: '400, 401, 500', rate: 'YES (aiRateLimiter)' }
];

// Write accurate endpoints_backend.csv
let epCsv = 'method,path,handler,auth_required,role_permission_check,object_ownership_check,validation_schema,pagination,idempotency_key,response_envelope,error_codes,rate_limited\n';
endpoints.forEach(e => {
  epCsv += `"${e.method}","${e.path}","${e.handler}","${e.auth}","${e.roles}","${e.idor}","${e.val}","${e.pag}","${e.idemp}","${e.env}","${e.err}","${e.rate}"\n`;
});
fs.writeFileSync('AUDIT/endpoints_backend.csv', epCsv, 'utf8');

// Now re-match FE calls
const rawFeWiring = fs.readFileSync('AUDIT/fe_be_wiring.csv', 'utf8');
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

function matchUrl(pattern, target) {
  // Strip real HTTP query string (only '?' outside of ${...})
  let inExpr = false;
  let qIndex = -1;
  for (let i = 0; i < target.length; i++) {
    if (target[i] === '$' && target[i + 1] === '{') inExpr = true;
    else if (inExpr && target[i] === '}') inExpr = false;
    else if (!inExpr && target[i] === '?') {
      qIndex = i;
      break;
    }
  }
  let cleanTarget = qIndex !== -1 ? target.slice(0, qIndex) : target;
  // Strip trailing query variables like ${q}
  cleanTarget = cleanTarget.replace(/\$\{q[^}]*\}$/, '');
  const normTarget = cleanTarget.replace(/\$\{[^}]+\}/g, ':param');
  const pParts = pattern.split('?')[0].split('/').filter(Boolean);
  const tParts = normTarget.split('?')[0].split('/').filter(Boolean);
  if (pParts.length !== tParts.length) return false;
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':') || tParts[i].startsWith(':')) continue;
    if (pParts[i] !== tParts[i]) return false;
  }
  return true;
}

const wiring = [];
const usedBe = new Set();

feCalls.forEach(call => {
  const matched = endpoints.find(e => {
    if (e.method !== call.method) return false;
    return matchUrl(e.path, call.fullUrl);
  });

  if (matched) {
    usedBe.add(`${matched.method} ${matched.path}`);
    wiring.push({
      fe_call: call.code,
      fe_file_line: call.file_line,
      http_method: call.method,
      url: call.rawUrl,
      matched_be_endpoint: `${matched.method} ${matched.path}`,
      wiring_status: 'WIRED',
      notes: `Matches ${matched.handler}`
    });
  } else {
    wiring.push({
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

let wCsv = 'fe_call,fe_file_line,http_method,url,matched_be_endpoint,wiring_status,notes\n';
wiring.forEach(w => {
  wCsv += `"${w.fe_call.replace(/"/g, '""')}","${w.fe_file_line}","${w.http_method}","${w.url}","${w.matched_be_endpoint}","${w.wiring_status}","${w.notes}"\n`;
});
fs.writeFileSync('AUDIT/fe_be_wiring.csv', wCsv, 'utf8');

const unused = endpoints.filter(e => !usedBe.has(`${e.method} ${e.path}`));

let beReport = '# Backend & API Analysis (Exhaustive)\n\n';
beReport += `## Total Backend Endpoints: ${endpoints.length}\n`;
beReport += `## Total Frontend API Calls: ${feCalls.length}\n`;
beReport += `## BE Endpoints Used by Frontend: ${usedBe.size}\n`;
beReport += `## BE Endpoints Not Used by Frontend: ${unused.length}\n`;
beReport += `## FE Calls Unmatched (404 risk / dead code): ${wiring.filter(w => w.wiring_status.includes('UNMATCHED')).length}\n\n`;

beReport += `### Unused Backend Endpoints List (${unused.length}):\n`;
unused.forEach(ue => {
  beReport += `- \`${ue.method} ${ue.path}\` (${ue.handler})\n`;
});

beReport += `\n### Unmatched Frontend Calls (${wiring.filter(w => w.wiring_status.includes('UNMATCHED')).length}):\n`;
wiring.filter(w => w.wiring_status.includes('UNMATCHED')).forEach(uw => {
  beReport += `- [${uw.fe_file_line}] \`${uw.http_method} ${uw.url}\`\n`;
});

fs.writeFileSync('AUDIT/raw/06_backend_summary.txt', beReport, 'utf8');
console.log('Complete! Total Endpoints:', endpoints.length, 'Used BE:', usedBe.size, 'Unused BE:', unused.length, 'Unmatched FE:', wiring.filter(w => w.wiring_status.includes('UNMATCHED')).length);
