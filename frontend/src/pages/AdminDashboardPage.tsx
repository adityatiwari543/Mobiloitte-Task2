import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { Shield, Users, Briefcase, FileCheck, AlertTriangle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data?.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading platform metrics & security audits..." />;
  }

  const metrics = data?.metrics || {};
  const recentAuditLogs = data?.recentAuditLogs || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Governance & Security Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monitor system vitality, moderate users and jobs, and inspect immutable audit logs</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Registered Users</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{metrics.totalUsers || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Candidates</p>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{metrics.totalCandidates || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Recruiters</p>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{metrics.totalRecruiters || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Active Published Jobs</p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.activeJobs || 0}</p>
        </div>
      </div>

      {/* Audit Log Table (Section 7.10, 29) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Security Audit Trail</h2>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            View All Audit Logs →
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No security audit events recorded yet.</p>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentAuditLogs.map((log: any) => (
                <tr key={log._id}>
                  <td className="py-3 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {log.actorUserId?.name || 'System / Anonymous'}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="blue">{log.action}</Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {log.resourceType} {log.resourceId ? `(${log.resourceId})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
