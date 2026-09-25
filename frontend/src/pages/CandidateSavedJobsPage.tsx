import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { BackButton } from '../components/common/BackButton.js';
import { Bookmark, MapPin, Trash2 } from 'lucide-react';

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

  const removeSavedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/jobs/${jobId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your bookmarked jobs..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Jobs</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review positions you have bookmarked for later application</p>
      </div>

      {savedJobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Bookmark interesting engineering positions while browsing so you can apply anytime."
          actionText="Explore Jobs"
          onAction={() => navigate('/jobs')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedJobs.map((job: any) => (
            <div
              key={job._id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    {job.title}
                  </h3>
                  <Badge variant="blue">{job.remoteType}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{job.companyId?.name || 'Company'}</p>

                <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {job.location}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job._id}`)}>
                  View Details
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSavedMutation.mutate(job._id)}
                  isLoading={removeSavedMutation.isPending}
                  className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
