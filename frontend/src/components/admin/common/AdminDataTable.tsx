import React from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  renderMobileCard?: (item: T) => React.ReactNode;
  pagination?: React.ReactNode;
  skeletonRowCount?: number;
}

export function AdminDataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  emptyAction,
  renderMobileCard,
  pagination,
  skeletonRowCount = 6,
}: AdminDataTableProps<T>) {
  // Error State
  if (error) {
    return (
      <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Failed to load records
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden transition-colors">
      {/* Mobile Cards Mode (Visible on screens < sm if renderMobileCard provided) */}
      {renderMobileCard && (
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`m-skel-${i}`} className="p-4 space-y-2 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/3" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {emptyTitle}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {emptyDescription}
              </p>
              {emptyAction && <div className="pt-2">{emptyAction}</div>}
            </div>
          ) : (
            data.map((item) => (
              <div
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`p-4 transition-colors ${
                  onRowClick ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-900/60' : ''
                }`}
              >
                {renderMobileCard(item)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop / Tablet Table (Hidden on small screens if renderMobileCard is present) */}
      <div className={`overflow-x-auto ${renderMobileCard ? 'hidden sm:block' : 'block'}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="py-3.5 px-4">
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center">
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {emptyTitle}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {emptyDescription}
                    </p>
                    {emptyAction && <div className="pt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60 cursor-pointer'
                      : 'hover:bg-slate-50/40 dark:hover:bg-slate-900/30'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render(item, idx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && <div className="px-5 py-3">{pagination}</div>}
    </div>
  );
}
