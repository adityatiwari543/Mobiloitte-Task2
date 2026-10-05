import React from 'react';
import {
  Sparkles,
  Briefcase,
  Zap,
  ShieldCheck,
  CheckCircle2,
  CircleDot,
  Circle,
  UserCheck,
  GraduationCap,
  Lock,
} from 'lucide-react';

interface StepDef {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const REGISTER_STEPS: StepDef[] = [
  {
    number: 1,
    title: 'Account Type',
    subtitle: 'Candidate or Recruiter profile',
    icon: Briefcase,
  },
  {
    number: 2,
    title: 'Personal Info',
    subtitle: 'Name, contact & identity',
    icon: UserCheck,
  },
  {
    number: 3,
    title: 'Education & Profile',
    subtitle: 'Qualifications & tech stack',
    icon: GraduationCap,
  },
  {
    number: 4,
    title: 'Security & Credentials',
    subtitle: 'Password & terms agreement',
    icon: Lock,
  },
];

interface RegisterBrandingProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export const RegisterBranding: React.FC<RegisterBrandingProps> = ({
  currentStep,
  onSelectStep,
  className = '',
}) => {
  const valueProps = [
    {
      icon: Sparkles,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/70 border-purple-200/80 dark:border-purple-800/60',
      title: 'Personalized Job Recommendations',
      description: 'Curated roles matching your verified skills & goals.',
    },
    {
      icon: Briefcase,
      iconColor: 'text-blue-600 dark:text-sky-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200/80 dark:border-blue-800/60',
      title: 'Track Your Applications',
      description: 'Real-time status updates from submission to interview.',
    },
    {
      icon: Zap,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/60',
      title: 'AI Career Assistant',
      description: 'ATS resume optimization & interview coaching.',
    },
    {
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200/80 dark:border-emerald-800/60',
      title: 'Direct Recruiter Outreach',
      description: 'Connect directly with 1,200+ verified hiring teams.',
    },
  ];

  return (
    <div className={`flex flex-col justify-start text-left w-full max-w-[480px] ${className}`}>
      {/* Top Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2.5 shadow-2xs border border-purple-200/80 dark:border-purple-800/60 w-fit backdrop-blur-sm">
        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        <span>Join our growing community</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-2xl sm:text-3xl lg:text-[2.1rem] xl:text-[2.3rem] font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
        <span className="block">Create your</span>
        <span className="block mt-0.5">
          <span className="text-purple-600 dark:text-purple-400">JobConnect</span> account
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
        Set up your professional profile in minutes to discover tailored roles, connect directly with recruiters, and accelerate your tech career.
      </p>

      {/* Career Setup Steps Timeline (Vertical step tracker) */}
      <div className="mt-4 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
            Career Setup Steps
          </span>
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60">
            Step {currentStep} of 4
          </span>
        </div>

        <div className="relative pl-1 space-y-2.5">
          {REGISTER_STEPS.map((step, idx) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isClickable = step.number <= currentStep && Boolean(onSelectStep);

            return (
              <div
                key={step.number}
                onClick={() => {
                  if (isClickable && onSelectStep) {
                    onSelectStep(step.number);
                  }
                }}
                className={`relative flex items-start space-x-3 transition-all rounded-xl p-1.5 -ml-1 ${
                  isClickable ? 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60' : ''
                }`}
              >
                {/* Connecting Line between steps */}
                {idx < REGISTER_STEPS.length - 1 && (
                  <div
                    className={`absolute left-[18px] top-7 bottom-[-16px] w-[2px] transition-colors ${
                      step.number < currentStep
                        ? 'bg-purple-600 dark:bg-purple-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}

                {/* Step Indicator Icon / Bubble */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/80 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <span>{step.number}</span>
                  ) : (
                    <span className="text-[11px]">{step.number}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-purple-700 dark:text-purple-300'
                          : isCompleted
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    {isCurrent && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Professional Compact Benefit Cards */}
      <div className="mt-3.5 space-y-2">
        {valueProps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center space-x-3.5 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:border-purple-200 dark:hover:border-purple-800/70 transition-all duration-200"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${item.bgColor} shadow-2xs`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                  {item.title}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
