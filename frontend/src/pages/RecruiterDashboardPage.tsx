import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { APPLICATION_STATUS } from '@jobconnect/shared';
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
} from 'lucide-react';

type ActiveModalType = 'jobs' | 'applicants' | 'interviews' | null;

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

  // Dashboard Overview Query
  const { data, isLoading } = useQuery({
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
    enabled: activeModal === 'interviews',
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading recruiter dashboard & metrics..." />;
  }

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

  const getStageBadgeColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
      case 'selected':
        return 'green';
      case 'interview':
        return 'purple';
      case 'under_review':
        return 'amber';
      case 'rejected':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Recruiter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Recruiter Portal</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Hiring Overview & Pipeline</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Welcome, {user?.name}</p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/recruiter/jobs/create')}>
          <Plus className="w-4 h-4 mr-1.5" /> Post New Job
        </Button>
      </div>

      {/* Metrics Row - All cards are interactive/clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Jobs Card */}
        <div
          onClick={() => setActiveModal('jobs')}
          role="button"
          tabIndex={0}
          className="group cursor-pointer bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-blue-100/90 dark:border-blue-900/40 p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-700/80 dark:text-blue-300 font-bold uppercase tracking-wider">Active Jobs</p>
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{data?.activeJobsCount || 0}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-100/60 dark:border-blue-900/40">
            <span className="text-[11px] text-blue-600/70 dark:text-blue-300/70 font-medium">Published & hiring</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Total Applicants Card */}
        <div
          onClick={() => openApplicantsWithFilter('all')}
          role="button"
          tabIndex={0}
          className="group cursor-pointer bg-gradient-to-br from-indigo-50/90 via-violet-50/40 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-indigo-100/90 dark:border-indigo-900/40 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 transition-all select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-indigo-700/80 dark:text-indigo-300 font-bold uppercase tracking-wider">Total Applicants</p>
            <div className="w-10 h-10 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{data?.totalApplicants || 0}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/40">
            <span className="text-[11px] text-indigo-600/70 dark:text-indigo-300/70 font-medium">Across all postings</span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Shortlisted Card */}
        <div
          onClick={() => openApplicantsWithFilter('shortlisted')}
          role="button"
          tabIndex={0}
          className="group cursor-pointer bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-100/90 dark:border-emerald-900/40 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300 font-bold uppercase tracking-wider">Shortlisted</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{funnel.shortlisted || 0}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100/60 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-600/70 dark:text-emerald-300/70 font-medium">Qualified candidates</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
              View list <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Upcoming Interviews Card */}
        <div
          onClick={() => setActiveModal('interviews')}
          role="button"
          tabIndex={0}
          className="group cursor-pointer bg-gradient-to-br from-purple-50/90 via-fuchsia-50/40 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-purple-100/90 dark:border-purple-900/40 p-6 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-0.5 transition-all select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-purple-700/80 dark:text-purple-300 font-bold uppercase tracking-wider">Upcoming Interviews</p>
            <div className="w-10 h-10 rounded-xl bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">{data?.upcomingInterviewsCount || 0}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-100/60 dark:border-purple-900/40">
            <span className="text-[11px] text-purple-600/70 dark:text-purple-300/70 font-medium">Scheduled rounds</span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center gap-0.5">
              View schedule <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Hiring Funnel Stage Bars - All boxes are interactive */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hiring Funnel Progression</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Click any box to inspect stage candidates</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-center">
          {/* Applied */}
          <div
            onClick={() => openApplicantsWithFilter('applied')}
            role="button"
            tabIndex={0}
            className="p-4 bg-gradient-to-b from-blue-50/90 to-blue-50/40 dark:from-blue-950/40 dark:to-slate-900/60 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 hover:-translate-y-0.5 transition-all group cursor-pointer select-none"
          >
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide block">Applied</span>
            <span className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1 block group-hover:scale-110 transition-transform">{funnel.applied}</span>
            <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5 block font-medium">New applicants</span>
            <span className="text-[9px] text-blue-700 dark:text-blue-300 font-semibold mt-1 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View stage <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>

          {/* Under Review */}
          <div
            onClick={() => openApplicantsWithFilter('under_review')}
            role="button"
            tabIndex={0}
            className="p-4 bg-gradient-to-b from-amber-50/90 to-amber-50/40 dark:from-amber-950/40 dark:to-slate-900/60 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 hover:-translate-y-0.5 transition-all group cursor-pointer select-none"
          >
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide block">Under Review</span>
            <span className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1 block group-hover:scale-110 transition-transform">{funnel.under_review}</span>
            <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5 block font-medium">Screening profile</span>
            <span className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold mt-1 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View stage <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>

          {/* Shortlisted */}
          <div
            onClick={() => openApplicantsWithFilter('shortlisted')}
            role="button"
            tabIndex={0}
            className="p-4 bg-gradient-to-b from-teal-50/90 to-teal-50/40 dark:from-teal-950/40 dark:to-slate-900/60 rounded-2xl border border-teal-200/80 dark:border-teal-900/50 shadow-xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 hover:-translate-y-0.5 transition-all group cursor-pointer select-none"
          >
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wide block">Shortlisted</span>
            <span className="text-2xl font-black text-teal-900 dark:text-teal-100 mt-1 block group-hover:scale-110 transition-transform">{funnel.shortlisted}</span>
            <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-0.5 block font-medium">Passed initial</span>
            <span className="text-[9px] text-teal-700 dark:text-teal-300 font-semibold mt-1 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View stage <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>

          {/* Interview */}
          <div
            onClick={() => openApplicantsWithFilter('interview')}
            role="button"
            tabIndex={0}
            className="p-4 bg-gradient-to-b from-purple-50/90 to-purple-50/40 dark:from-purple-950/40 dark:to-slate-900/60 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 hover:-translate-y-0.5 transition-all group cursor-pointer select-none"
          >
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide block">Interview</span>
            <span className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1 block group-hover:scale-110 transition-transform">{funnel.interview}</span>
            <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mt-0.5 block font-medium">In discussion</span>
            <span className="text-[9px] text-purple-700 dark:text-purple-300 font-semibold mt-1 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View stage <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>

          {/* Selected */}
          <div
            onClick={() => openApplicantsWithFilter('selected')}
            role="button"
            tabIndex={0}
            className="p-4 bg-gradient-to-b from-emerald-50/90 to-emerald-50/40 dark:from-emerald-950/40 dark:to-slate-900/60 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 hover:-translate-y-0.5 transition-all group cursor-pointer select-none"
          >
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide block">Selected</span>
            <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1 block group-hover:scale-110 transition-transform">{funnel.selected}</span>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5 block font-medium">Offer accepted 🎉</span>
            <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View stage <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>

          {/* Rejected */}
          <div
            onClick={() => openApplicantsWithFilter('rejected')}
            role="button"
            tabIndex={0}
            className="p-4 bg-gradient-to-b from-rose-50/90 to-rose-50/40 dark:from-rose-950/40 dark:to-slate-900/60 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 shadow-xs hover:shadow-md hover:border-rose-400 dark:hover:border-rose-600 hover:-translate-y-0.5 transition-all group cursor-pointer select-none"
          >
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide block">Rejected</span>
            <span className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1 block group-hover:scale-110 transition-transform">{funnel.rejected}</span>
            <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-0.5 block font-medium">Not matched</span>
            <span className="text-[9px] text-rose-700 dark:text-rose-300 font-semibold mt-1 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              View stage <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Active Postings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Postings</h2>
            </div>
            <button
              onClick={() => setActiveModal('jobs')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage All ({jobs.length})
            </button>
          </div>

          {jobs.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No job postings created yet.</p>
          ) : (
            <div className="space-y-2.5">
              {jobs.slice(0, 5).map((j: any) => (
                <div key={j._id} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-blue-200 dark:hover:border-blue-800/60 transition-all flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{j.title}</h4>
                    <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="capitalize">Status: <strong className="text-emerald-600 font-semibold">{j.status}</strong></span>
                      <span>•</span>
                      <span>Applicants: <strong className="text-blue-600 font-semibold">{j.applicantsCount || 0}</strong></span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/recruiter/jobs/${j._id}/applicants`)}
                    className="shadow-2xs text-xs font-semibold"
                  >
                    View Applicants
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applicants */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Applicants</h2>
            </div>
            <button
              onClick={() => openApplicantsWithFilter('all')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All ({data?.totalApplicants || 0})
            </button>
          </div>

          {recentApplicants.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No recent applicants.</p>
          ) : (
            <div className="space-y-2.5">
              {recentApplicants.slice(0, 5).map((app: any) => (
                <div key={app._id} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{app.candidateId?.name || 'Applicant'}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Applied for: <span className="font-medium text-slate-700 dark:text-slate-300">{app.jobId?.title}</span></p>
                  </div>
                  <Badge variant={getStageBadgeColor(app.status)}>
                    {app.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ACTIVE JOBS MODAL */}
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
                placeholder="Search your jobs..."
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
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No jobs found</p>
                <p className="text-xs text-slate-400 mt-0.5">Try a different search query or create a new job.</p>
              </div>
            ) : (
              filteredJobs.map((job: any) => (
                <div
                  key={job._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
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
                      <span>Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</span>
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
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Job
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
      {/* MODAL 2: APPLICANTS / HIRING FUNNEL MODAL */}
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
                placeholder="Search candidates by name, email, or applied job..."
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
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
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
                            <Badge variant={getStageBadgeColor(app.status)}>
                              {app.status?.toUpperCase().replace('_', ' ')}
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

                      {/* Resume & Job info */}
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
                        Applied for: <strong className="text-blue-600 dark:text-blue-400">{job?.title || 'Unknown Position'}</strong>
                      </span>
                      <span className="text-slate-400">
                        Date: {new Date(app.appliedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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
              <Calendar className="w-10 h-10 text-purple-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No scheduled interviews</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Interviews scheduled with candidates will appear here with meeting links and timings.
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
    </div>
  );
};
