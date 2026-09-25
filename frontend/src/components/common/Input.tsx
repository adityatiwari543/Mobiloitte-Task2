import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, id, className = '', ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const isDateInput = props.type === 'date' || props.type === 'datetime-local';

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
      if (isDateInput) {
        try {
          e.currentTarget.showPicker?.();
        } catch {}
      }
      props.onClick?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div
          className={`relative rounded-lg shadow-sm ${isDateInput ? 'cursor-pointer' : ''}`}
          onClick={(e) => {
            if (isDateInput) {
              const inputEl = e.currentTarget.querySelector('input');
              try {
                inputEl?.showPicker?.();
              } catch {}
            }
          }}
        >
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            onClick={handleInputClick}
            className={`block w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
              isDateInput ? 'cursor-pointer' : ''
            } ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-red-400 dark:border-red-800 text-red-900 dark:text-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/20 dark:bg-red-950/20'
                : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800/90'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
