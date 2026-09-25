import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  fallbackUrl?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  fallbackUrl,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    const hasHistory =
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0;

    if (hasHistory) {
      navigate(-1);
    } else if (fallbackUrl) {
      navigate(fallbackUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all duration-150 cursor-pointer group select-none ${className}`}
      title="Go back to previous page"
    >
      <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-100 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
};
