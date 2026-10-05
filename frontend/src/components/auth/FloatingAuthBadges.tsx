import React from 'react';
import { Star, TrendingUp, Sparkles } from 'lucide-react';

interface FloatingAuthBadgesProps {
  className?: string;
}

export const FloatingAuthBadges: React.FC<FloatingAuthBadgesProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative w-full pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Floating Badge 1: Better Opportunities */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-md border border-slate-200/90 dark:border-indigo-900/60 shadow-lg shadow-purple-500/10 dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] animate-float-card-1 text-xs font-semibold text-slate-800 dark:text-slate-200 absolute -top-4 left-6 z-10">
        <span className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center flex-shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
        </span>
        <span>Better Opportunities</span>
      </div>

      {/* Floating Badge 2: Higher Salary */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-md border border-slate-200/90 dark:border-emerald-900/60 shadow-lg shadow-emerald-500/10 dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] animate-float-card-2 text-xs font-semibold text-slate-800 dark:text-slate-200 absolute top-1/2 -right-4 z-10">
        <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
        </span>
        <span>Higher Salary</span>
      </div>

      {/* Floating Badge 3: Grow Your Career */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-md border border-slate-200/90 dark:border-blue-900/60 shadow-lg shadow-blue-500/10 dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] animate-float-card-3 text-xs font-semibold text-slate-800 dark:text-slate-200 absolute -bottom-4 left-16 z-10">
        <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span>Grow Your Career</span>
      </div>
    </div>
  );
};
