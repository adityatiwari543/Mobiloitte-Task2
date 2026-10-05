import React from 'react';
import { Star } from 'lucide-react';

interface MatchScoreCardProps {
  score?: number | string;
  className?: string;
  onClick?: () => void;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({
  score = '98%',
  className = '',
  onClick,
}) => {
  const displayScore = typeof score === 'number' ? `${score}%` : score;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 px-3 sm:px-4 rounded-2xl bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-xl border border-slate-200/90 dark:border-purple-900/60 shadow-lg shadow-purple-500/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-float-card-3 hover:scale-[1.02] transition-transform duration-200 cursor-pointer select-none ${className}`}
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
        <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-indigo-600 dark:fill-indigo-400" />
      </div>
      <div className="text-left">
        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
          {displayScore}
        </p>
        <p className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
          Match Score
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight whitespace-nowrap">
          For better opportunities
        </p>
      </div>
    </div>
  );
};
