import React, { useState } from 'react';
import { X, Copy, Check, Shield, User, Clock, Globe, FileText, CheckCircle2 } from 'lucide-react';

export interface AuditLogItem {
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

interface AuditDetailDrawerProps {
  log: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !log) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const actor = typeof log.actorUserId === 'object' ? log.actorUserId : null;
  const actorName = actor?.name || 'System / Anonymous';
  const actorEmail = actor?.email || 'N/A';
  const actorRole = actor?.role || 'SYSTEM';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0c1427] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Audit Log Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immutable event record
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Action & Status */}
            <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Action Performed
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                      {log.action}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </span>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Success
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Timestamp
                  </span>
                  <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-300">
                    {new Date(log.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> IP Address
                  </span>
                  <p className="mt-0.5 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {log.ipAddress || '127.0.0.1'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actor Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Initiated By (Actor)
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{actorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{actorEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {actorRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Resource */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Target Resource
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Resource Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {log.resourceType}
                  </span>
                </div>
                {log.resourceId && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-500">Resource ID</span>
                    <button
                      onClick={() => copyToClipboard(log.resourceId!, 'resourceId')}
                      className="group flex items-center gap-1.5 font-mono text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>{log.resourceId}</span>
                      {copiedField === 'resourceId' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Event Metadata
                </h4>
                {log.metadata && (
                  <button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(log.metadata, null, 2), 'metadata')
                    }
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-500 transition-colors"
                  >
                    {copiedField === 'metadata' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy JSON
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 overflow-x-auto">
                <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                  {log.metadata && Object.keys(log.metadata).length > 0
                    ? JSON.stringify(log.metadata, null, 2)
                    : '// No additional payload metadata'}
                </pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuditDetailDrawer;
