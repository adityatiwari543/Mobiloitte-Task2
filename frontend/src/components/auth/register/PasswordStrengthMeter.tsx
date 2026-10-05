import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasMinSix = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  let score = 0;
  if (hasMinSix) score += 1;
  if (hasLength) score += 1;
  if (hasLetter && hasNumber) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasSpecial) score += 1;

  // Map score (0-5) to strength tier
  let strengthLabel = 'Weak';
  let strengthColor = 'bg-red-500';
  let textColor = 'text-red-600 dark:text-red-400';
  let activeBars = 1;

  if (score >= 4 && hasMinSix && hasLetter && hasNumber && hasSpecial) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-emerald-500';
    textColor = 'text-emerald-600 dark:text-emerald-400';
    activeBars = 4;
  } else if (score >= 3 && hasMinSix && hasLetter && hasNumber) {
    strengthLabel = 'Good';
    strengthColor = 'bg-blue-500';
    textColor = 'text-blue-600 dark:text-blue-400';
    activeBars = 3;
  } else if (score >= 2 && hasMinSix) {
    strengthLabel = 'Fair';
    strengthColor = 'bg-amber-500';
    textColor = 'text-amber-600 dark:text-amber-400';
    activeBars = 2;
  }

  const rules = [
    { label: 'At least 6 characters (8+ recommended)', met: hasMinSix },
    { label: 'Contains letters & numbers', met: hasLetter && hasNumber },
    { label: 'Contains special symbol (!@#$%^&*)', met: hasSpecial },
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* 4 Segmented Progress Bars */}
      <div className="flex items-center space-x-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              bar <= activeBars ? strengthColor : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
        <span className={`ml-2 text-[11px] font-bold tracking-wide uppercase ${textColor}`}>
          {strengthLabel}
        </span>
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex items-center space-x-1.5 text-[11px]">
            {rule.met ? (
              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span
              className={
                rule.met
                  ? 'text-slate-700 dark:text-slate-300 font-medium'
                  : 'text-slate-400 dark:text-slate-500'
              }
            >
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
