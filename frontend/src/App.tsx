import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { ROLES, UserRole } from '@jobconnect/shared';

// Public Pages (Code-split on demand)
const HomePage = lazy(() => import('./pages/HomePage.js').then((m) => ({ default: m.HomePage })));
const JobsPage = lazy(() => import('./pages/JobsPage.js').then((m) => ({ default: m.JobsPage })));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage.js').then((m) => ({ default: m.JobDetailPage })));
const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage.js').then((m) => ({ default: m.VerifyOtpPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.js').then((m) => ({ default: m.ForgotPasswordPage })));

// Candidate Pages (Code-split on demand)
const CandidateDashboardPage = lazy(() => import('./pages/CandidateDashboardPage.js').then((m) => ({ default: m.CandidateDashboardPage })));
const CandidateProfilePage = lazy(() => import('./pages/CandidateProfilePage.js').then((m) => ({ default: m.CandidateProfilePage })));
const CandidateApplicationsPage = lazy(() => import('./pages/CandidateApplicationsPage.js').then((m) => ({ default: m.CandidateApplicationsPage })));
const CandidateSavedJobsPage = lazy(() => import('./pages/CandidateSavedJobsPage.js').then((m) => ({ default: m.CandidateSavedJobsPage })));
const CandidateAIAssistantPage = lazy(() => import('./pages/CandidateAIAssistantPage.js').then((m) => ({ default: m.CandidateAIAssistantPage })));

// Recruiter Pages (Code-split on demand)
const RecruiterDashboardPage = lazy(() => import('./pages/RecruiterDashboardPage.js').then((m) => ({ default: m.RecruiterDashboardPage })));
const RecruiterProfilePage = lazy(() => import('./pages/RecruiterProfilePage.js').then((m) => ({ default: m.RecruiterProfilePage })));
const RecruiterJobsPage = lazy(() => import('./pages/RecruiterJobsPage.js').then((m) => ({ default: m.RecruiterJobsPage })));
const RecruiterJobCreatePage = lazy(() => import('./pages/RecruiterJobCreatePage.js').then((m) => ({ default: m.RecruiterJobCreatePage })));
const RecruiterJobApplicantsPage = lazy(() => import('./pages/RecruiterJobApplicantsPage.js').then((m) => ({ default: m.RecruiterJobApplicantsPage })));

// Admin Pages & Layout (Code-split on demand)
const AdminLayout = lazy(() => import('./components/admin/layout/AdminLayout.js').then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.js').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.js').then((m) => ({ default: m.AdminUsersPage })));
const AdminJobsPage = lazy(() => import('./pages/AdminJobsPage.js').then((m) => ({ default: m.AdminJobsPage })));
const AdminApplicationsPage = lazy(() => import('./pages/AdminApplicationsPage.js').then((m) => ({ default: m.AdminApplicationsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage.js').then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminProfilePage = lazy(() => import('./pages/AdminProfilePage.js').then((m) => ({ default: m.AdminProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoadingFallback: React.FC = () => (
  <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
    <LoadingSpinner message="Loading workspace view..." />
  </div>
);

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-xs text-slate-500">
        Verifying security credentials...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  {/* Public routes */}
                  <Route index element={<HomePage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="jobs/:id" element={<JobDetailPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="verify-otp" element={<VerifyOtpPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />

                  {/* Candidate routes */}
                  <Route
                    path="candidate/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                        <CandidateDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="candidate/profile"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                        <CandidateProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="candidate/applications"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                        <CandidateApplicationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="candidate/saved-jobs"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                        <CandidateSavedJobsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="candidate/ai-assistant"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
                        <CandidateAIAssistantPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Recruiter routes */}
                  <Route
                    path="recruiter/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.RECRUITER]}>
                        <RecruiterDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="recruiter/profile"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.RECRUITER, ROLES.ADMIN]}>
                        <RecruiterProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="recruiter/jobs"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.RECRUITER]}>
                        <RecruiterJobsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="recruiter/jobs/create"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.RECRUITER, ROLES.ADMIN]}>
                        <RecruiterJobCreatePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="recruiter/jobs/:jobId/applicants"
                    element={
                      <ProtectedRoute allowedRoles={[ROLES.RECRUITER, ROLES.ADMIN]}>
                        <RecruiterJobApplicantsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Dedicated Admin Portal Layout */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="jobs" element={<AdminJobsPage />} />
                  <Route path="applications" element={<AdminApplicationsPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                  <Route path="profile" element={<AdminProfilePage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
};
