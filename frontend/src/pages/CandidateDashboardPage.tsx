import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import {
  Briefcase,
  Bookmark,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  AlertCircle,
  ExternalLink,
  Search,
  Check,
  Zap,
  Bot,
  Send,
  Building2,
  Compass,
  Award,
  ChevronRight,
  DollarSign,
} from 'lucide-react';

const getCompanyIcon = (name: string, logoUrl?: string) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        className="w-11 h-11 rounded-2xl object-contain border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#0D1220] p-1.5 flex-shrink-0 shadow-xs"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }
  const n = (name || '').toLowerCase();
  if (n.includes('google')) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#0D1220] p-1.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
        <span className="text-[#4285F4]">G</span>
      </div>
    );
  }
  if (n.includes('microsoft')) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#0D1220] p-2 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-0.5 shadow-xs flex-shrink-0 items-center justify-center">
        <span className="w-2 h-2 bg-[#F25022] rounded-[1px]" />
        <span className="w-2 h-2 bg-[#7FBA00] rounded-[1px]" />
        <span className="w-2 h-2 bg-[#00A4EF] rounded-[1px]" />
        <span className="w-2 h-2 bg-[#FFB900] rounded-[1px]" />
      </div>
    );
  }
  if (n.includes('amazon')) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#131921] dark:bg-[#0D1220] text-white p-1.5 border border-transparent dark:border-slate-700 flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
        <span className="text-[#FF9900]">a</span>
      </div>
    );
  }
  if (n.includes('stripe')) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#635BFF] text-white p-1.5 flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('swiggy')) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#FC8019] text-white p-1.5 flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('zomato')) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#E23744] text-white p-1.5 flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
        <span>Z</span>
      </div>
    );
  }
  const initial = (name || 'C').charAt(0).toUpperCase();
  return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#15203A] dark:to-[#0D1220] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
      {initial}
    </div>
  );
};

const formatSalary = (min?: number, max?: number, currency = 'INR') => {
  if (!min && !max) return null;
  const currSymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  if (currency === 'INR') {
    const minL = min ? `${(min / 100000).toFixed(min % 100000 === 0 ? 0 : 1)}L` : '';
    const maxL = max ? `${(max / 100000).toFixed(max % 100000 === 0 ? 0 : 1)}L` : '';
    if (min && max) return `${currSymbol}${minL} - ${currSymbol}${maxL} PA`;
    return min ? `From ${currSymbol}${minL} PA` : `Up to ${currSymbol}${maxL} PA`;
  }
  const minK = min ? `${Math.round(min / 1000)}k` : '';
  const maxK = max ? `${Math.round(max / 1000)}k` : '';
  if (min && max) return `${currSymbol}${minK} - ${currSymbol}${maxK}/yr`;
  return min ? `From ${currSymbol}${minK}/yr` : `Up to ${currSymbol}${maxK}/yr`;
};

const getStatusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'applied') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Applied
      </span>
    );
  }
  if (s === 'reviewing' || s === 'under_review' || s === 'screening') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
        <Clock className="w-3 h-3 text-amber-500" />
        In Review
      </span>
    );
  }
  if (s === 'shortlisted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
        <Sparkles className="w-3 h-3 text-indigo-500" />
        Shortlisted
      </span>
    );
  }
  if (s === 'interview' || s === 'interviewing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
        <Calendar className="w-3 h-3 text-purple-500" />
        Interview Scheduled
      </span>
    );
  }
  if (s === 'offered' || s === 'selected' || s === 'hired') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        Offer Extended
      </span>
    );
  }
  if (s === 'rejected' || s === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        Not Selected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#162035] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 capitalize">
      {status}
    </span>
  );
};

export const CandidateDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [aiPromptInput, setAiPromptInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['candidateDashboard'],
    queryFn: async () => {
      const res = await api.get('/candidate/dashboard');
      return res.data?.data;
    },
  });

  const { data: savedJobsList = [] } = useQuery({
    queryKey: ['candidateSavedJobs'],
    queryFn: async () => {
      try {
        const res = await api.get('/jobs/saved/all');
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  const savedJobIds = useMemo(() => {
    return new Set(savedJobsList.map((item: any) => item.jobId?._id || item._id));
  }, [savedJobsList]);

  const toggleSaveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const isSaved = savedJobIds.has(jobId);
      if (isSaved) {
        await api.delete(`/jobs/${jobId}/save`);
        return { jobId, saved: false };
      } else {
        await api.post(`/jobs/${jobId}/save`);
        return { jobId, saved: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['candidateSavedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
      showToast(result.saved ? 'Job added to saved bookmarks!' : 'Job removed from bookmarks.');
    },
    onError: () => {
      showToast('Failed to update bookmark.', 'error');
    },
  });

  const handleAskAi = (promptText?: string) => {
    const query = (promptText || aiPromptInput).trim();
    if (!query) return;
    navigate('/candidate/ai-assistant', { state: { initialPrompt: query } });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your Candidate Career Workspace..." />;
  }

  const completion = data?.profileCompletionPercentage || 0;
  const metrics = data?.metrics || { totalApplications: 0, savedJobsCount: 0, upcomingInterviewsCount: 0 };
  const upcomingInterviews = data?.upcomingInterviews || [];
  const recentApplications = data?.recentApplications || [];
  const recommendedJobs = data?.recommendedJobs || [];
  const profile = data?.profile || {};

  // Dynamic profile readiness checklist items
  const readinessItems = [
    {
      id: 'resume',
      title: 'Resume Document',
      description: 'Upload ATS-friendly PDF',
      isComplete: Boolean(profile?.resumeUrl),
    },
    {
      id: 'skills',
      title: 'Core Skills',
      description: profile?.skills?.length ? `${profile.skills.length} skills added` : 'Add target skills',
      isComplete: Boolean(profile?.skills && profile.skills.length > 0),
    },
    {
      id: 'experience',
      title: 'Work Experience',
      description: profile?.experience?.length ? `${profile.experience.length} roles listed` : 'Add past roles',
      isComplete: Boolean(profile?.experience && profile.experience.length > 0),
    },
    {
      id: 'education',
      title: 'Education',
      description: profile?.education?.length ? `${profile.education.length} degrees added` : 'Add degrees/colleges',
      isComplete: Boolean(profile?.education && profile.education.length > 0),
    },
    {
      id: 'bio',
      title: 'Bio & Headline',
      description: profile?.headline ? 'Headline set' : 'Add professional summary',
      isComplete: Boolean(profile?.headline && profile?.bio),
    },
  ];

  const pendingItemsCount = readinessItems.filter((i) => !i.isComplete).length;

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] transition-colors py-8 sm:py-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-white dark:bg-[#0D1220] text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-[#0D1220] text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. Welcome Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-[#0B101D] dark:via-[#0F162A] dark:to-[#171330] rounded-3xl p-7 sm:p-9 text-white shadow-xl shadow-indigo-500/10 border border-white/10 dark:border-indigo-950/80">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/15 dark:bg-indigo-950/80 text-white dark:text-indigo-300 text-xs font-semibold border border-white/20 dark:border-indigo-800/80 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Candidate Career Workspace</span>
                <span className="text-white/40 dark:text-indigo-400/50">•</span>
                <span className="text-amber-200 dark:text-amber-300 font-bold">Live ATS</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white dark:text-[#F8FAFC]">
                Welcome back, {user?.name || user?.firstName || 'Candidate'}!
              </h1>

              <p className="text-xs sm:text-sm text-blue-100/90 dark:text-[#94A3B8] leading-relaxed">
                {profile?.headline ? (
                  <span className="font-semibold text-white dark:text-slate-200">{profile.headline} — </span>
                ) : null}
                Manage your active applications, track scheduled interviews, and leverage the AI Career Copilot to accelerate your job search.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => navigate('/candidate/ai-assistant')}
                className="px-5 py-2.5 rounded-2xl bg-white dark:bg-[#162035] hover:bg-slate-50 dark:hover:bg-[#1b2844] text-indigo-700 dark:text-[#F8FAFC] text-xs sm:text-sm font-bold shadow-md shadow-black/10 flex items-center gap-2 cursor-pointer transition-all border border-transparent dark:border-indigo-800/60"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
                <span>AI Career Copilot</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 dark:bg-[#0D1220]/70 dark:hover:bg-[#15203A] text-white text-xs sm:text-sm font-bold backdrop-blur-sm transition-all border border-white/20 dark:border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Explore Jobs</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Profile Readiness Card & Checklist */}
        <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Profile Readiness & Recruiter Reach
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    completion >= 80
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {completion}% Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                {completion === 100
                  ? 'Your profile is fully configured! Recruiters have maximum visibility into your credentials.'
                  : `${pendingItemsCount} high-impact section${pendingItemsCount > 1 ? 's' : ''} remaining to unlock top verified recruiter matches.`}
              </p>
            </div>

            <Link
              to="/candidate/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/70 dark:border-indigo-800/60 transition-colors self-start md:self-auto"
            >
              <span>Manage Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-[#162035] rounded-full h-3 overflow-hidden mb-6">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                completion >= 80
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600'
                  : 'bg-gradient-to-r from-amber-500 via-indigo-500 to-blue-600'
              }`}
              style={{ width: `${Math.max(completion, 5)}%` }}
            />
          </div>

          {/* Interactive Readiness Checklist Badges */}
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {readinessItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/candidate/profile')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  item.isComplete
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-400'
                    : 'bg-slate-50/60 dark:bg-[#131B2E]/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.title}
                  </span>
                  {item.isComplete ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-dashed border-amber-400 dark:border-amber-500 text-amber-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      +
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Actionable Metric Cards (4 KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Applications */}
          <div
            onClick={() => navigate('/candidate/applications')}
            className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-[#15203A] text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-indigo-900/50 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Submitted Applications
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] mt-1">
                {metrics.totalApplications}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Track status across ATS pipelines
              </p>
            </div>
          </div>

          {/* KPI 2: Bookmarked Jobs */}
          <div
            onClick={() => navigate('/candidate/saved-jobs')}
            className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-[#15203A] text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Bookmark className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Bookmarked Jobs
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] mt-1">
                {metrics.savedJobsCount}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Saved for review & quick apply
              </p>
            </div>
          </div>

          {/* KPI 3: Scheduled Interviews */}
          <div
            onClick={() => {
              const el = document.getElementById('interviews-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 dark:bg-[#15203A] text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/50 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1 transition-colors">
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Scheduled Interviews
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] mt-1">
                {metrics.upcomingInterviewsCount}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Active recruiter meeting invites
              </p>
            </div>
          </div>

          {/* KPI 4: Profile Readiness */}
          <div
            onClick={() => navigate('/candidate/profile')}
            className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-[#15203A] text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                <span>Edit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                Profile Readiness
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] mt-1">
                {completion}%
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {completion === 100 ? 'All sections fully complete' : 'Boost reach to recruiters'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Dual-Column Main Workspace: Recent Applications & Upcoming Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 Cols): Recent Applications Tracker */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-sm transition-colors">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Recent Applications
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Track ongoing recruiter evaluations & ATS stages
                </p>
              </div>

              <Link
                to="/candidate/applications"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 group"
              >
                <span>View All ({metrics.totalApplications})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#162035] text-slate-400 mx-auto flex items-center justify-center">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No applications submitted yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mx-auto">
                  Browse matching jobs tailored to your skills and submit your first application.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/jobs')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Browse Open Roles
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app: any) => {
                  const job = app.jobId;
                  const companyName = job?.companyId?.name || 'Verified Company';
                  const logoUrl = job?.companyId?.logoUrl;

                  return (
                    <div
                      key={app._id}
                      onClick={() => navigate(`/jobs/${job?._id || ''}`)}
                      className="p-4 sm:p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#101827] hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {getCompanyIcon(companyName, logoUrl)}

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {job?.title || 'Technical Position'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {companyName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {job?.location || 'Remote'} ({job?.remoteType || 'Full-time'})
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Applied on {new Date(app.appliedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 self-end sm:self-center">
                        {getStatusBadge(app.status)}

                        <span className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (1 Col): Upcoming Interviews & Career Milestones */}
          <div
            id="interviews-section"
            className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800/80 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Upcoming Interviews
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Recruiter meeting schedule
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                {upcomingInterviews.length} Scheduled
              </span>
            </div>

            {upcomingInterviews.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-[#15203A] text-purple-500 dark:text-purple-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No upcoming interviews
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                  Recruiters will send meeting invitations directly to your workspace once applications are shortlisted.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleAskAi('Help me prepare for technical interviews and system design rounds')}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Practice with AI Copilot</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {upcomingInterviews.map((iv: any) => {
                  const recruiter = iv.recruiterId;
                  const recruiterName = recruiter?.name || recruiter?.email || 'Recruiting Team';
                  return (
                    <div
                      key={iv._id}
                      className="p-4.5 rounded-2xl bg-purple-50/50 dark:bg-[#141C30] border border-purple-200/60 dark:border-indigo-900/60 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            {new Date(iv.scheduledAt).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(iv.scheduledAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                            With <span className="font-semibold text-slate-800 dark:text-slate-200">{recruiterName}</span> • {iv.duration || 45} mins
                          </p>
                        </div>
                      </div>

                      {iv.meetingNotes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-[#0D1220]/70 p-2.5 rounded-xl border border-purple-100 dark:border-purple-950">
                          {iv.meetingNotes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        {iv.meetingUrl ? (
                          <a
                            href={iv.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Join Meeting</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            handleAskAi(
                              `I have an upcoming interview with ${recruiterName}. Give me mock questions to practice.`
                            )
                          }
                          className="px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-[#0D1220] hover:bg-purple-50 dark:hover:bg-[#1A233A] text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>AI Prep</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5. Recommended Jobs for Candidate (Curated AI Skill Matching) */}
        <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2 border border-blue-200/70 dark:border-blue-800/60">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>AI Job Match Engine</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                Recommended for You
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                Curated opportunities based on your skills, experience, and location preferences
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-4.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#CBD5E1] text-xs font-bold self-start sm:self-auto cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span>Explore All Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recommendedJobs.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                No matching recommendations available. Add more skills to your profile to get personalized recommendations!
              </p>
              <Link
                to="/candidate/profile"
                className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
              >
                Update Skills on Profile →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recommendedJobs.map((job: any) => {
                const companyName = job.companyId?.name || 'Verified Company';
                const logoUrl = job.companyId?.logoUrl;
                const isVerified = job.companyId?.isVerified !== false;
                const isSaved = savedJobIds.has(job._id);
                const salaryStr = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

                return (
                  <div
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#101827] hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(15,23,42,0.6)] transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        {getCompanyIcon(companyName, logoUrl)}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium truncate">
                              {companyName}
                            </span>
                            {isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mt-0.5">
                            {job.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {job.location || 'Remote'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{job.remoteType || 'Full-time'}</span>
                            {salaryStr && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {salaryStr}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Bookmark Save Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveMutation.mutate(job._id);
                        }}
                        disabled={toggleSaveMutation.isPending}
                        title={isSaved ? 'Remove from saved' : 'Save job'}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                          isSaved
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-[#162035] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills?.slice(0, 3).map((s: string) => (
                          <span
                            key={s}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#162035] text-[10px] text-slate-600 dark:text-[#CBD5E1] font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job._id}`);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition-all"
                      >
                        <span>View Job</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. AI Career Copilot Interactive Quick-Prompts & Launcher */}
        <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-blue-900/10 dark:from-[#0E1528] dark:to-[#171330] rounded-3xl border border-indigo-200/70 dark:border-indigo-900/60 p-6 sm:p-8 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <span>AI Career Assistant Copilot</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Active
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Context-aware intelligence for resume scoring, interview drills, and career strategy
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/candidate/ai-assistant')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#283548] text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800/80 transition-all flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <span>Full Screen Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 AI Quick-Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              onClick={() =>
                handleAskAi('Review my profile and skills for ATS compatibility and suggest improvements')
              }
              className="p-4 rounded-2xl bg-white/80 dark:bg-[#121A2D] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                ATS Resume Optimization
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                Scan your profile and resume against modern recruiter filtering criteria.
              </p>
            </div>

            <div
              onClick={() =>
                handleAskAi('Conduct a mock technical interview for a senior software developer position')
              }
              className="p-4 rounded-2xl bg-white/80 dark:bg-[#121A2D] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Mock Technical Drill
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                Practice coding and system architecture questions with instant AI feedback.
              </p>
            </div>

            <div
              onClick={() =>
                handleAskAi('What skills and certifications are most in-demand for high-paying roles in 2026?')
              }
              className="p-4 rounded-2xl bg-white/80 dark:bg-[#121A2D] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Award className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Skill Gap & Market Value
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-relaxed">
                Identify trending capabilities and compensation benchmarks for your target roles.
              </p>
            </div>
          </div>

          {/* Quick-Prompt Interactive Input */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500 ml-3 shrink-0" />
            <input
              type="text"
              value={aiPromptInput}
              onChange={(e) => setAiPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskAi();
              }}
              placeholder="Ask AI anything: 'How do I answer tell me about yourself?' or 'Optimize my resume keywords'..."
              className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleAskAi()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
