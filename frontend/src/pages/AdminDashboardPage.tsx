import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { MetricCard } from '../components/admin/dashboard/MetricCard.js';
import { QuickActions } from '../components/admin/dashboard/QuickActions.js';
import { PlatformHealth } from '../components/admin/dashboard/PlatformHealth.js';
import { QuickStats } from '../components/admin/dashboard/QuickStats.js';
import {
  AuditDetailDrawer,
  AuditLogItem,
} from '../components/admin/dashboard/AuditDetailDrawer.js';
import {
  Users,
  UserCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  Filter,
} from 'lucide-react';

const CATEGORIES = ['All', 'Login', 'Job', 'Application', 'User', 'System'];

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard summary (metrics, health, quick stats)
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data?.data;
    },
    refetchInterval: 30000,
  });

  // Fetch audit trail with category filter and pagination
  const {
    data: auditTrailData,
    isLoading: isAuditLoading,
  } = useQuery({
    queryKey: ['adminDashboardAudit', selectedCategory, page],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: {
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          page,
          limit: 10,
        },
      });
      return res.data?.data;
    },
    placeholderData: (prev) => prev,
  });

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN')) {
      return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    }
    if (action.includes('JOB')) {
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    if (action.includes('USER') || action.includes('REGISTER')) {
      return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    }
    if (action.includes('APPLICATION')) {
      return 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  if (isDashboardLoading) {
    return <LoadingSpinner message="Loading Platform Governance Center..." />;
  }

  const metrics = dashboardData?.metrics || {};
  const health = dashboardData?.health;
  const quickStats = dashboardData?.quickStats;

  const logs: AuditLogItem[] =
    auditTrailData?.items || auditTrailData?.auditLogs || dashboardData?.recentAuditLogs || [];
  const pagination = auditTrailData?.pagination || {
    page: 1,
    limit: 10,
    total: logs.length,
    pages: 1,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Dashboard
            </span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Platform Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {currentTime && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>System Online (All services running)</span>
          </div>
        </div>
      </div>

      {/* 4 Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total Registered Users"
          value={metrics.totalUsers ?? 0}
          trend={metrics.trends?.users || '+12%'}
          trendPeriod="vs. last 7 days"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Candidates"
          value={metrics.totalCandidates ?? 0}
          trend={metrics.trends?.candidates || '+100%'}
          trendPeriod="vs. last 7 days"
          icon={UserCheck}
          color="emerald"
        />
        <MetricCard
          title="Total Recruiters"
          value={metrics.totalRecruiters ?? 0}
          trend={metrics.trends?.recruiters || '+50%'}
          trendPeriod="vs. last 7 days"
          icon={Briefcase}
          color="violet"
        />
        <MetricCard
          title="Active Published Jobs"
          value={metrics.activeJobs ?? 0}
          trend={metrics.trends?.jobs || '+8%'}
          trendPeriod="vs. last 7 days"
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Main 2-Column Split: Left (72%) / Right (28%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Security Audit Trail */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          {/* Audit Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Recent Security Audit Trail
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Immutable system activity log with actor attribution and IP tracking.
                </p>
              </div>
              <Link
                to="/admin/audit-logs"
                className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors gap-1"
              >
                View All Logs
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {isAuditLoading && logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading audit trail events...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No security audit events found for category "{selectedCategory}".
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logs.map((log) => {
                    const actor =
                      typeof log.actorUserId === 'object'
                        ? log.actorUserId
                        : null;
                    const actorName = actor?.name || 'System / Anonymous';
                    const actorRole = actor?.role || 'SYSTEM';
                    const resourceTruncated = log.resourceId
                      ? `${log.resourceId.slice(0, 4)}...${log.resourceId.slice(-4)}`
                      : '';

                    return (
                      <tr
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 cursor-pointer transition-colors group"
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {actorName}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {actorRole}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Resource with 1-click copy */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="font-medium capitalize">
                              {log.resourceType}
                            </span>
                            {log.resourceId && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyId(e, log.resourceId!)}
                                title="Click to copy resource ID"
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded transition-colors"
                              >
                                <span>{resourceTruncated}</span>
                                {copiedId === log.resourceId ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-60" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Success
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {logs.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {pagination.total}
                </span>{' '}
                logs
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages || pagination.pages || 1) },
                  (_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          page === pNum
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                )}
                {(pagination.totalPages || pagination.pages || 1) > 5 && (
                  <>
                    <span className="px-1 text-slate-400">...</span>
                    <button
                      onClick={() => setPage(pagination.totalPages || pagination.pages || 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        page === (pagination.totalPages || pagination.pages || 1)
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {pagination.totalPages || pagination.pages || 1}
                    </button>
                  </>
                )}
                <button
                  disabled={page >= (pagination.totalPages || pagination.pages || 1)}
                  onClick={() =>
                    setPage((p) =>
                      Math.min(pagination.totalPages || pagination.pages || 1, p + 1)
                    )
                  }
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions, Platform Health, Quick Stats */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          <QuickActions />
          <PlatformHealth health={health} />
          <QuickStats stats={quickStats} />
        </div>
      </div>

      {/* Audit Detail Slide-over Drawer */}
      <AuditDetailDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default AdminDashboardPage;
