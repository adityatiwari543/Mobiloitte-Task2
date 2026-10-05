import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelect {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
}

export interface ToolbarTab {
  id: string;
  label: string;
  count?: number;
}

interface AdminFilterToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  tabs?: ToolbarTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  filters?: FilterSelect[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  children?: React.ReactNode;
}

export const AdminFilterToolbar: React.FC<AdminFilterToolbarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  tabs,
  activeTab,
  onTabChange,
  filters,
  hasActiveFilters = false,
  onClearFilters,
  children,
}) => {
  return (
    <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3.5 transition-colors">
      {/* Optional Top Tabs */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-100 dark:border-slate-800/80 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Clear Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters?.map((f) => (
            <select
              key={f.id}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {children}

          {/* Clear Filters Button */}
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
