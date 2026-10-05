import React from 'react';
import { Calendar } from 'lucide-react';

interface InterviewCardProps {
  title?: string;
  time?: string;
  className?: string;
  onClick?: () => void;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({
  title = 'Interview Scheduled',
  time = 'Tomorrow at 11:30 AM',
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 px-3 sm:px-4 rounded-2xl bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-xl border border-emerald-300/80 dark:border-emerald-500/50 shadow-lg shadow-emerald-500/10 dark:shadow-[0_10px_30px_rgba(16,185,129,0.2)] animate-float-card-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer select-none ${className}`}
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/60 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="text-left">
        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
          {title}
        </p>
        <p className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 leading-tight whitespace-nowrap">
          {time}
        </p>
      </div>
    </div>
  );
};
