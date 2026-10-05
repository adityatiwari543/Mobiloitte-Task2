const fs = require('fs');
const path = require('path');

const pageCalls = {
  'HomePage': ['GET /api/v1/jobs (featured/recent)'],
  'JobsPage': ['GET /api/v1/jobs'],
  'JobDetailPage': ['GET /api/v1/jobs/:id'],
  'LoginPage': ['None on load'],
  'RegisterPage': ['None on load'],
  'VerifyOtpPage': ['None on load'],
  'ForgotPasswordPage': ['None on load'],
  'CandidateDashboardPage': ['GET /api/v1/candidate/profile', 'GET /api/v1/applications/my-applications'],
  'CandidateProfilePage': ['GET /api/v1/candidate/profile'],
  'CandidateApplicationsPage': ['GET /api/v1/applications/my-applications'],
  'CandidateSavedJobsPage': ['GET /api/v1/jobs/saved'],
  'CandidateAIAssistantPage': ['GET /api/v1/candidate/profile', 'GET /api/v1/jobs'],
  'RecruiterDashboardPage': ['GET /api/v1/recruiter/dashboard', 'GET /api/v1/recruiter/jobs'],
  'RecruiterProfilePage': ['GET /api/v1/recruiter/profile', 'GET /api/v1/companies/my-company'],
  'RecruiterJobsPage': ['GET /api/v1/recruiter/jobs'],
  'RecruiterJobCreatePage': ['GET /api/v1/companies/my-company'],
  'RecruiterJobApplicantsPage': ['GET /api/v1/recruiter/jobs/:jobId/applicants'],
  'AdminDashboardPage': ['GET /api/v1/admin/dashboard'],
  'AdminUsersPage': ['GET /api/v1/admin/users'],
  'AdminJobsPage': ['GET /api/v1/admin/jobs'],
  'AdminApplicationsPage': ['GET /api/v1/admin/applications'],
  'AdminAuditLogsPage': ['GET /api/v1/admin/audit-logs'],
  'AdminProfilePage': ['GET /api/v1/auth/me'],
  'AdminLayout': ['GET /api/v1/admin/dashboard']
};

const routeDefinitions = [
  { path: '/', component: 'HomePage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['HomePage'] },
  { path: '/jobs', component: 'JobsPage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['JobsPage'] },
  { path: '/jobs/:id', component: 'JobDetailPage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['JobDetailPage'] },
  { path: '/login', component: 'LoginPage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['LoginPage'] },
  { path: '/register', component: 'RegisterPage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['RegisterPage'] },
  { path: '/verify-otp', component: 'VerifyOtpPage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['VerifyOtpPage'] },
  { path: '/forgot-password', component: 'ForgotPasswordPage', lazy: 'NO', guard: 'None (Public)', roles: 'Public', calls: pageCalls['ForgotPasswordPage'] },
  { path: '/candidate/dashboard', component: 'CandidateDashboardPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'candidate', calls: pageCalls['CandidateDashboardPage'] },
  { path: '/candidate/profile', component: 'CandidateProfilePage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'candidate', calls: pageCalls['CandidateProfilePage'] },
  { path: '/candidate/applications', component: 'CandidateApplicationsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'candidate', calls: pageCalls['CandidateApplicationsPage'] },
  { path: '/candidate/saved-jobs', component: 'CandidateSavedJobsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'candidate', calls: pageCalls['CandidateSavedJobsPage'] },
  { path: '/candidate/ai-assistant', component: 'CandidateAIAssistantPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'candidate', calls: pageCalls['CandidateAIAssistantPage'] },
  { path: '/recruiter/dashboard', component: 'RecruiterDashboardPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'recruiter', calls: pageCalls['RecruiterDashboardPage'] },
  { path: '/recruiter/profile', component: 'RecruiterProfilePage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'recruiter,admin', calls: pageCalls['RecruiterProfilePage'] },
  { path: '/recruiter/jobs', component: 'RecruiterJobsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'recruiter', calls: pageCalls['RecruiterJobsPage'] },
  { path: '/recruiter/jobs/create', component: 'RecruiterJobCreatePage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'recruiter,admin', calls: pageCalls['RecruiterJobCreatePage'] },
  { path: '/recruiter/jobs/:jobId/applicants', component: 'RecruiterJobApplicantsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'recruiter,admin', calls: pageCalls['RecruiterJobApplicantsPage'] },
  { path: '/admin', component: 'Navigate to /admin/dashboard', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: [] },
  { path: '/admin/dashboard', component: 'AdminDashboardPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: pageCalls['AdminDashboardPage'] },
  { path: '/admin/users', component: 'AdminUsersPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: pageCalls['AdminUsersPage'] },
  { path: '/admin/jobs', component: 'AdminJobsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: pageCalls['AdminJobsPage'] },
  { path: '/admin/applications', component: 'AdminApplicationsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: pageCalls['AdminApplicationsPage'] },
  { path: '/admin/audit-logs', component: 'AdminAuditLogsPage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: pageCalls['AdminAuditLogsPage'] },
  { path: '/admin/profile', component: 'AdminProfilePage', lazy: 'NO', guard: 'ProtectedRoute (Client-only)', roles: 'admin', calls: pageCalls['AdminProfilePage'] }
];

let csv = 'path,component,lazy_loaded,guard,roles_allowed,api_calls_on_load\n';
routeDefinitions.forEach(r => {
  csv += `"${r.path}","${r.component}","${r.lazy}","${r.guard}","${r.roles}","${r.calls.join('; ')}"\n`;
});
fs.writeFileSync('AUDIT/routes_frontend.csv', csv, 'utf8');
console.log('Saved AUDIT/routes_frontend.csv with', routeDefinitions.length, 'routes.');
