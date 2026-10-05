import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import {
  Briefcase,
  Users,
  Calendar,
  Plus,
  ArrowRight,
  UserCheck,
  ExternalLink,
  FileText,
  Clock,
  Video,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
  User,
  Mail,
  Phone,
  Eye,
  Check,
  ChevronRight,
  Filter,
  Sparkles,
  MapPin,
  TrendingUp,
  Building,
  Award,
  MessageSquare,
  Bot,
  Zap,
  HelpCircle,
  Send,
  MoreVertical,
  Activity,
  Layers,
  CheckCircle,
} from 'lucide-react';

type ActiveModalType = 'jobs' | 'applicants' | 'interviews' | 'aiCopilot' | null;

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

export const RecruiterDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Modal & Filter States
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [applicantFilter, setApplicantFilter] = useState<string>('all');
  const [applicantSearch, setApplicantSearch] = useState<string>('');
  const [jobSearch, setJobSearch] = useState<string>('');

  // Status transition state inside modal
  const [updatingApp, setUpdatingApp] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [targetNote, setTargetNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // AI Copilot interactive states
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Dashboard Overview Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['recruiterDashboard'],
    queryFn: async () => {
      const res = await api.get('/companies/actions/dashboard');
      return res.data?.data;
    },
  });

  // Applicants List Query (fetched when applicants modal is open or filter changes)
  const {
    data: applicantsList = [],
    isLoading: isApplicantsLoading,
  } = useQuery({
    queryKey: ['recruiterApplicants', applicantFilter],
    queryFn: async () => {
      const q = applicantFilter !== 'all' ? `?status=${applicantFilter}` : '';
      const res = await api.get(`/applications/recruiter/applicants${q}`);
      return res.data?.data || [];
    },
    enabled: activeModal === 'applicants',
  });

  // Scheduled Interviews Query
  const {
    data: interviewsList = [],
    isLoading: isInterviewsLoading,
  } = useQuery({
    queryKey: ['recruiterInterviews'],
    queryFn: async () => {
      const res = await api.get('/applications/recruiter/interviews');
      return res.data?.data || [];
    },
    enabled: activeModal === 'interviews' || true, // Keep primed for upcoming interviews widget
  });

  const funnel = data?.funnel || {
    applied: 0,
    under_review: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
  };
  const recentApplicants = data?.recentApplicants || [];
  const jobs = data?.jobs || [];

  // Open applicants modal with a specific stage filter
  const openApplicantsWithFilter = (stage: string) => {
    setApplicantFilter(stage);
    setApplicantSearch('');
    setActiveModal('applicants');
  };

  // Status transition action
  const handleStageUpdate = async () => {
    if (!updatingApp || !targetStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/applications/${updatingApp._id}/status`, {
        status: targetStatus,
        note: targetNote.trim() || undefined,
      });
      setUpdatingApp(null);
      setTargetStatus('');
      setTargetNote('');
      queryClient.invalidateQueries({ queryKey: ['recruiterApplicants'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
    } catch (err) {
      console.error('Failed to update stage', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filtered applicants by search query
  const filteredApplicants = applicantsList.filter((app: any) => {
    if (!applicantSearch.trim()) return true;
    const q = applicantSearch.toLowerCase();
    const name = app.candidateId?.name?.toLowerCase() || '';
    const email = app.candidateId?.email?.toLowerCase() || '';
    const jobTitle = app.jobId?.title?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || jobTitle.includes(q);
  });

  // Filtered jobs by search query
  const filteredJobs = jobs.filter((j: any) => {
    if (!jobSearch.trim()) return true;
    const q = jobSearch.toLowerCase();
    const title = j.title?.toLowerCase() || '';
    const loc = j.location?.toLowerCase() || '';
    return title.includes(q) || loc.includes(q);
  });

  // Accessible Stage Badge configuration
  const getStageMeta = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return {
          label: 'Shortlisted',
          variant: 'green' as const,
          icon: <UserCheck className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />,
          dotBg: 'bg-emerald-500',
        };
      case 'selected':
        return {
          label: 'Selected (Offer)',
          variant: 'green' as const,
          icon: <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />,
          dotBg: 'bg-emerald-500',
        };
      case 'interview':
        return {
          label: 'Interview Round',
          variant: 'purple' as const,
          icon: <Video className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />,
          dotBg: 'bg-purple-500',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          variant: 'amber' as const,
          icon: <Clock3 className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />,
          dotBg: 'bg-amber-500',
        };
      case 'rejected':
        return {
          label: 'Archived',
          variant: 'red' as const,
          icon: <XCircle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />,
          dotBg: 'bg-rose-500',
        };
      default:
        return {
          label: 'Applied',
          variant: 'blue' as const,
          icon: <Clock className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />,
          dotBg: 'bg-blue-500',
        };
    }
  };

  // AI Assistant generator
  const handleRunAiCopilot = (templatePrompt?: string) => {
    const promptToRun = templatePrompt || aiPrompt;
    if (!promptToRun.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    // Dynamic prompt response generator for hiring copilot
    setTimeout(() => {
      if (promptToRun.toLowerCase().includes('interview questions')) {
        setAiResponse(`### Recommended 5-Stage Interview Questions
1. **System Design & Scaling**: "How would you architect a fault-tolerant microservice that processes 50,000 requests per minute with Redis caching?"
2. **State Management**: "Compare React Query / Server State against local Zustand / Redux state in enterprise web applications."
3. **Database Performance**: "Explain index selection strategy in MongoDB for composite queries with sort and range criteria."
4. **Resilience & Security**: "How do you protect REST endpoints from IDOR and rate limit abuse at the reverse-proxy layer?"
5. **Team Collaboration**: "Describe a situation where you had to push back on a feature scope to preserve technical debt and code quality."`);
      } else if (promptToRun.toLowerCase().includes('checklist') || promptToRun.toLowerCase().includes('screen')) {
        setAiResponse(`### Smart Candidate Screening Checklist
- **Core Technology Fit**: 3+ years demonstrable TypeScript, Node.js & React experience.
- **Production Architecture**: Hands-on familiarity with CI/CD pipelines, Docker, and cloud hosting.
- **Problem Solving**: Clear Git commit hygiene, code modularity, and automated test coverage.
- **Communication & Velocity**: Ability to clarify requirements and iterate with product managers autonomously.`);
      } else {
        setAiResponse(`### JobConnect AI Hiring Recommendation
Based on your open roles (${jobs.slice(0, 2).map((j: any) => j.title).join(', ') || 'Engineering Positions'}):
- Candidates responding within 48 hours show a **78% higher closing rate**.
- Consider moving candidates in 'Under Review' (>5 days) to 'Interview' or notifying them with feedback.
- Candidates with verified GitHub / LinkedIn profiles have a 2.1x lower attrition rate during probation.`);
      }
      setIsAiLoading(false);
    }, 600);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading recruiter dashboard & hiring pipeline..." />;
  }

  // Next upcoming interview for sidebar widget
  const upcomingInterview = interviewsList.length > 0 ? interviewsList[0] : null;

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: RECRUITER HEADER */}
        {/* ========================================================================= */}
        <div className="bg-white/80 dark:bg-[#0D1220]/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                  <Building className="w-3 h-3" /> Recruiter Portal
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Employer
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name || 'Recruiter'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track your active talent pipeline, schedule interviews, and screen candidates across all job postings.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/recruiter/jobs')}
                className="bg-white dark:bg-[#101827] border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs"
              >
                <Briefcase className="w-4 h-4 mr-1.5 text-slate-500" /> Manage Postings
              </Button>
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
        {/* SECTION 2: AI RECRUITER TALENT COPILOT BANNER */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-7 shadow-md">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs border border-white/25">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Talent Copilot
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Streamline Candidate Screening & Interview Preparation
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Generate tailored interview questions, match applicant skills against job requirements, and automate screening feedback in seconds.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setAiPrompt('Generate interview questions for our open role');
                  handleRunAiCopilot('Generate interview questions for our open role');
                  setActiveModal('aiCopilot');
                }}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 group"
              >
                <Bot className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                Launch AI Assistant
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => {
                  setAiPrompt('Screening checklist for candidates');
                  handleRunAiCopilot('Screening checklist for candidates');
                  setActiveModal('aiCopilot');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs backdrop-blur-xs transition-colors"
              >
                Screening Checklist
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: 4 KEY KPI METRIC CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active Jobs */}
          <div
            onClick={() => setActiveModal('jobs')}
            role="button"
            tabIndex={0}
            className="group cursor-pointer bg-white dark:bg-[#101827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Jobs</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {data?.activeJobsCount || jobs.length || 0}
              </span>
              <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> Live
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Published & accepting</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Card 2: Total Applicants */}
          <div
            onClick={() => openApplicantsWithFilter('all')}
            role="button"
            tabIndex={0}
            className="group cursor-pointer bg-white dark:bg-[#101827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 transition-all select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Applicants</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {data?.totalApplicants || 0}
              </span>
              <span className="text-xs text-slate-400">candidates</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Across all postings</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
                Explore <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Card 3: Shortlisted */}
          <div
            onClick={() => openApplicantsWithFilter('shortlisted')}
            role="button"
            tabIndex={0}
            className="group cursor-pointer bg-white dark:bg-[#101827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shortlisted</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {funnel.shortlisted || 0}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">qualified</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Ready for interview</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                Review <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Card 4: Upcoming Interviews */}
          <div
            onClick={() => setActiveModal('interviews')}
            role="button"
            tabIndex={0}
            className="group cursor-pointer bg-white dark:bg-[#101827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-0.5 transition-all select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Interviews</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {data?.upcomingInterviewsCount || interviewsList.length || 0}
              </span>
              <span className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium">scheduled</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Video & phone rounds</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center gap-0.5">
                View list <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: HIRING PIPELINE STAGE BREAKDOWN */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Hiring Overview & Pipeline</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track candidate progression across each hiring milestone. Click any stage to filter applicants.
              </p>
            </div>
            <button
              onClick={() => openApplicantsWithFilter('all')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              Open Full ATS Directory <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Stage 1: Applied */}
            <div
              onClick={() => openApplicantsWithFilter('applied')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:-translate-y-0.5 transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Stage 1</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block group-hover:scale-105 transition-transform">
                {funnel.applied}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">Applied</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">New submissions</span>
            </div>

            {/* Stage 2: Under Review */}
            <div
              onClick={() => openApplicantsWithFilter('under_review')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 hover:-translate-y-0.5 transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <Search className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Stage 2</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block group-hover:scale-105 transition-transform">
                {funnel.under_review}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">Under Review</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Resume screening</span>
            </div>

            {/* Stage 3: Shortlisted */}
            <div
              onClick={() => openApplicantsWithFilter('shortlisted')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 hover:-translate-y-0.5 transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-2">
                <UserCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Stage 3</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block group-hover:scale-105 transition-transform">
                {funnel.shortlisted}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">Shortlisted</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Passed review</span>
            </div>

            {/* Stage 4: Interview */}
            <div
              onClick={() => openApplicantsWithFilter('interview')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 hover:-translate-y-0.5 transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                <Video className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Stage 4</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block group-hover:scale-105 transition-transform">
                {funnel.interview}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">Interview</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">In discussions</span>
            </div>

            {/* Stage 5: Selected */}
            <div
              onClick={() => openApplicantsWithFilter('selected')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:-translate-y-0.5 transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Stage 5</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block group-hover:scale-105 transition-transform">
                {funnel.selected}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">Selected</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Offer accepted 🎉</span>
            </div>

            {/* Stage 6: Rejected */}
            <div
              onClick={() => openApplicantsWithFilter('rejected')}
              role="button"
              tabIndex={0}
              className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 hover:-translate-y-0.5 transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                <XCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Archive</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block group-hover:scale-105 transition-transform">
                {funnel.rejected}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">Rejected</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Not matched</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: 2-COLUMN MAIN CONTENT (70% / 30% SPLIT) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===================== LEFT COLUMN (Approx 70% / 8 Cols) ===================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SUB-SECTION A: YOUR JOB POSTINGS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Job Postings</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage active vacancies and inspect applicant counts per role.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('jobs')}
                    className="text-xs font-semibold"
                  >
                    All Postings ({jobs.length})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/recruiter/jobs/create')}
                    className="text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> New Job
                  </Button>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#101827]/40">
                  <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No job openings published yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Create your first job listing to start receiving high-quality applications and building your pipeline.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/recruiter/jobs/create')}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Post First Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job: any) => (
                    <div
                      key={job._id}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-[#101827]/60 hover:border-blue-300 dark:hover:border-blue-700/80 hover:bg-slate-50/80 dark:hover:bg-[#101827] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {job.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              job.status === 'published'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : job.status === 'paused'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {job.status === 'published' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />}
                            {job.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            {job.location || 'Remote'}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{job.employmentType || 'Full Time'}</span>
                          <span>•</span>
                          <span>Posted {formatTimeAgo(job.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-200/80 dark:border-blue-900/50">
                          {job.applicantsCount || 0} Applicants
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/recruiter/jobs/${job._id}/applicants`)}
                          className="text-xs font-semibold"
                        >
                          View Applicants
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/jobs/${job._id}`)}
                          title="View public job posting"
                          className="px-2"
                        >
                          <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUB-SECTION B: RECENT APPLICANTS TABLE/LIST */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Applicants</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Candidates who recently submitted applications across your postings.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openApplicantsWithFilter('all')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  View All Candidates ({data?.totalApplicants || 0}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentApplicants.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#101827]/40">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No applicants yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When candidates apply to your postings, they will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplicants.slice(0, 6).map((app: any) => {
                    const candidate = app.candidateId;
                    const job = app.jobId;
                    const meta = getStageMeta(app.status);

                    return (
                      <div
                        key={app._id}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-[#101827]/60 hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:bg-slate-50/80 dark:hover:bg-[#101827] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                            {candidate?.name ? candidate.name[0].toUpperCase() : 'C'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {candidate?.name || 'Applicant'}
                              </span>
                              <Badge variant={meta.variant} size="sm" className="font-semibold flex items-center">
                                {meta.icon}
                                {meta.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Applied for: <strong className="text-slate-800 dark:text-slate-200">{job?.title || 'Job Opening'}</strong>
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                              <span>{candidate?.email}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(app.appliedAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                          {app.resumeUrl && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 rounded-lg border border-blue-200/80 dark:border-blue-900/50 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" /> Resume
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUpdatingApp(app);
                              setTargetStatus(app.status);
                              setTargetNote('');
                              setActiveModal('applicants');
                            }}
                            className="text-xs font-semibold"
                          >
                            Manage Stage
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ===================== RIGHT COLUMN (Approx 30% / 4 Cols) ===================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* WIDGET 1: QUICK ACTIONS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
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
                        Create Job Posting
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Publish new vacancy</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => openApplicantsWithFilter('all')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101827] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        Applicants Directory
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Filter candidate pool</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveModal('interviews')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101827] hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Interview Schedule
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Video round meetings</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/recruiter/profile')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101827] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Company Branding
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Manage employer profile</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* WIDGET 2: NEXT UPCOMING INTERVIEW */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Next Interview
                </h3>
                <button
                  onClick={() => setActiveModal('interviews')}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  View All ({interviewsList.length})
                </button>
              </div>

              {upcomingInterview ? (
                <div className="p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/30 dark:to-[#101827] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {upcomingInterview.candidateId?.name || 'Interviewee'}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                      {upcomingInterview.duration || 45} mins
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Role: <span className="font-semibold">{upcomingInterview.applicationId?.jobId?.title || 'Open Position'}</span>
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(upcomingInterview.scheduledAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                  {upcomingInterview.meetingUrl && (
                    <a
                      href={upcomingInterview.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Video Call <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#101827]/30">
                  <Calendar className="w-6 h-6 text-purple-300 dark:text-purple-700 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No upcoming interviews today</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Shortlist candidates to schedule video rounds.</p>
                </div>
              )}
            </div>

            {/* WIDGET 3: RECENT HIRING ACTIVITY TIMELINE */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
              </h3>
              
              <div className="space-y-3">
                {recentApplicants.slice(0, 4).map((app: any, idx: number) => (
                  <div key={app._id || idx} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-300 truncate">
                        <span className="font-bold text-slate-900 dark:text-white">{app.candidateId?.name || 'Candidate'}</span> applied for{' '}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{app.jobId?.title || 'a role'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{formatTimeAgo(app.appliedAt)}</p>
                    </div>
                  </div>
                ))}

                {recentApplicants.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">No recent recruiter activity recorded.</p>
                )}
              </div>
            </div>

            {/* WIDGET 4: AI PRO-TIP */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 dark:border-amber-700/30 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                <Sparkles className="w-4 h-4" /> AI Hiring Tip
              </div>
              <p className="leading-relaxed">
                Postings that include transparent compensation ranges receive <strong>2.4x more qualified applications</strong> from senior engineers.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: YOUR JOB POSTINGS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'jobs'}
        onClose={() => setActiveModal(null)}
        title={`Your Job Postings (${jobs.length})`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search your jobs by title or location..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveModal(null);
                navigate('/recruiter/jobs/create');
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Post New Job
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No jobs match your search</p>
                <p className="text-xs text-slate-400 mt-0.5">Try a different title query or create a new vacancy.</p>
              </div>
            ) : (
              filteredJobs.map((job: any) => (
                <div
                  key={job._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{job.title}</h4>
                      <Badge variant={job.status === 'published' ? 'green' : job.status === 'closed' ? 'red' : 'amber'}>
                        {job.status?.toUpperCase()}
                      </Badge>
                      {job.remoteType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {job.remoteType}
                        </span>
                      )}
                      {job.employmentType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {job.employmentType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Location: <strong>{job.location || 'Remote'}</strong></span>
                      <span>•</span>
                      <span>Applicants: <strong className="text-blue-600 font-semibold">{job.applicantsCount || 0}</strong></span>
                      <span>•</span>
                      <span>Posted: {formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveModal(null);
                        navigate(`/jobs/${job._id}`);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Public
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActiveModal(null);
                        navigate(`/recruiter/jobs/${job._id}/applicants`);
                      }}
                    >
                      Applicants ({job.applicantsCount || 0})
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: APPLICANTS DIRECTORY / PIPELINE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'applicants'}
        onClose={() => {
          setActiveModal(null);
          setUpdatingApp(null);
        }}
        title={`Applicants Directory ${applicantFilter !== 'all' ? `(${applicantFilter.toUpperCase().replace('_', ' ')})` : ''}`}
        maxWidth="5xl"
      >
        <div className="space-y-4">
          {/* Stage Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Applicants', count: data?.totalApplicants || 0 },
              { id: 'applied', label: 'Applied', count: funnel.applied },
              { id: 'under_review', label: 'Under Review', count: funnel.under_review },
              { id: 'shortlisted', label: 'Shortlisted', count: funnel.shortlisted },
              { id: 'interview', label: 'Interview', count: funnel.interview },
              { id: 'selected', label: 'Selected', count: funnel.selected },
              { id: 'rejected', label: 'Rejected', count: funnel.rejected },
            ].map((tab) => {
              const active = applicantFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setApplicantFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar inside modal */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates by name, email, or applied position..."
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              Showing {filteredApplicants.length} candidate(s)
            </span>
          </div>

          {/* Loading or Applicants List */}
          {isApplicantsLoading ? (
            <div className="py-12">
              <LoadingSpinner message="Fetching applicants for this stage..." />
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No applicants in {applicantFilter === 'all' ? 'any stage' : `"${applicantFilter.replace('_', ' ')}"`}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {applicantSearch ? 'No matches for your search query.' : 'Candidates will appear here once they apply or are moved to this stage.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
              {filteredApplicants.map((app: any) => {
                const candidate = app.candidateId;
                const job = app.jobId;
                const meta = getStageMeta(app.status);
                const isUpdatingThis = updatingApp?._id === app._id;

                return (
                  <div
                    key={app._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-blue-300 dark:hover:border-blue-600 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Candidate info */}
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                          {candidate?.name ? candidate.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {candidate?.name || 'Applicant'}
                            </h4>
                            <Badge variant={meta.variant} size="sm" className="font-semibold flex items-center">
                              {meta.icon}
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="flex items-center">
                              <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {candidate?.email || 'No email'}
                            </span>
                            {candidate?.phoneE164 && (
                              <span className="flex items-center">
                                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {candidate.phoneE164}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Resume & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Resume
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isUpdatingThis) {
                              setUpdatingApp(null);
                            } else {
                              setUpdatingApp(app);
                              setTargetStatus(app.status);
                              setTargetNote('');
                            }
                          }}
                        >
                          {isUpdatingThis ? 'Cancel' : 'Change Stage'}
                        </Button>
                      </div>
                    </div>

                    {/* Applied Job & Date banner */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                      <span className="text-slate-600 dark:text-slate-300">
                        Applied for: <strong className="text-blue-600 dark:text-blue-400">{job?.title || 'Position'}</strong>
                      </span>
                      <span className="text-slate-400">
                        Date: {formatDate(app.appliedAt)}
                      </span>
                    </div>

                    {/* Cover Letter preview if present */}
                    {app.coverLetter && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 italic">
                        "{app.coverLetter}"
                      </p>
                    )}

                    {/* Inline Stage Update Box */}
                    {isUpdatingThis && (
                      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-3">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                          Update Pipeline Stage for {candidate?.name || 'Applicant'}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { value: 'under_review', label: 'Under Review' },
                            { value: 'shortlisted', label: 'Shortlist' },
                            { value: 'interview', label: 'Interview' },
                            { value: 'selected', label: 'Select (Offer)' },
                            { value: 'rejected', label: 'Reject' },
                          ].map((st) => (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() => setTargetStatus(st.value)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border text-left transition-all ${
                                targetStatus === st.value
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Optional recruiter note for candidate history..."
                            value={targetNote}
                            onChange={(e) => setTargetNote(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUpdatingApp(null)}
                            disabled={isUpdatingStatus}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleStageUpdate}
                            disabled={isUpdatingStatus || !targetStatus || targetStatus === app.status}
                          >
                            {isUpdatingStatus ? 'Updating...' : 'Save Stage Change'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: SCHEDULED INTERVIEWS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'interviews'}
        onClose={() => setActiveModal(null)}
        title={`Upcoming Scheduled Interviews (${interviewsList.length})`}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          {isInterviewsLoading ? (
            <div className="py-12">
              <LoadingSpinner message="Loading scheduled interviews..." />
            </div>
          ) : interviewsList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Calendar className="w-10 h-10 text-purple-300 dark:text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No scheduled interviews</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Interviews scheduled with candidates will appear here with video meeting links and timings.
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {interviewsList.map((iv: any) => {
                const candidate = iv.candidateId;
                const job = iv.applicationId?.jobId;

                return (
                  <div
                    key={iv._id}
                    className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/30 to-white dark:from-purple-950/20 dark:to-slate-800/90 hover:border-purple-300 transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {candidate?.name || 'Interviewee'}
                          </h4>
                          <Badge variant="purple">{iv.status?.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>{candidate?.email}</span>
                          {candidate?.phoneE164 && <span>{candidate.phoneE164}</span>}
                        </p>
                      </div>

                      {iv.meetingUrl ? (
                        <a
                          href={iv.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors shrink-0"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Meeting <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No link specified</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-lg border border-purple-100/80 dark:border-purple-900/40 flex-wrap">
                      <span className="flex items-center text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-purple-500" />
                        {new Date(iv.scheduledAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="flex items-center text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 mr-1 text-purple-500" />
                        {iv.duration} mins
                      </span>
                      {job?.title && (
                        <span className="text-slate-600 dark:text-slate-300">
                          Role: <strong className="text-purple-700 dark:text-purple-300">{job.title}</strong>
                        </span>
                      )}
                    </div>

                    {iv.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded border border-purple-100 dark:border-purple-900/30">
                        "{iv.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: AI TALENT COPILOT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={activeModal === 'aiCopilot'}
        onClose={() => setActiveModal(null)}
        title="AI Talent Copilot & Candidate Evaluator"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ask AI to generate interview kits, technical screening checklists, or role requirements for your open jobs.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              'Generate interview questions for our open role',
              'Screening checklist for candidates',
              'Tips to improve candidate response rate',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(preset);
                  handleRunAiCopilot(preset);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                ✦ {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about interviewing, screening, or candidate matching..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunAiCopilot();
              }}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRunAiCopilot()}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="shrink-0"
            >
              {isAiLoading ? 'Analyzing...' : <span className="flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Run AI</span>}
            </Button>
          </div>

          {/* AI Response Output */}
          {isAiLoading ? (
            <div className="py-8 text-center space-y-2">
              <LoadingSpinner message="AI Copilot is analyzing requirements..." />
            </div>
          ) : aiResponse ? (
            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {aiResponse}
            </div>
          ) : null}
        </div>
      </Modal>

    </div>
  );
};
