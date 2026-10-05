import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  PauseCircle,
  Eye,
  FileCheck,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';

export type StatusType =
  | 'active'
  | 'suspended'
  | 'pending_verification'
  | 'deactivated'
  | 'published'
  | 'paused'
  | 'closed'
  | 'rejected'
  | 'draft'
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'selected'
  | 'withdrawn'
  | 'success'
  | 'failed'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'sm',
}) => {
  const norm = (status || '').toLowerCase().trim();

  let label = status;
  let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let Icon = Clock;

  switch (norm) {
    // User / General Active
    case 'active':
      label = 'Active';
      bg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
      Icon = CheckCircle2;
      break;
    case 'suspended':
      label = 'Suspended';
      bg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70';
      Icon = UserX;
      break;
    case 'pending_verification':
    case 'pending':
      label = 'Pending Review';
      bg = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70';
      Icon = Clock;
      break;
    case 'deactivated':
      label = 'Deactivated';
      bg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      Icon = XCircle;
      break;

    // Job States
    case 'published':
      label = 'Published';
      bg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
      Icon = ShieldCheck;
      break;
    case 'paused':
      label = 'Paused / In Review';
      bg = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70';
      Icon = PauseCircle;
      break;
    case 'closed':
      label = 'Closed';
      bg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      Icon = Clock;
      break;
    case 'draft':
      label = 'Draft';
      bg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      Icon = Eye;
      break;

    // Application States
    case 'applied':
      label = 'Applied';
      bg = 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/70';
      Icon = Clock;
      break;
    case 'under_review':
      label = 'Under Review';
      bg = 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/70';
      Icon = Eye;
      break;
    case 'shortlisted':
      label = 'Shortlisted';
      bg = 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/70';
      Icon = Sparkles;
      break;
    case 'interview':
      label = 'Interview';
      bg = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70';
      Icon = Clock;
      break;
    case 'selected':
      label = 'Selected';
      bg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
      Icon = FileCheck;
      break;
    case 'rejected':
      label = 'Rejected';
      bg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70';
      Icon = XCircle;
      break;
    case 'withdrawn':
      label = 'Withdrawn';
      bg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      Icon = XCircle;
      break;

    // Audit / Health
    case 'success':
      label = 'Success';
      bg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
      Icon = CheckCircle2;
      break;
    case 'failed':
    case 'failure':
      label = 'Failed';
      bg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70';
      Icon = AlertTriangle;
      break;

    default:
      // Normalize underscore or uppercase strings
      label = norm
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      break;
  }

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${bg} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{label}</span>
    </span>
  );
};
