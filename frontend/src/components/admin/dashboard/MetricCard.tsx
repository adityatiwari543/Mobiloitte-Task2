import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  trendText?: string;
  trend?: string;
  trendPeriod?: string;
  icon: LucideIcon;
  watermarkIcon?: LucideIcon;
  variant?: 'blue' | 'sky' | 'purple' | 'emerald' | 'amber' | string;
  color?: string;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  trendText,
  trend,
  trendPeriod = 'vs. last 7 days',
  icon: Icon,
  watermarkIcon: WatermarkIcon,
  variant,
  color = 'blue',
  isLoading = false,
}) => {
  const displayLabel = title || label || '';
  const displayTrend = trend || trendText;
  const activeTheme = variant || color;

  const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/60 dark:border-blue-900/60',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200/60 dark:border-sky-900/60',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/60',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200/60 dark:border-violet-900/60',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200/60 dark:border-purple-800/60',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/60 dark:border-emerald-900/60',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/60 dark:border-amber-900/60',
    },
  };

  const st = variantStyles[activeTheme] || variantStyles.blue;
  const Watermark = WatermarkIcon || Icon;

  // Accurately determine trend polarity
  const isNegative = displayTrend?.trim().startsWith('-');
  const isZero = displayTrend === '0%' || displayTrend === '+0%' || displayTrend === '-0%';
  const trendColor = isNegative
    ? 'text-rose-600 dark:text-rose-400'
    : isZero
    ? 'text-slate-500 dark:text-slate-400'
    : 'text-emerald-600 dark:text-emerald-400';
  const TrendIcon = isNegative ? ArrowDownRight : isZero ? Minus : ArrowUpRight;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0c1427] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-all hover:shadow-md">
      {/* Top row: Icon and Label */}
      <div className="flex items-center space-x-3 mb-2.5">
        <div
          className={`w-9 h-9 rounded-lg ${st.bg} ${st.text} border ${st.border} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
          {displayLabel}
        </p>
      </div>

      {/* Main Metric Value */}
      <div className="mt-1">
        {isLoading ? (
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </p>
        )}
      </div>

      {/* Bottom Trend & Context */}
      <div className="mt-2.5 flex items-center justify-between">
        {displayTrend ? (
          <div className={`flex items-center space-x-1 text-xs font-bold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{displayTrend}</span>
            <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 ml-1">
              {trendPeriod}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Live platform count</span>
        )}

        {/* Subtle Watermark Silhouette Icon */}
        <div className="text-slate-200 dark:text-slate-800/80 pointer-events-none">
          <Watermark className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
export default MetricCard;
