import React from 'react';

interface TrendingSkillsProps {
  skills?: string[];
  onSkillClick: (skill: string) => void;
  className?: string;
}

const DEFAULT_TRENDING = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Remote',
  'DevOps',
  'Bangalore',
  'Hyderabad',
];

export const TrendingSkills: React.FC<TrendingSkillsProps> = ({
  skills = DEFAULT_TRENDING,
  onSkillClick,
  className = '',
}) => {
  return (
    <div className={`mt-5 flex flex-wrap items-center gap-2 text-xs ${className}`}>
      <span className="font-bold text-slate-900 dark:text-[#F8FAFC] mr-1">Trending:</span>
      {skills.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSkillClick(tag)}
          className="px-3 py-1 rounded-full bg-white dark:bg-[#0D1220] hover:bg-purple-50 dark:hover:bg-[#162035] text-slate-700 dark:text-[#CBD5E1] hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all cursor-pointer font-medium shadow-xs hover:scale-105 active:scale-95"
        >
          {tag}
        </button>
      ))}
    </div>
  );
};
