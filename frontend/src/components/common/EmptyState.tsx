import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button.js';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 transition-colors">
    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full mb-4">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
    {actionText && onAction && (
      <Button variant="primary" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);
