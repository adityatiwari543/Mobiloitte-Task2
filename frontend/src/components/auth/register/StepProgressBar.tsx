import React from 'react';
import { User, Check, ChevronDown } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
}

export const DEFAULT_REGISTER_STEPS: StepItem[] = [
  { id: 1, label: 'Account Type' },
  { id: 2, label: 'Personal Info' },
  { id: 3, label: 'Profile' },
  { id: 4, label: 'Security' },
];

interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  maxVisitedStep?: number;
  onSelectStep?: (step: number) => void;
  steps?: StepItem[];
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps = 4,
  maxVisitedStep = 1,
  onSelectStep,
  steps = DEFAULT_REGISTER_STEPS,
}) => {
  const effectiveMaxVisited = Math.max(maxVisitedStep, currentStep);

  return (
    <div className="mb-5">
      {/* Top Header Row with Squircle User Icon (Centered) */}
      <div className="text-center mb-3 flex flex-col items-center">
        <div className="w-10 h-10 rounded-2xl bg-purple-100/90 dark:bg-purple-950/80 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs mb-2">
          <User className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Create an Account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
          Profile setup takes about 2 minutes
        </p>
      </div>

      {/* Horizontal Multi-Step Stepper Card (~80% width & slim height) */}
      <div className="w-[92%] sm:w-[82%] md:w-[80%] mx-auto bg-[#FAF9F5]/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 py-1.5 px-3 sm:px-6 shadow-2xs">
        <div className="relative flex items-start justify-between w-full">
          {/* Continuous Connecting Line Behind Nodes (Aligned exactly from 1st to 4th circle center) */}
          <div
            className="absolute top-[15px] sm:top-[16px] h-[2px] -translate-y-1/2 bg-slate-200 dark:bg-slate-800 z-0"
            style={{
              left: `${100 / (steps.length * 2)}%`,
              right: `${100 / (steps.length * 2)}%`,
            }}
          >
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{
                width: `${((Math.min(currentStep, totalSteps) - 1) / (totalSteps - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Stepper Nodes */}
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = step.id <= effectiveMaxVisited && Boolean(onSelectStep);

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (isClickable && onSelectStep) {
                    onSelectStep(step.id);
                  }
                }}
                className={`relative z-10 flex flex-col items-center group ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                style={{ width: `${100 / steps.length}%` }}
              >
                {/* Downward chevron indicator directly above the active step */}
                <div className="h-2 flex items-center justify-center -mb-0.5">
                  {isCurrent ? (
                    <ChevronDown className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  ) : (
                    <div className="w-2.5 h-2.5" />
                  )}
                </div>

                {/* Circle Node (Compact Size) */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-200 select-none ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-2xs group-hover:scale-105'
                      : isCurrent
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-100 dark:ring-emerald-950/80 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Label (Compact text) */}
                <span
                  className={`mt-1 text-[10px] sm:text-[11px] text-center leading-tight transition-colors ${
                    isCurrent
                      ? 'text-slate-900 dark:text-white font-bold'
                      : isCompleted
                      ? 'text-slate-700 dark:text-slate-300 font-medium'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
