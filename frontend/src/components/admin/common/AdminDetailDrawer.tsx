import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AdminDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  maxWidth?: string;
}

export const AdminDetailDrawer: React.FC<AdminDetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon: Icon,
  children,
  footerActions,
  maxWidth = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          className={`w-screen ${maxWidth} bg-white dark:bg-[#0c1427] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200/90 dark:border-slate-800/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {children}
          </div>

          {/* Footer Actions */}
          {footerActions && (
            <div className="p-4 border-t border-slate-200/90 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5 shrink-0">
              {footerActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
