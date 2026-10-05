import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface QuickStatsProps {
  stats?: {
    newUsers?: number;
    newJobs?: number;
    applications?: number;
    interviews?: number;
    trends?: {
      users?: string;
      jobs?: string;
      applications?: string;
      interviews?: string;
    };
  };
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const [timeRange, setTimeRange] = useState('7d');

  const items = [
    {
      label: 'New Users',
      value: stats?.newUsers ?? 0,
      trend: stats?.trends?.users || '+12%',
      color: 'bg-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950/40',
      barPercent: Math.min(100, Math.max(15, ((stats?.newUsers || 1) / 10) * 100)),
    },
    {
      label: 'New Jobs',
      value: stats?.newJobs ?? 0,
      trend: stats?.trends?.jobs || '+8%',
      color: 'bg-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
      barPercent: Math.min(100, Math.max(15, ((stats?.newJobs || 1) / 5) * 100)),
    },
    {
      label: 'Applications',
      value: stats?.applications ?? 0,
      trend: stats?.trends?.applications || '+15%',
      color: 'bg-violet-600',
      bgColor: 'bg-violet-100 dark:bg-violet-950/40',
      barPercent: Math.min(100, Math.max(15, ((stats?.applications || 1) / 10) * 100)),
    },
    {
      label: 'Interviews',
      value: stats?.interviews ?? 0,
      trend: stats?.trends?.interviews || '+25%',
      color: 'bg-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-950/40',
      barPercent: Math.min(100, Math.max(15, ((stats?.interviews || 1) / 5) * 100)),
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Stats</h3>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {item.trend}
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${item.barPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default QuickStats;
