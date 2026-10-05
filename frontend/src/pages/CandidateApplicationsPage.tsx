import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const getCompanyIcon = (name: string, logoUrl?: string) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        className="w-12 h-12 rounded-2xl object-contain border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#0D1220] p-1.5 flex-shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }
  const n = (name || '').toLowerCase();
  if (n.includes('google')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0D1220] p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
        <span className="text-[#4285F4]">G</span>
      </div>
    );
  }
  if (n.includes('microsoft')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0D1220] p-2.5 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1 shadow-xs flex-shrink-0 items-center justify-center">
        <span className="w-2.5 h-2.5 bg-[#F25022] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#7FBA00] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#00A4EF] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#FFB900] rounded-[1px]" />
      </div>
    );
  }
  if (n.includes('amazon')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#131921] dark:bg-[#0D1220] text-white p-2 border border-transparent dark:border-slate-700 flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
        <span className="text-[#FF9900]">a</span>
      </div>
    );
  }
  if (n.includes('stripe')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#635BFF] text-white p-2 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('swiggy')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FC8019] text-white p-2 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('zomato')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#E23744] text-white p-2 flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
        <span>Z</span>
      </div>
    );
  }
  const initial = (name || 'C').charAt(0).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#15203A] dark:to-[#0D1220] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
      {initial}
    </div>
  );
};

export const CandidateApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/me');
      return res.data?.data || [];
    },
  });

  const activeApplications = useMemo(() => {
    return (applications || []).filter(
      (app: any) => app.status !== 'withdrawn' && app.jobId && app.jobId._id
    );
  }, [applications]);

  const withdrawMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/applications/${id}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Shortlisted
          </span>
        );
      case 'interview':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Interview Scheduled
          </span>
        );
      case 'selected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Selected 🎉
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Not Selected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Withdrawn
          </span>
        );
      case 'under_review':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Under Review
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-[#15203A] text-blue-700 dark:text-indigo-300 border border-blue-200/60 dark:border-indigo-900/60">
            Applied
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2.5 border border-blue-200/70 dark:border-blue-800/60 w-fit">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Application Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F8FAFC]">
              Application Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-1">
              Track the live recruitment status of all your submitted roles in real time.
            </p>
          </div>

          {activeApplications.length > 0 && (
            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-[#15203A] text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
              {activeApplications.length} {activeApplications.length === 1 ? 'Application' : 'Applications'} Submitted
            </span>
          )}
        </div>

        {isLoading ? (
          // Skeleton loaders
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#101827] rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 animate-pulse flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4 w-full md:w-2/3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-[#162035] flex-shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-slate-200 dark:bg-[#162035] rounded w-1/2" />
                    <div className="h-3 bg-slate-100 dark:bg-[#162035]/60 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-9 w-28 bg-slate-200 dark:bg-[#162035] rounded-xl" />
              </div>
            ))}
          </div>
        ) : activeApplications.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-[#0D1220] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#162035] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
              No applications submitted yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-md mx-auto leading-relaxed">
              Explore thousands of verified engineering and tech listings on JobConnect and start applying today.
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
          <div className="space-y-4">
            {activeApplications.map((app: any) => {
              const job = app.jobId;
              const companyName = job?.companyId?.name || 'Verified Company';
              const logoUrl = job?.companyId?.logoUrl;
              const isVerified = job?.companyId?.isVerified !== false;
              const canWithdraw = app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'selected';

              return (
                <div
                  key={app._id}
                  className="bg-white dark:bg-[#101827] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(15,23,42,0.6)] hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {getCompanyIcon(companyName, logoUrl)}

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3
                          onClick={() => navigate(`/jobs/${job?._id}`)}
                          className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          {job?.title || 'Job Posting'}
                        </h3>
                        {getStatusBadge(app.status)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
                        <span>{companyName}</span>
                        {isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Applied on {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#94A3B8] pt-1">
                        <span className="inline-flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                          {job?.location || 'Remote'}
                        </span>
                        {job?.remoteType && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-[#15203A] text-blue-700 dark:text-indigo-300 border border-blue-200/60 dark:border-indigo-900/40 capitalize">
                            {job.remoteType}
                          </span>
                        )}
                        {job?.employmentType && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#CBD5E1] border dark:border-slate-700/40 capitalize">
                            {job.employmentType.replace('-', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs/${job?._id}`)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>View Job</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you wish to withdraw this job application?')) {
                            withdrawMutation.mutate(app._id);
                          }
                        }}
                        disabled={withdrawMutation.isPending}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer"
                      >
                        {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
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
