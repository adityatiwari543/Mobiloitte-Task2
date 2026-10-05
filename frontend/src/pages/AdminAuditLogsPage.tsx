import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import {
  Clock,
  Shield,
  Briefcase,
  Mail,
  User,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Lock,
  Layers,
  FileText,
} from 'lucide-react';
import { AdminPageHeader } from '../components/admin/common/AdminPageHeader.js';
import { AdminFilterToolbar, ToolbarTab } from '../components/admin/common/AdminFilterToolbar.js';
import { AdminDataTable, ColumnDef } from '../components/admin/common/AdminDataTable.js';
import { StatusBadge } from '../components/admin/common/StatusBadge.js';
import { AdminPagination } from '../components/admin/common/AdminPagination.js';
import { AdminDetailDrawer } from '../components/admin/common/AdminDetailDrawer.js';

interface AuditLogItem {
  _id: string;
  actorUserId?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const AdminAuditLogsPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected log for detail drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch audit logs query with backend pagination
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminAuditLogs', activeCategory, debouncedSearch, page],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: {
          category: activeCategory === 'ALL' ? undefined : activeCategory,
          search: debouncedSearch || undefined,
          page,
          limit: pageSize,
        },
      });
      return res.data?.data;
    },
    placeholderData: (prev) => prev,
  });

  const logs: AuditLogItem[] = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    total: logs.length,
    totalPages: Math.ceil(logs.length / pageSize) || 1,
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setPage(1);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySanitizedJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(sanitizeMetadata(obj), null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const categories: ToolbarTab[] = [
    { id: 'ALL', label: 'All Events' },
    { id: 'AUTH', label: 'Auth & Access' },
    { id: 'USER', label: 'User Governance' },
    { id: 'JOB', label: 'Job Moderation' },
    { id: 'SYSTEM', label: 'System Activity' },
  ];

  const hasActiveFilters = Boolean(searchInput || activeCategory !== 'ALL');

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setActiveCategory('ALL');
    setPage(1);
  };

  // Redact sensitive secrets from any metadata object
  const sanitizeMetadata = (meta?: Record<string, any>): Record<string, any> => {
    if (!meta) return {};
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'hash', 'key', 'auth', 'bearer'];

    for (const [k, v] of Object.entries(meta)) {
      const lower = k.toLowerCase();
      if (sensitiveKeys.some((s) => lower.includes(s))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'string' && (v.includes('eyJ') || v.includes('Bearer '))) {
        sanitized[k] = 'Token-based';
      } else if (typeof v === 'object' && v !== null) {
        sanitized[k] = sanitizeMetadata(v);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  };

  // Helper getters
  const getActorName = (log: AuditLogItem) => {
    if (typeof log.actorUserId === 'object' && log.actorUserId?.name) {
      return log.actorUserId.name;
    }
    return 'System / Automation';
  };

  const getActorRole = (log: AuditLogItem) => {
    if (typeof log.actorUserId === 'object' && log.actorUserId?.role) {
      return log.actorUserId.role;
    }
    return 'SYSTEM';
  };

  const getActorEmail = (log: AuditLogItem) => {
    if (typeof log.actorUserId === 'object' && log.actorUserId?.email) {
      return log.actorUserId.email;
    }
    return 'system@internal';
  };

  // Format action badges
  const getActionColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('PUBLISH') || a.includes('ACTIVATE') || a.includes('SUCCESS')) {
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    if (a.includes('PAUSE') || a.includes('UPDATE') || a.includes('STATUS')) {
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    }
    if (a.includes('DELETE') || a.includes('SUSPEND') || a.includes('REJECT') || a.includes('FAIL')) {
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
    }
    if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('PASSWORD') || a.includes('SESSION')) {
      return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    }
    return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
  };

  // Table columns definition
  const columns: ColumnDef<AuditLogItem>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log) => (
        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {new Date(log.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-[10px] text-slate-400">
            {new Date(log.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Initiated By (Actor)',
      render: (log) => {
        const name = getActorName(log);
        const role = getActorRole(log);
        const email = getActorEmail(log);
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                {name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{email}</p>
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Action Performed',
      render: (log) => (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold tracking-tight border ${getActionColor(
            log.action
          )}`}
        >
          {log.action}
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Target Resource',
      render: (log) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {log.resourceType}
          </span>
          {log.resourceId && (
            <span className="font-mono text-[10px] text-slate-400 block">
              #{log.resourceId.slice(-8)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ip',
      header: 'Client IP & Status',
      render: (log) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {log.ipAddress || '127.0.0.1'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            OK
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (log) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setSelectedLog(log)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Inspect Audit Event"
            aria-label="View audit log details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Shared Page Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Audit Logs' },
        ]}
        title="Security & Operational Audit Logs"
        description="Immutable record of administrative actions, moderation events and security activity."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            <Lock className="w-3 h-3 text-purple-500" />
            Immutable Audit Trail
          </span>
        }
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Shared Filter Toolbar with Category Tabs */}
      <AdminFilterToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search audit events by action, actor, resource, or IP..."
        tabs={categories}
        activeTab={activeCategory}
        onTabChange={handleCategoryChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Shared Data Table with Server-Side Pagination */}
      <AdminDataTable
        columns={columns}
        data={logs}
        keyExtractor={(l) => l._id}
        isLoading={isLoading}
        error={error ? 'Failed to fetch audit log trail. Please try again.' : null}
        onRetry={() => refetch()}
        onRowClick={(l) => setSelectedLog(l)}
        emptyTitle="No audit records found"
        emptyDescription={
          hasActiveFilters
            ? 'No audit log events match your active category or search query.'
            : 'No audit records have been generated on the system yet.'
        }
        emptyAction={
          hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          ) : undefined
        }
        renderMobileCard={(log) => (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${getActionColor(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">{getActorName(log)}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(log.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Target: {log.resourceType}</span>
              <span className="font-mono">{log.ipAddress || '127.0.0.1'}</span>
            </div>
          </div>
        )}
        pagination={
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => setPage(p)}
          />
        }
      />

      {/* Audit Detail Drawer */}
      <AdminDetailDrawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.action || 'Audit Event'}
        subtitle="Security & Compliance Traceability"
        icon={Shield}
        badge={
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Verified Event
          </span>
        }
        footerActions={
          selectedLog && (
            <button
              type="button"
              onClick={() => handleCopySanitizedJson(selectedLog)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>JSON Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Sanitized JSON</span>
                </>
              )}
            </button>
          )
        }
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Action & Status Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Action Event
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {selectedLog.action}
                  </p>
                </div>
                <StatusBadge status="success" size="md" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Event ID: #{selectedLog._id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedLog._id)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Event Context Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Event Context & Origin
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" /> Initiated By
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {getActorName(selectedLog)}
                  </p>
                  <p className="text-[11px] text-slate-400">{getActorEmail(selectedLog)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> Target Resource
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedLog.resourceType}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    #{selectedLog.resourceId || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> IP Address
                  </span>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {selectedLog.ipAddress || '127.0.0.1'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" /> Recorded Timestamp
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {new Date(selectedLog.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Sanitized Metadata Display (Zero Secrets) */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sanitized Payload Metadata
                  </h5>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Secrets Redacted
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto border border-slate-800">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(sanitizeMetadata(selectedLog.metadata), null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Immutability Note */}
            <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-purple-950 dark:text-purple-300 mb-0.5">
                Audit Trail Immutability
              </p>
              This event is cryptographically indexed and append-only. Modification and deletion of audit events are strictly prohibited by JobConnect security policy.
            </div>
          </div>
        )}
      </AdminDetailDrawer>
    </div>
  );
};
