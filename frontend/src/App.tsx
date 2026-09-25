import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Public Pages
import { HomePage } from './pages/HomePage.js';
import { JobsPage } from './pages/JobsPage.js';
import { JobDetailPage } from './pages/JobDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { VerifyOtpPage } from './pages/VerifyOtpPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';

// Candidate Pages
import { CandidateDashboardPage } from './pages/CandidateDashboardPage.js';
import { CandidateProfilePage } from './pages/CandidateProfilePage.js';
import { CandidateApplicationsPage } from './pages/CandidateApplicationsPage.js';
import { CandidateSavedJobsPage } from './pages/CandidateSavedJobsPage.js';
import { CandidateAIAssistantPage } from './pages/CandidateAIAssistantPage.js';

// Recruiter Pages
import { RecruiterDashboardPage } from './pages/RecruiterDashboardPage.js';
import { RecruiterProfilePage } from './pages/RecruiterProfilePage.js';
import { RecruiterJobsPage } from './pages/RecruiterJobsPage.js';
import { RecruiterJobCreatePage } from './pages/RecruiterJobCreatePage.js';
import { RecruiterJobApplicantsPage } from './pages/RecruiterJobApplicantsPage.js';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { AdminUsersPage } from './pages/AdminUsersPage.js';
import { AdminJobsPage } from './pages/AdminJobsPage.js';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage.js';
import { AdminProfilePage } from './pages/AdminProfilePage.js';

import { ROLES, UserRole } from '@jobconnect/shared';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
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

                {/* Admin routes */}
                <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/jobs"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminJobsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminAuditLogsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/profile"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
