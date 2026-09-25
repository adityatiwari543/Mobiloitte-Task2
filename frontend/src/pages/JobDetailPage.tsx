import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Sparkles,
  Bookmark,
  Share2,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Send,
  ArrowRight,
} from 'lucide-react';
import { ROLES } from '@jobconnect/shared';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, profile } = useAuth();

  // Modals state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState(false);
  const [aiMatchModalOpen, setAiMatchModalOpen] = useState(false);

  // Application form state
  const [coverLetter, setCoverLetter] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const isCandidate = user?.role === ROLES.CANDIDATE;

  // Auto-redirect to /jobs when application is successful
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (applySuccess && applyModalOpen) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setApplyModalOpen(false);
            navigate('/jobs');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [applySuccess, applyModalOpen, navigate]);

  // Fetch Job Details
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  // Check whether candidate has already applied to this job
  const { data: myApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/me');
      return res.data?.data || [];
    },
    enabled: isCandidate,
  });

  const existingApplication = myApplications?.find((app: any) =>
    (app.jobId?._id || app.jobId) === id
  );
  const hasAlreadyApplied = !!existingApplication || applySuccess;

  // AI Summary Mutation
  const summaryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/job-summary', { jobId: id });
      return res.data?.data;
    },
  });

  // AI Match Mutation
  const matchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/match-score', { jobId: id });
      return res.data?.data;
    },
  });

  // Save Job Mutation
  const saveJobMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/jobs/${id}/save`);
    },
    onSuccess: () => {
      alert('Job added to saved bookmarks.');
    },
  });

  // Submit Application Mutation (Section 45, 50)
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.resumeUrl) {
        throw new Error('Please upload a resume in your Candidate Profile before applying.');
      }
      const res = await api.post(`/applications/jobs/${id}/apply`, {
        jobId: id,
        resumeUrl: profile.resumeUrl,
        coverLetter: coverLetter.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setApplySuccess(true);
      setApplyError(null);
      // Invalidate queries so data updates everywhere across candidate, jobs, and recruiter portals
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['candidateApplications'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['homeJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplicants'] });
    },
    onError: (err: any) => {
      setApplyError(err.response?.data?.error?.message || err.message || 'Failed to submit application.');
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading job posting details..." />;
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Job posting not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/jobs')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  const deadlineDate = new Date(job.applicationDeadline).toLocaleDateString();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <BackButton label="Back to Jobs" fallbackUrl="/jobs" />
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm mb-8 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {job.companyId?.name || 'Company'}
              </span>
              {job.companyId?.isVerified && (
                <span className="inline-flex items-center text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800">
                  ✓ Verified
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {job.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                {job.location} ({job.remoteType})
              </span>
              <span className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                <Briefcase className="w-4 h-4 mr-1 text-slate-400" />
                {job.employmentType}
              </span>
              <span className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                <DollarSign className="w-4 h-4 mr-1 text-slate-400" />
                {job.salaryMin && job.salaryMax
                  ? `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                  : 'Competitive Salary'}
              </span>
              <span className="flex items-center font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                Apply by: {deadlineDate}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
            {isCandidate ? (
              hasAlreadyApplied ? (
                <div className="flex flex-col gap-2 min-w-[220px]">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm">
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                      Applied on this Role
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full capitalize">
                      {existingApplication?.status || 'Applied'}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/jobs')}
                    className="w-full flex items-center justify-center shadow-md shadow-blue-500/20"
                  >
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Explore More Jobs
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setApplyError(null);
                    setApplySuccess(false);
                    setApplyModalOpen(true);
                  }}
                  className="shadow-md shadow-blue-500/20"
                >
                  Apply for Position
                </Button>
              )
            ) : !isAuthenticated ? (
              <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                Sign In to Apply
              </Button>
            ) : null}

            <div className="flex gap-2">
              {isCandidate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveJobMutation.mutate()}
                  isLoading={saveJobMutation.isPending}
                >
                  <Bookmark className="w-4 h-4 mr-1" /> Save
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAiSummaryModalOpen(true);
                  if (!summaryMutation.data) {
                    summaryMutation.mutate();
                  }
                }}
              >
                <Sparkles className="w-4 h-4 mr-1 text-purple-600" /> AI Summary
              </Button>

              {isCandidate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAiMatchModalOpen(true);
                    if (!matchMutation.data) {
                      matchMutation.mutate();
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1 text-blue-600" /> AI Match
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Full Description & Skills */}
        <div className="md:col-span-2 space-y-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-colors">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About the Role</h2>
            <div className="prose prose-slate max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Required Technical Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-100 dark:border-blue-900"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Key Details & Company Overview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Job Overview</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Experience Required</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {job.experienceMin} - {job.experienceMax} years
                </span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Work Mode</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{job.remoteType}</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Employment</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{job.employmentType}</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Views</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{job.viewsCount || 1} views</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Applicants</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{job.applicantsCount || 0} applied</span>
              </li>
            </ul>
          </div>

          {job.companyId && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{job.companyId.name}</h3>
              {job.companyId.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                  {job.companyId.description}
                </p>
              )}
              {job.companyId.website && (
                <a
                  href={job.companyId.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium block"
                >
                  Visit Company Website →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. Apply Modal (Section 50) */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={applySuccess ? 'Application Received' : `Apply to ${job.title}`}
        maxWidth="lg"
      >
        {applySuccess ? (
          <div className="py-6 px-2 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-md shadow-emerald-500/10">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 mb-2">
                ✓ Application Successfully Delivered
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Thank You, {user?.firstName || 'Candidate'}!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Aapki application successfully submit ho gayi hai! Your resume and profile have been delivered to the hiring team at{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{job.companyId?.name || 'the company'}</strong> for the position of{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{job.title}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Resume Attached:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {profile?.resumeOriginalName || 'Resume Document'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Application Status:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Applied (Under Review)
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Cover Letter:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {coverLetter.trim() ? 'Included with note' : 'Standard Submission'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center shadow-md shadow-blue-500/20"
                onClick={() => {
                  setApplyModalOpen(false);
                  navigate('/jobs');
                }}
              >
                <Briefcase className="w-4 h-4 mr-1.5" />
                Explore & Apply to More Jobs
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => {
                  setApplyModalOpen(false);
                  navigate('/candidate/applications');
                }}
              >
                View Applications
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Automatically redirecting to browse more job openings in{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-semibold">{countdown}s</strong>...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applyError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Resume</label>
              {profile?.resumeUrl ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {profile.resumeOriginalName || 'Attached Resume (PDF/DOCX)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Ready</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                  <span>No resume attached to your profile.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setApplyModalOpen(false);
                      navigate('/candidate/profile');
                    }}
                  >
                    Upload Resume
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Cover Letter / Note to Recruiter
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Introduce yourself and explain why your technical experience makes you a great fit..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setApplyModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => applyMutation.mutate()}
                isLoading={applyMutation.isPending}
                disabled={!profile?.resumeUrl || applyMutation.isPending}
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Submit Application
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. AI Summary Modal (Section 15.2) */}
      <Modal
        isOpen={aiSummaryModalOpen}
        onClose={() => setAiSummaryModalOpen(false)}
        title="AI Job Description Summary"
        maxWidth="lg"
      >
        {summaryMutation.isPending ? (
          <LoadingSpinner message="Extracting key role responsibilities & requirements..." />
        ) : summaryMutation.data ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 text-purple-900 dark:text-purple-200 leading-relaxed">
              <span className="font-bold block mb-1">Overview:</span>
              {summaryMutation.data.roleOverview}
            </div>

            {summaryMutation.data.coreResponsibilities && (
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Core Responsibilities:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  {summaryMutation.data.coreResponsibilities.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {summaryMutation.data.mustHaveSkills && (
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Must-Have Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {summaryMutation.data.mustHaveSkills.map((s: string, i: number) => (
                    <Badge key={i} variant="blue">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {summaryMutation.data.missingInformation && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Note:</span>
                {summaryMutation.data.missingInformation}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load AI summary.</p>
        )}
      </Modal>

      {/* 3. AI Match Modal (Section 15.3) */}
      <Modal
        isOpen={aiMatchModalOpen}
        onClose={() => setAiMatchModalOpen(false)}
        title="Candidate Profile-to-Job Match Analysis"
        maxWidth="lg"
      >
        {matchMutation.isPending ? (
          <LoadingSpinner message="Comparing candidate skills with role requirements..." />
        ) : matchMutation.data ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-200">
              <span className="font-bold">Overall Match Assessment:</span>
              <Badge variant="green">{matchMutation.data.overallMatchGrade || 'Strong Match'}</Badge>
            </div>

            {matchMutation.data.strengthsAnalysis && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Strengths:</span>
                {matchMutation.data.strengthsAnalysis}
              </div>
            )}

            {matchMutation.data.technicalSkillsMatch && (
              <div className="space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Skills Breakdown:</span>
                <div className="flex flex-wrap gap-1.5">
                  {matchMutation.data.technicalSkillsMatch.matchingSkills?.map((s: string) => (
                    <Badge key={s} variant="green">✓ {s}</Badge>
                  ))}
                  {matchMutation.data.technicalSkillsMatch.missingOrRecommendedSkills?.map((s: string) => (
                    <Badge key={s} variant="amber">+ {s} (Recommended)</Badge>
                  ))}
                </div>
              </div>
            )}

            {matchMutation.data.preparationTips && (
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Interview Preparation Tips:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  {matchMutation.data.preparationTips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-2 border-t border-slate-100 dark:border-slate-800">
              {matchMutation.data.disclaimer}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">Failed to load match analysis.</p>
        )}
      </Modal>
    </div>
  );
};
