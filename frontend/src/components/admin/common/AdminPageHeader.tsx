import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RefreshCw } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AdminPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  breadcrumbs,
  title,
  description,
  badge,
  actions,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        {/* Breadcrumb Navigation */}
        <nav
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`font-semibold ${
                      isLast
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Title & Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {badge}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
        {actions}
      </div>
    </div>
  );
};
