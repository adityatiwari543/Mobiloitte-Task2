import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Briefcase,
  Plus,
  Users,
  Pause,
  Play,
  CheckCircle,
  Trash2,
  Edit3,
  Search,
  Filter,
  X,
  MapPin,
  Clock,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Eye,
  AlertCircle,
  MoreVertical,
  Check,
  TrendingUp,
  Layers,
  ArrowRight,
  XCircle,
  RotateCcw,
  Zap,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { REMOTE_TYPES, EMPLOYMENT_TYPES, JOB_STATUS } from '@jobconnect/shared';

// Date formatters
const formatDate = (dateString?: string | Date) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const formatTimeAgo = (dateString?: string | Date) => {
  if (!dateString) return 'Recently';
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
  } catch {
    return 'Recently';
  }
};

const formatSalary = (min?: number, max?: number, currency = 'INR') => {
  if (!min && !max) return null;
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  const formatNum = (num: number) => {
    if (num >= 100000) return `${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };
  if (min && max) return `${symbol}${formatNum(min)} – ${symbol}${formatNum(max)}`;
  if (min) return `From ${symbol}${formatNum(min)}`;
  if (max) return `Up to ${symbol}${formatNum(max)}`;
  return null;
};

type ActionModalType = 'pause' | 'resume' | 'close' | 'delete' | 'edit' | 'aiOptimizer' | null;

export const RecruiterJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [workModeFilter, setWorkModeFilter] = useState(searchParams.get('mode') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const itemsPerPage = 8;

  // Modals & Action State
  const [activeModal, setActiveModal] = useState<ActionModalType>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Job Form State
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editRemoteType, setEditRemoteType] = useState('onsite');
  const [editEmploymentType, setEditEmploymentType] = useState('full-time');
  const [editSalaryMin, setEditSalaryMin] = useState<string>('');
  const [editSalaryMax, setEditSalaryMax] = useState<string>('');
  const [editExperienceMin, setEditExperienceMin] = useState<string>('');
  const [editExperienceMax, setEditExperienceMax] = useState<string>('');
  const [editSkills, setEditSkills] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // AI JD Generator State
  const [aiTitle, setAiTitle] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [aiSkills, setAiSkills] = useState('');
  const [aiExperience, setAiExperience] = useState(3);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync state with URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (workModeFilter !== 'all') params.mode = workModeFilter;
    if (sortBy !== 'newest') params.sort = sortBy;
    if (currentPage > 1) params.page = String(currentPage);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, statusFilter, typeFilter, workModeFilter, sortBy, currentPage, setSearchParams]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch recruiter dashboard overview data
  const { data: overviewData, isLoading, isError, refetch } = useQuery({
    queryKey: ['recruiterJobsOverview'],
    queryFn: async () => {
      const res = await api.get('/companies/actions/dashboard');
      return res.data?.data;
    },
  });

  const allJobs: any[] = overviewData?.jobs || [];
  const funnel = overviewData?.funnel || {};
  const recentApplicants = overviewData?.recentApplicants || [];

  // Mutations for job lifecycle
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/jobs/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobsOverview'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
      setActiveModal(null);
      setToastMessage({ type: 'success', text: 'Job posting published successfully!' });
    },
    onError: () => {
      setToastMessage({ type: 'error', text: 'Failed to publish job posting. Please try again.' });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/jobs/${id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobsOverview'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
      setActiveModal(null);
      setToastMessage({ type: 'success', text: 'Job posting paused. No new candidates can apply.' });
    },
    onError: () => {
      setToastMessage({ type: 'error', text: 'Failed to pause job posting.' });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/jobs/${id}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobsOverview'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
      setActiveModal(null);
      setToastMessage({ type: 'success', text: 'Job posting closed successfully.' });
    },
    onError: () => {
      setToastMessage({ type: 'error', text: 'Failed to close job posting.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobsOverview'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
      setActiveModal(null);
      setToastMessage({ type: 'success', text: 'Job posting deleted permanently.' });
    },
    onError: () => {
      setToastMessage({ type: 'error', text: 'Failed to delete job posting.' });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await api.patch(`/jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobsOverview'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
      setActiveModal(null);
      setToastMessage({ type: 'success', text: 'Job posting updated successfully!' });
    },
    onError: () => {
      setToastMessage({ type: 'error', text: 'Failed to update job details.' });
    },
  });

  // Open Edit Modal with prefilled data
  const handleOpenEdit = (job: any) => {
    setSelectedJob(job);
    setEditTitle(job.title || '');
    setEditLocation(job.location || '');
    setEditRemoteType(job.remoteType || 'onsite');
    setEditEmploymentType(job.employmentType || 'full-time');
    setEditSalaryMin(job.salaryMin !== undefined && job.salaryMin !== null ? String(job.salaryMin) : '');
    setEditSalaryMax(job.salaryMax !== undefined && job.salaryMax !== null ? String(job.salaryMax) : '');
    setEditExperienceMin(job.experienceMin !== undefined && job.experienceMin !== null ? String(job.experienceMin) : '');
    setEditExperienceMax(job.experienceMax !== undefined && job.experienceMax !== null ? String(job.experienceMax) : '');
    setEditSkills(job.skills?.join(', ') || '');
    setEditDescription(job.description || '');
    setActiveModal('edit');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    const payload: any = {
      title: editTitle.trim(),
      location: editLocation.trim(),
      remoteType: editRemoteType,
      employmentType: editEmploymentType,
      description: editDescription.trim(),
      skills: editSkills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    };

    if (editSalaryMin) payload.salaryMin = Number(editSalaryMin);
    if (editSalaryMax) payload.salaryMax = Number(editSalaryMax);
    if (editExperienceMin) payload.experienceMin = Number(editExperienceMin);
    if (editExperienceMax) payload.experienceMax = Number(editExperienceMax);

    editMutation.mutate({ id: selectedJob._id, data: payload });
  };

  // Run AI JD Generator using existing backend endpoint /ai/generate-jd
  const handleRunAiOptimizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle.trim()) return;

    setIsAiLoading(true);
    setAiResult(null);

    try {
      const skillsArray = aiSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/ai/generate-jd', {
        title: aiTitle,
        notes: aiNotes,
        skills: skillsArray.length > 0 ? skillsArray : ['React', 'TypeScript', 'Node.js'],
        experienceYears: aiExperience,
      });

      setAiResult(res.data?.data);
    } catch {
      setToastMessage({ type: 'error', text: 'AI generation failed. Please try again.' });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return allJobs
      .filter((job) => {
        // Search filter
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase();
          const matchTitle = job.title?.toLowerCase().includes(q);
          const matchLoc = job.location?.toLowerCase().includes(q);
          const matchCompany = job.companyId?.name?.toLowerCase().includes(q);
          const matchSkills = job.skills?.some((s: string) => s.toLowerCase().includes(q));
          if (!matchTitle && !matchLoc && !matchCompany && !matchSkills) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && job.status !== statusFilter) {
          return false;
        }

        // Employment Type filter
        if (typeFilter !== 'all' && job.employmentType !== typeFilter) {
          return false;
        }

        // Remote/Work mode filter
        if (workModeFilter !== 'all' && job.remoteType !== workModeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'most_applicants') {
          return (b.applicantsCount || 0) - (a.applicantsCount || 0);
        }
        if (sortBy === 'least_applicants') {
          return (a.applicantsCount || 0) - (b.applicantsCount || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [allJobs, debouncedSearch, statusFilter, typeFilter, workModeFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    workModeFilter !== 'all' ||
    sortBy !== 'newest';

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setWorkModeFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Pause className="w-3 h-3 text-amber-500" />
            Paused
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3 h-3 text-slate-400" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <FileText className="w-3 h-3 text-blue-500" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        
        {/* Back navigation */}
        <div>
          <BackButton label="Back to Dashboard" fallbackUrl="/recruiter/dashboard" />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: PAGE HEADER */}
        {/* ========================================================================= */}
        <div className="bg-white/80 dark:bg-[#0D1220]/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                  <Briefcase className="w-3 h-3" /> Recruiter Workspace
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {allJobs.length} Total Postings
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Manage Job Postings
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create, update, pause, and track your job postings, candidate submissions, and hiring performance.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/recruiter/jobs/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Post New Job
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: AI JOB OPTIMIZATION BANNER */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-blue-950 border border-indigo-700/40 text-white p-5 sm:p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-full bg-radial from-blue-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">✦ AI Job Description Optimizer</h3>
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Optimize your requirements, generate responsibilities, and attract 2.4x more qualified applicants with AI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setAiTitle('');
                  setAiNotes('');
                  setAiSkills('');
                  setAiResult(null);
                  setActiveModal('aiOptimizer');
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" /> Open AI Assistant →
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: SEARCH & FILTER TOOLBAR */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by job title, skills, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>

              {/* Job Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>

              {/* Work Mode Filter */}
              <select
                value={workModeFilter}
                onChange={(e) => {
                  setWorkModeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Work Modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_applicants">Most Applicants</option>
                <option value="least_applicants">Least Applicants</option>
                <option value="title">Title (A-Z)</option>
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 font-semibold transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>
              Showing {filteredJobs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} matching jobs
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">Filtered results active</span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: MAIN WORKSPACE (JOBS LIST + SUMMARY SIDEBAR) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT: JOB POSTINGS LIST (~70% / 8 Cols) ================= */}
          <div className="lg:col-span-8 space-y-4">
            
            {isLoading ? (
              // Skeleton loading state mimicking actual rows
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0D1220] animate-pulse space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              // Error state
              <div className="text-center py-12 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to load job postings</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  A temporary connection issue prevented jobs from loading. Please retry.
                </p>
                <Button variant="primary" size="sm" onClick={() => refetch()}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry Loading
                </Button>
              </div>
            ) : allJobs.length === 0 ? (
              // Empty state when recruiter has 0 jobs
              <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] space-y-4">
                <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No job postings created yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Publish your first job vacancy to start receiving high-quality candidate submissions and building your talent pool.
                  </p>
                </div>
                <Button variant="primary" size="md" onClick={() => navigate('/recruiter/jobs/create')}>
                  <Plus className="w-4 h-4 mr-1.5" /> Post Your First Job
                </Button>
              </div>
            ) : filteredJobs.length === 0 ? (
              // Empty state when search filters yield 0
              <div className="text-center py-14 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] space-y-3">
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No jobs match your search</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search query, clearing your filters, or sorting differently.
                </p>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              // Job cards list (Desktop & Mobile optimized)
              <div className="space-y-3.5">
                {paginatedJobs.map((job) => {
                  const company = job.companyId;
                  const salaryStr = formatSalary(job.salaryMin, job.salaryMax, job.currency);

                  return (
                    <div
                      key={job._id}
                      className="group relative p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0D1220] hover:border-blue-400 dark:hover:border-blue-600/80 hover:shadow-md transition-all duration-300 space-y-4"
                    >
                      {/* Top Row: Company identity, Title, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Company Logo or Avatar */}
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-200 shrink-0 overflow-hidden shadow-2xs">
                            {company?.logoUrl ? (
                              <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span>{job.title ? job.title[0].toUpperCase() : 'J'}</span>
                            )}
                          </div>

                          {/* Title & Company Name */}
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                onClick={() => navigate(`/jobs/${job._id}`)}
                                className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors truncate"
                              >
                                {job.title}
                              </h3>
                              {getStatusBadge(job.status)}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {company?.name || 'Your Company'}
                              </span>
                              {company?.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              <span>•</span>
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                                {job.location || 'Remote'}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{job.remoteType || 'Onsite'}</span>
                              <span>•</span>
                              <span className="capitalize">{job.employmentType || 'Full-time'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Top Right: Applicants count pill & mobile action trigger */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <button
                            onClick={() => navigate(`/recruiter/jobs/${job._id}/applicants`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{job.applicantsCount || 0} Applicants</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setOpenActionsId(openActionsId === job._id ? null : job._id)}
                            title="Toggle Actions Menu"
                            className="sm:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Skills and Salary tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {salaryStr && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                              {salaryStr}
                            </span>
                          )}
                          {(job.experienceMin !== undefined || job.experienceMax !== undefined) && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {job.experienceMin || 0}–{job.experienceMax || 5}+ Yrs Exp
                            </span>
                          )}
                          {job.skills?.slice(0, 3).map((sk: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                          {job.skills && job.skills.length > 3 && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400">
                          Posted {formatTimeAgo(job.createdAt)}
                        </span>
                      </div>

                      {/* Bottom Row: Status-aware Actions (Emerges / Slides out on hover) */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                          openActionsId === job._id
                            ? 'max-h-28 opacity-100 translate-y-0 pt-3 border-t border-slate-100 dark:border-slate-800/80'
                            : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none group-hover:max-h-28 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:pt-3 group-hover:border-t group-hover:border-slate-100 dark:group-hover:border-slate-800/80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#101827]/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/jobs/${job._id}`)}
                              className="text-xs font-semibold bg-white dark:bg-[#0D1220]"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" /> View Job
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(job)}
                              className="text-xs font-semibold bg-white dark:bg-[#0D1220]"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-500" /> Edit Job
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Pause / Resume action */}
                            {job.status === 'paused' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setActiveModal('resume');
                                }}
                                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 bg-white dark:bg-[#0D1220]"
                              >
                                <Play className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Resume Job
                              </Button>
                            ) : job.status === 'published' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setActiveModal('pause');
                                }}
                                className="text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 bg-white dark:bg-[#0D1220]"
                              >
                                <Pause className="w-3.5 h-3.5 mr-1 text-amber-500" /> Pause Job
                              </Button>
                            ) : null}

                            {/* Close Job action */}
                            {job.status !== 'closed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setActiveModal('close');
                                }}
                                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-white dark:bg-[#0D1220]"
                              >
                                Close
                              </Button>
                            )}

                            {/* Delete Job action */}
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setActiveModal('delete');
                              }}
                              title="Delete Job"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs font-semibold"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ================= RIGHT: SIDEBAR SUMMARY (~30% / 4 Cols - Sticky) ================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* WIDGET 1: JOB POSTING SUMMARY */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Posting Summary
                </h3>
                <span className="text-xs text-slate-400">Real-time</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold text-blue-600 uppercase block">Active Jobs</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                    {overviewData?.activeJobsCount || allJobs.filter((j) => j.status === 'published').length || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Published & live</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase block">Applicants</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                    {overviewData?.totalApplicants || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Across all roles</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase block">Shortlisted</span>
                  <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                    {funnel.shortlisted || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Passed review</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold text-purple-600 uppercase block">Interviews</span>
                  <span className="text-2xl font-black text-purple-600 mt-0.5 block">
                    {overviewData?.upcomingInterviewsCount || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Scheduled rounds</span>
                </div>
              </div>
            </div>

            {/* WIDGET 2: QUICK ACTIONS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/recruiter/jobs/create')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101827] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Post New Job
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Create a new vacancy</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/recruiter/dashboard')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101827] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        Manage Applicants
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Review candidate pipeline</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    setAiTitle('');
                    setAiNotes('');
                    setAiSkills('');
                    setAiResult(null);
                    setActiveModal('aiOptimizer');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101827] hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        AI Job Optimizer
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Draft responsibilities & skills</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* WIDGET 3: RECENT ACTIVITY */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Recent Activity
              </h3>
              
              <div className="space-y-3">
                {recentApplicants.slice(0, 4).map((app: any, idx: number) => (
                  <div key={app._id || idx} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-300 truncate">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {app.candidateId?.name || 'Applicant'}
                        </span> applied for{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {app.jobId?.title || 'Open Role'}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400">{formatTimeAgo(app.appliedAt)}</p>
                    </div>
                  </div>
                ))}

                {recentApplicants.length === 0 && (
                  <p className="text-xs text-slate-400 py-2 text-center">No recent activity recorded.</p>
                )}
              </div>
            </div>

            {/* WIDGET 4: AI HIRING CTA */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent border border-blue-300/40 dark:border-blue-700/30 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4 text-amber-500" /> AI Hiring Tip
              </div>
              <p className="leading-relaxed">
                Job postings that mention clear remote policies and 4–6 core skills attract <strong>40% faster applicants</strong> on JobConnect.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PAUSE JOB CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'pause'}
        onClose={() => setActiveModal(null)}
        title="Pause Job Posting"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to pause <strong>"{selectedJob?.title}"</strong>? Candidates will no longer be able to discover or submit new applications to this job while it is paused.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => pauseMutation.mutate(selectedJob?._id)}
              disabled={pauseMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {pauseMutation.isPending ? 'Pausing...' : 'Confirm Pause'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: RESUME JOB CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'resume'}
        onClose={() => setActiveModal(null)}
        title="Resume Job Posting"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Resume <strong>"{selectedJob?.title}"</strong>? This will make the job publicly visible again on the JobConnect search board and allow candidates to apply immediately.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => publishMutation.mutate(selectedJob?._id)}
              disabled={publishMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {publishMutation.isPending ? 'Resuming...' : 'Confirm Resume'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CLOSE JOB CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'close'}
        onClose={() => setActiveModal(null)}
        title="Close Job Posting"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to close <strong>"{selectedJob?.title}"</strong>? This will mark the position as filled or closed. Candidates will not be able to submit new applications.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => closeMutation.mutate(selectedJob?._id)}
              disabled={closeMutation.isPending}
              className="bg-slate-700 hover:bg-slate-800 text-white"
            >
              {closeMutation.isPending ? 'Closing...' : 'Close Job'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE JOB CONFIRMATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
        title="Delete Job Posting"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
            <strong>Warning:</strong> This action cannot be undone. All posting details will be permanently removed from your recruiter account.
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please confirm you want to delete <strong>"{selectedJob?.title}"</strong>.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => deleteMutation.mutate(selectedJob?._id)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT JOB MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'edit'}
        onClose={() => setActiveModal(null)}
        title={`Edit Job Posting: ${selectedJob?.title || ''}`}
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remote Type
              </label>
              <select
                value={editRemoteType}
                onChange={(e) => setEditRemoteType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type
              </label>
              <select
                value={editEmploymentType}
                onChange={(e) => setEditEmploymentType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Salary Range (Min - Max INR)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min (e.g. 800000)"
                  value={editSalaryMin}
                  onChange={(e) => setEditSalaryMin(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  placeholder="Max (e.g. 1600000)"
                  value={editSalaryMax}
                  onChange={(e) => setEditSalaryMax(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Experience Required (Min - Max Yrs)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min Yrs"
                  value={editExperienceMin}
                  onChange={(e) => setEditExperienceMin(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  placeholder="Max Yrs"
                  value={editExperienceMax}
                  onChange={(e) => setEditExperienceMax(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Required Skills (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, TypeScript, Node.js, MongoDB"
              value={editSkills}
              onChange={(e) => setEditSkills(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Job Description
            </label>
            <textarea
              rows={5}
              required
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? 'Saving...' : 'Save Job Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: AI JOB OPTIMIZER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'aiOptimizer'}
        onClose={() => setActiveModal(null)}
        title="AI Job Description Optimizer"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by JobConnect's AI engine. Enter your target role to generate optimized job overviews, key responsibilities, and relevant skills.
          </p>

          <form onSubmit={handleRunAiOptimizer} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job Role / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Architect"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Experience Years
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={aiExperience}
                  onChange={(e) => setAiExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Technologies (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Next.js, TypeScript, Tailwind, REST APIs"
                value={aiSkills}
                onChange={(e) => setAiSkills(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Additional Notes / Priorities
              </label>
              <input
                type="text"
                placeholder="e.g. High focus on micro-frontends and team mentorship"
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isAiLoading || !aiTitle.trim()}
              >
                {isAiLoading ? (
                  'Generating AI Profile...'
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Generate Optimized Description
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* AI Result Card */}
          {aiResult && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                  {aiResult.title || aiTitle}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveModal(null);
                    navigate('/recruiter/jobs/create');
                  }}
                  className="text-xs"
                >
                  Apply in New Job <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              {aiResult.overview && (
                <div>
                  <strong className="block text-slate-700 dark:text-slate-300 mb-0.5">Overview:</strong>
                  <p className="text-slate-600 dark:text-slate-400">{aiResult.overview}</p>
                </div>
              )}

              {aiResult.responsibilities && (
                <div>
                  <strong className="block text-slate-700 dark:text-slate-300 mb-0.5">Key Responsibilities:</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                    {aiResult.responsibilities.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiResult.preferredSkills && (
                <div>
                  <strong className="block text-slate-700 dark:text-slate-300 mb-1">Recommended Skills:</strong>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.preferredSkills.map((sk: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
