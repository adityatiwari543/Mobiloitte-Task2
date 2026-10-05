import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Bookmark,
  MapPin,
  Briefcase,
  CheckCircle2,
  Check,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

const getCompanyIcon = (name: string, logoUrl?: string) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        className="w-11 h-11 rounded-xl object-contain border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#0D1220] p-1 flex-shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }
  const n = (name || '').toLowerCase();
  if (n.includes('google')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0D1220] p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
        <span className="text-[#4285F4]">G</span>
      </div>
    );
  }
  if (n.includes('microsoft')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0D1220] p-2.5 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1 shadow-xs flex-shrink-0 items-center justify-center">
        <span className="w-2.5 h-2.5 bg-[#F25022] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#7FBA00] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#00A4EF] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#FFB900] rounded-[1px]" />
      </div>
    );
  }
  if (n.includes('amazon')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#131921] dark:bg-[#0D1220] text-white p-2 border border-transparent dark:border-slate-700 flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
        <span className="text-[#FF9900]">a</span>
      </div>
    );
  }
  if (n.includes('stripe')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#635BFF] text-white p-2 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('swiggy')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#FC8019] text-white p-2 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('zomato')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#E23744] text-white p-2 flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
        <span>Z</span>
      </div>
    );
  }
  const initial = (name || 'C').charAt(0).toUpperCase();
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#15203A] dark:to-[#0D1220] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
      {initial}
    </div>
  );
};

const formatSalary = (job: any) => {
  if (job.salaryMin && job.salaryMax) {
    const minL = (job.salaryMin / 100000).toFixed(0);
    const maxL = (job.salaryMax / 100000).toFixed(0);
    return `₹${minL}L - ₹${maxL}L`;
  }
  if (job.salary?.min && job.salary?.max) {
    const minL = (job.salary.min / 100000).toFixed(0);
    const maxL = (job.salary.max / 100000).toFixed(0);
    return `₹${minL}L - ₹${maxL}L`;
  }
  if (job.salaryMin) {
    return `₹${(job.salaryMin / 100000).toFixed(0)}L+`;
  }
  return 'Competitive';
};

export const CandidateSavedJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved/all');
      return res.data?.data || [];
    },
  });

  const { data: myApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/me');
      return res.data?.data || [];
    },
  });

  const appliedJobIds = useMemo(() => {
    return new Set(
      (myApplications || []).map((app: any) => app.jobId?._id || app.jobId)
    );
  }, [myApplications]);

  const removeSavedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/jobs/${jobId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2.5 border border-purple-200/80 dark:border-purple-800/60 w-fit">
              <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Saved Roles</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F8FAFC]">
              Saved Jobs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
              Review and quick-apply to positions you have bookmarked for your tech career.
            </p>
          </div>

          {savedJobs && savedJobs.length > 0 && (
            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-[#15203A] text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
              {savedJobs.length} {savedJobs.length === 1 ? 'Job' : 'Jobs'} Bookmarked
            </span>
          )}
        </div>

        {isLoading ? (
          // Skeleton loaders matching card layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#101827] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 animate-pulse flex flex-col justify-between h-[270px]"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 w-3/4">
                      <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#162035] flex-shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-4 bg-slate-200 dark:bg-[#162035] rounded w-4/5" />
                        <div className="h-3 bg-slate-100 dark:bg-[#162035]/60 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#162035]" />
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-[#162035] rounded w-full" />
                  <div className="h-3 bg-slate-100 dark:bg-[#162035] rounded w-3/4" />
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-[#162035] rounded" />
                  <div className="h-8 w-24 bg-slate-200 dark:bg-[#162035] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-[#0D1220] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#162035] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
              No saved jobs yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-md mx-auto leading-relaxed">
              Bookmark interesting engineering and tech positions while exploring so you can apply anytime.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Find Jobs Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job: any) => {
              const skills = job.skills && job.skills.length > 0 ? job.skills : [];
              const salary = formatSalary(job);
              const companyName = job.companyId?.name || 'Verified Company';
              const logoUrl = job.companyId?.logoUrl;
              const isVerified = job.companyId?.isVerified !== false;
              const hasApplied = appliedJobIds.has(job._id);

              const remoteBadgeText = job.remoteType === 'remote'
                ? 'Remote'
                : job.remoteType === 'hybrid'
                ? 'Hybrid'
                : 'On-site';

              const employmentBadgeText = job.employmentType
                ? job.employmentType.replace('-', ' ').replace('_', ' ')
                : job.jobType
                ? job.jobType.replace('_', ' ')
                : 'Full Time';

              return (
                <div
                  key={job._id}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="group bg-white dark:bg-[#101827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 hover:shadow-xl dark:hover:shadow-[0_4px_24px_rgba(15,23,42,0.6)] hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-5 relative"
                >
                  <div>
                    {/* Top row: Company Logo, Badges, Name, Verification, Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {getCompanyIcon(companyName, logoUrl)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium truncate">
                              {companyName}
                            </span>
                            {isVerified && (
                              <CheckCircle2
                                className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
                                aria-label="Verified Company"
                              />
                            )}
                            {job.isFeatured && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60">
                                Featured
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mt-0.5">
                            {job.title}
                          </h3>
                        </div>
                      </div>

                      {/* Remove Saved Button */}
                      <button
                        type="button"
                        aria-label="Remove from saved"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedMutation.mutate(job._id);
                        }}
                        className="p-2 rounded-xl border bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:border-rose-900 transition-all cursor-pointer flex-shrink-0"
                        title="Remove from Bookmarks"
                      >
                        <Bookmark className="w-4 h-4 fill-current transition-transform active:scale-90" />
                      </button>
                    </div>

                    {/* Meta info tags (Location, Remote mode, Experience) */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center text-slate-500 dark:text-[#94A3B8] font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[130px]">{job.location || 'Remote'}</span>
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-[#15203A] text-blue-700 dark:text-indigo-300 border border-blue-200/60 dark:border-indigo-900/40">
                        {remoteBadgeText}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#CBD5E1] border dark:border-slate-700/40 capitalize">
                        {employmentBadgeText}
                      </span>

                      {job.experienceMin !== undefined && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          • {job.experienceMin}+ yrs exp
                        </span>
                      )}
                    </div>

                    {/* Short Description Preview */}
                    <p className="mt-3 text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {job.description ||
                        'Exciting role working alongside forward-thinking engineering teams to ship high-impact technology products.'}
                    </p>

                    {/* Skills pills */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                      {skills.slice(0, 3).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#162035] text-slate-700 dark:text-[#CBD5E1] border dark:border-slate-700/50 font-medium text-[11px]"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1.5 py-0.5">
                          +{skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Bar: Salary and Quick Apply */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider block">
                        Compensation
                      </span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {salary}
                      </span>
                    </div>

                    {hasApplied ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job._id}`);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Quick Apply</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
