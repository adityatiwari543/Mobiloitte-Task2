import React from 'react';
import { Briefcase, Building2, CheckCircle2, Circle } from 'lucide-react';
import { ROLES } from '@jobconnect/shared';

interface RoleSelectorCardsProps {
  selectedRole: string | undefined;
  onSelectRole: (role: typeof ROLES.CANDIDATE | typeof ROLES.RECRUITER | undefined) => void;
  errorMessage?: string | null;
}

export const RoleSelectorCards: React.FC<RoleSelectorCardsProps> = ({
  selectedRole,
  onSelectRole,
  errorMessage,
}) => {
  const isCandidateSelected = selectedRole === ROLES.CANDIDATE;
  const isRecruiterSelected = selectedRole === ROLES.RECRUITER;

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2.5">
        I want to register as: <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Candidate Option */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRole(isCandidateSelected ? undefined : ROLES.CANDIDATE)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectRole(isCandidateSelected ? undefined : ROLES.CANDIDATE);
            }
          }}
          className={`relative flex items-start p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${
            isCandidateSelected
              ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-slate-900 dark:text-white shadow-sm ring-2 ring-purple-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mr-3 border transition-colors ${
              selectedRole === ROLES.CANDIDATE
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              Job Seeker / Candidate
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Discover verified tech jobs, track applications, and receive recruiter offers.
            </span>
            <span className="inline-block mt-2 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/80 px-2 py-0.5 rounded-full">
              Get Hired
            </span>
          </div>

          <div className="absolute top-4 right-4">
            {selectedRole === ROLES.CANDIDATE ? (
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            )}
          </div>
        </div>

        {/* Recruiter Option */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRole(isRecruiterSelected ? undefined : ROLES.RECRUITER)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectRole(isRecruiterSelected ? undefined : ROLES.RECRUITER);
            }
          }}
          className={`relative flex items-start p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${
            isRecruiterSelected
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-sm ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mr-3 border transition-colors ${
              selectedRole === ROLES.RECRUITER
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              Employer / Recruiter
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Post job openings, manage candidates, and hire top-tier engineering talent.
            </span>
            <span className="inline-block mt-2 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full">
              Hire Talent
            </span>
          </div>

          <div className="absolute top-4 right-4">
            {selectedRole === ROLES.RECRUITER ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-2 text-[11px] text-red-500 font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
