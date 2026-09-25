import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import { Pause, Play, CheckCircle, Trash2 } from 'lucide-react';

export const AdminJobsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: async () => {
      const res = await api.get('/admin/jobs');
      return res.data?.data?.items || [];
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ jobId, action }: { jobId: string; action: string }) => {
      await api.patch(`/admin/jobs/${jobId}/moderate`, { action });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminJobs'] }),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading job listings for moderation..." />;
  }

  const jobs = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/admin/dashboard" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Content Moderation</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review live listings, enforce community guidelines, and moderate inappropriate postings</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-6">Job Title</th>
              <th className="py-3.5 px-6">Company</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {jobs.map((job: any) => (
              <tr key={job._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-slate-100">{job.title}</td>
                <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">{job.companyId?.name || 'Company'}</td>
                <td className="py-3.5 px-6">
                  <Badge variant={job.status === 'published' ? 'green' : job.status === 'paused' ? 'amber' : 'gray'}>
                    {job.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3.5 px-6 text-right space-x-2">
                  {job.status === 'published' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moderateMutation.mutate({ jobId: job._id, action: 'pause' })}
                      isLoading={moderateMutation.isPending && (moderateMutation.variables as any)?.jobId === job._id}
                      className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                  ) : job.status === 'paused' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moderateMutation.mutate({ jobId: job._id, action: 'publish' })}
                      isLoading={moderateMutation.isPending && (moderateMutation.variables as any)?.jobId === job._id}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700/80 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      <Play className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Publish
                    </Button>
                  ) : null}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Take down job "${job.title}" permanently?`)) {
                        moderateMutation.mutate({ jobId: job._id, action: 'delete' });
                      }
                    }}
                    isLoading={moderateMutation.isPending && (moderateMutation.variables as any)?.jobId === job._id && (moderateMutation.variables as any)?.action === 'delete'}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
