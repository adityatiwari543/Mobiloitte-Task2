import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Button } from '../components/common/Button.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Shield,
  Briefcase,
  Mail,
  User,
  Search,
  Filter,
  ArrowRight,
  Code,
  Copy,
  Check,
  Clock,
  Layers,
  Info,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data?.data?.items || [];
    },
  });

  const logs: any[] = data || [];

  // Filter logs by search query and category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (actionFilter !== 'ALL') {
        if (actionFilter === 'JOB' && !log.action.includes('JOB')) return false;
        if (actionFilter === 'USER' && !log.action.includes('USER')) return false;
        if (actionFilter === 'AUTH' && !log.action.includes('PASSWORD') && !log.action.includes('LOGIN')) return false;
      }

      // Search term filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const actorName = log.actorUserId?.name?.toLowerCase() || '';
      const action = log.action?.toLowerCase() || '';
      const resourceType = log.resourceType?.toLowerCase() || '';
      const resourceId = log.resourceId?.toLowerCase() || '';
      const metadataStr = JSON.stringify(log.metadata || {}).toLowerCase();

      return (
        actorName.includes(q) ||
        action.includes(q) ||
        resourceType.includes(q) ||
        resourceId.includes(q) ||
        metadataStr.includes(q)
      );
    });
  }, [logs, searchTerm, actionFilter]);

  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Badge color helper for actions
  const getActionBadgeVariant = (action: string): 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray' => {
    if (action.includes('PUBLISH') || action.includes('APPROVED')) return 'green';
    if (action.includes('PAUSE') || action.includes('STATUS')) return 'amber';
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('BAN')) return 'red';
    if (action.includes('REGISTER') || action.includes('RESET')) return 'purple';
    return 'blue';
  };

  // Clean, structured UI renderer for metadata (replaces raw JSON)
  const renderMetadataSummary = (metadata: any) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">No extra details</span>;
    }

    // 1. Job action: has job title and status transition
    if (metadata.title) {
      return (
        <div className="flex flex-col gap-1 py-0.5">
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
            <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate max-w-[240px]" title={metadata.title}>
              {metadata.title}
            </span>
          </div>

          {(metadata.prevStatus || metadata.newStatus) && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {metadata.prevStatus && (
                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 capitalize">
                  {metadata.prevStatus}
                </span>
              )}
              {metadata.prevStatus && metadata.newStatus && <span className="text-slate-400">→</span>}
              {metadata.newStatus && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 capitalize font-semibold">
                  {metadata.newStatus}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // 2. User action: targetEmail, prevStatus, newStatus, role
    if (metadata.targetEmail || metadata.email) {
      const email = metadata.targetEmail || metadata.email;
      return (
        <div className="flex flex-col gap-1 py-0.5">
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
            <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate max-w-[240px]" title={email}>
              {email}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {metadata.role && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 uppercase">
                {metadata.role}
              </span>
            )}
            {metadata.method && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                Via {metadata.method}
              </span>
            )}
            {(metadata.prevStatus || metadata.newStatus) && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {metadata.prevStatus && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 capitalize">
                    {metadata.prevStatus}
                  </span>
                )}
                {metadata.prevStatus && metadata.newStatus && <span className="text-slate-400">→</span>}
                {metadata.newStatus && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 capitalize font-semibold">
                    {metadata.newStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Generic key-value chips
    const entries = Object.entries(metadata);
    return (
      <div className="flex flex-wrap gap-1.5 max-w-sm py-0.5">
        {entries.slice(0, 3).map(([key, val]) => (
          <span
            key={key}
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700"
          >
            <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 capitalize">{key}:</span>
            <span className="truncate max-w-[120px] font-medium">
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          </span>
        ))}
        {entries.length > 3 && (
          <span className="text-[10px] text-slate-400 self-center">+{entries.length - 3} more</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading audit security logs..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/admin/dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security & Operational Audit Logs</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable, compliance-ready record of all administrative actions, job moderation, and user changes
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold border border-slate-200 dark:border-slate-700">
            {filteredLogs.length} Total Event(s)
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by actor, action, job, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="JOB">Job Moderation Events</option>
            <option value="USER">User Status & Profile</option>
            <option value="AUTH">Authentication & Passwords</option>
          </select>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1 font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Target Resource</th>
                <th className="py-3.5 px-6">Details / Changes</th>
                <th className="py-3.5 px-6 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                          {log.actorUserId?.name ? log.actorUserId.name[0].toUpperCase() : 'S'}
                        </div>
                        <span>{log.actorUserId?.name || 'System / Auto'}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            #{log.resourceId.slice(-6)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Formatted Metadata (Clean Human-Readable Details) */}
                    <td className="py-3.5 px-6">
                      {renderMetadataSummary(log.metadata)}
                    </td>

                    {/* Inspect Action */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors cursor-pointer"
                        title="Inspect full audit record"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detailed Audit Record Inspector */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Record Inspection"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Quick summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action</span>
                <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-1">
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actor</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 block mt-1">
                  {selectedLog.actorUserId?.name || 'System'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 block mt-1">
                  {selectedLog.resourceType} ({selectedLog.resourceId?.slice(-6) || 'N/A'})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 block mt-1">
                  {new Date(selectedLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Parsed Attributes Card */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                Parsed Metadata Attributes
              </h4>
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(selectedLog.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center px-3.5 py-2 bg-white dark:bg-slate-900">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 capitalize">{k}</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic">No structured metadata logged for this event.</p>
              )}
            </div>

            {/* Raw JSON Technical Payload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-purple-500" />
                  Raw Technical JSON Payload
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopyJson(selectedLog)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Payload!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800 leading-relaxed scrollbar-thin">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            {/* Footer action */}
            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
