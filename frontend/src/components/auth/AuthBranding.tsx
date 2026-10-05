import React from 'react';
import { Sparkles, Briefcase, Zap, ShieldCheck } from 'lucide-react';

export interface AuthBrandingProps {
  className?: string;
  badgeText?: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  titlePrimary?: string;
  titleSecondary?: string;
  titleHighlight?: string;
  subtitle?: string;
  benefits?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
  }>;
}

const DEFAULT_BENEFITS = [
  {
    icon: Sparkles,
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/70 border-purple-200/80 dark:border-purple-800/60',
    title: 'Personalized Job Recommendations',
    description: 'Curated roles based on your profile and skills.',
  },
  {
    icon: Briefcase,
    iconColor: 'text-blue-600 dark:text-sky-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200/80 dark:border-blue-800/60',
    title: 'Track Your Applications',
    description: 'Real-time status updates from submission to offer.',
  },
  {
    icon: Zap,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/60',
    title: 'AI Career Assistant',
    description: 'Instant career guidance, ATS resume & interview prep.',
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200/80 dark:border-emerald-800/60',
    title: 'Direct Recruiter Outreach',
    description: 'Connect directly with verified hiring managers.',
  },
];

export const AuthBranding: React.FC<AuthBrandingProps> = ({
  className = '',
  badgeText = 'Welcome back',
  badgeIcon: BadgeIcon = Sparkles,
  titlePrimary = 'Sign in to your',
  titleHighlight = 'JobConnect',
  titleSecondary = 'account',
  subtitle = 'Access personalized job recommendations, track your applications, and take the next step in your career journey.',
  benefits = DEFAULT_BENEFITS,
}) => {
  return (
    <div className={`flex flex-col justify-center text-left w-full max-w-[460px] ${className}`}>
      {/* Top Welcome Brand Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-5 shadow-2xs border border-purple-200/80 dark:border-purple-800/60 w-fit backdrop-blur-sm">
        <BadgeIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        <span>{badgeText}</span>
      </div>

      {/* Main Heading (Clean 2-line structure) */}
      <h1 className="text-3xl sm:text-4xl lg:text-[2.35rem] xl:text-[2.65rem] font-black tracking-tight leading-[1.16] text-slate-900 dark:text-white">
        <span className="block">{titlePrimary}</span>
        <span className="block mt-0.5">
          <span className="text-purple-600 dark:text-purple-400">{titleHighlight}</span>{' '}
          {titleSecondary}
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="mt-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm font-normal leading-relaxed">
        {subtitle}
      </p>

      {/* Professional Compact Benefit Rows */}
      <div className="mt-7 space-y-3">
        {benefits.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center space-x-3.5 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:border-purple-200 dark:hover:border-purple-800/70 transition-all duration-200"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.bgColor} shadow-2xs`}
              >
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
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
