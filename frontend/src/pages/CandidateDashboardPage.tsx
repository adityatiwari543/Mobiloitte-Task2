import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import {
  Briefcase,
  Bookmark,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const CandidateDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['candidateDashboard'],
    queryFn: async () => {
      const res = await api.get('/candidate/dashboard');
      return res.data?.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your personalized dashboard..." />;
  }

  const completion = data?.profileCompletionPercentage || 0;
  const metrics = data?.metrics || { totalApplications: 0, savedJobsCount: 0, upcomingInterviewsCount: 0 };
  const upcomingInterviews = data?.upcomingInterviews || [];
  const recentApplications = data?.recentApplications || [];
  const recommendedJobs = data?.recommendedJobs || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Candidate Portal</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 max-w-xl">
            Track your ongoing job applications, practice with the AI Career Assistant, and stay ahead in your technical hiring journey.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate('/candidate/ai-assistant')}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2 text-yellow-300" /> Open AI Assistant
        </Button>
      </div>

      {/* Profile Completion Bar (Section 25) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Profile Completeness</span>
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{completion}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Tip: Complete your profile with work experiences and skills to boost visibility to recruiters.{' '}
            <Link to="/candidate/profile" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Edit Profile →
            </Link>
          </p>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-blue-100/90 dark:border-blue-900/40 p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-blue-700/80 dark:text-blue-300 font-bold uppercase tracking-wider">Submitted Applications</p>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{metrics.totalApplications}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-100/90 dark:border-emerald-900/40 p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300 font-bold uppercase tracking-wider">Bookmarked Jobs</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.savedJobsCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50/90 via-fuchsia-50/40 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-purple-100/90 dark:border-purple-900/40 p-6 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-purple-700/80 dark:text-purple-300 font-bold uppercase tracking-wider">Scheduled Interviews</p>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{metrics.upcomingInterviewsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications Tracker */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Applications</h2>
            <Link to="/candidate/applications" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View All ({metrics.totalApplications})
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">You haven't submitted any job applications yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApplications.map((app: any) => (
                <div key={app._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{app.jobId?.title || 'Job Posting'}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={app.status === 'shortlisted' ? 'green' : app.status === 'interview' ? 'purple' : 'blue'}>
                    {app.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews Widget */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Upcoming Interviews</h2>
          {upcomingInterviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No interviews scheduled yet.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((iv: any) => (
                <div key={iv._id} className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 block">
                    {new Date(iv.scheduledAt).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                    Duration: {iv.duration} mins
                  </span>
                  {iv.meetingUrl && (
                    <a
                      href={iv.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[11px] text-purple-700 dark:text-purple-400 font-semibold underline"
                    >
                      Join Meeting Link →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Jobs for Candidate */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recommended for You</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Matched to your verified profile skills</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/jobs')}>
            Explore More Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedJobs.map((job: any) => (
            <div
              key={job._id}
              onClick={() => navigate(`/jobs/${job._id}`)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex justify-between items-start"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{job.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{job.companyId?.name} • {job.location}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {job.skills?.slice(0, 3).map((s: string) => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <Badge variant="blue">{job.remoteType}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
