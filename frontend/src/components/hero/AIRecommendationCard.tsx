import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIRecommendationCardProps {
  className?: string;
  onClick?: () => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 px-3 sm:px-4 rounded-2xl bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-xl border border-slate-200/90 dark:border-indigo-900/60 shadow-lg shadow-purple-500/10 dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-float-card-1 hover:scale-[1.02] transition-transform duration-200 cursor-pointer select-none ${className}`}
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="text-left">
        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
          AI-Powered
        </p>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
          Get personalized job recommendations
        </p>
      </div>
    </div>
  );
};
