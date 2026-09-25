import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { BackButton } from '../components/common/BackButton.js';
import { Briefcase, Plus, Users, Pause, Play, CheckCircle, Trash2, Edit } from 'lucide-react';

export const RecruiterJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['recruiterJobs'],
    queryFn: async () => {
      const res = await api.get('/companies/actions/dashboard');
      return res.data?.data?.jobs || [];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/jobs/${id}/publish`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/jobs/${id}/pause`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] }),
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/jobs/${id}/close`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] }),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your job postings..." />;
  }

  const jobs = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/recruiter/dashboard" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Job Postings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Control visibility, update statuses, and inspect candidate applicant pools</p>
        </div>

        <Button variant="primary" size="md" onClick={() => navigate('/recruiter/jobs/create')}>
          <Plus className="w-4 h-4 mr-1.5" /> Post New Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job postings created"
          description="Create your first job posting to start receiving qualified applicant submissions."
          actionText="Create Job"
          onAction={() => navigate('/recruiter/jobs/create')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Job Title</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Applicants</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job: any) => (
                <tr key={job._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">
                    <span
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      {job.title}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      variant={
                        job.status === 'published'
                          ? 'green'
                          : job.status === 'paused'
                          ? 'amber'
                          : 'gray'
                      }
                    >
                      {job.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/recruiter/jobs/${job._id}/applicants`)}
                    >
                      <Users className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
                      View Applicants
                    </Button>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {job.status === 'paused' ? (
                      <button
                        title="Publish"
                        onClick={() => publishMutation.mutate(job._id)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        title="Pause"
                        onClick={() => pauseMutation.mutate(job._id)}
                        className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      title="Close"
                      onClick={() => closeMutation.mutate(job._id)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete job "${job.title}"?`)) {
                          deleteMutation.mutate(job._id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
