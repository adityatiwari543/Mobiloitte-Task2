import React from 'react';
import { Sparkles } from 'lucide-react';

interface BadgeProps {
  text?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  text = 'Your Next Career Move Starts Here',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-50/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-5 shadow-xs border border-purple-200/80 dark:border-purple-800/60 w-fit backdrop-blur-sm transition-all hover:scale-[1.02] cursor-default ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
      <span>{text}</span>
    </div>
  );
};
