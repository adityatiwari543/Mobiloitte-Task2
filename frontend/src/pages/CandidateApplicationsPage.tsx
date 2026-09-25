import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { BackButton } from '../components/common/BackButton.js';
import { Briefcase, MapPin, DollarSign, Calendar, AlertOctagon } from 'lucide-react';

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

  const withdrawMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/applications/${id}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your job applications..." />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return <Badge variant="green">Shortlisted</Badge>;
      case 'interview':
        return <Badge variant="purple">Interview Scheduled</Badge>;
      case 'selected':
        return <Badge variant="green">Selected 🎉</Badge>;
      case 'rejected':
        return <Badge variant="red">Not Selected</Badge>;
      case 'withdrawn':
        return <Badge variant="gray">Withdrawn</Badge>;
      case 'under_review':
        return <Badge variant="amber">Under Review</Badge>;
      default:
        return <Badge variant="blue">Applied</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Application Pipeline</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track the live recruitment status of all your submitted applications</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications submitted yet"
          description="Browse thousands of verified job listings on JobConnect and start applying today."
          actionText="Find Jobs Now"
          onAction={() => navigate('/jobs')}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const job = app.jobId;
            const canWithdraw = app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'selected';

            return (
              <div
                key={app._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3
                      onClick={() => navigate(`/jobs/${job?._id}`)}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {job?.title || 'Job Posting'}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {job?.companyId?.name || 'Company'} • Applied on {new Date(app.appliedAt).toLocaleDateString()}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {job?.location} ({job?.remoteType})
                    </span>
                    <span className="flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {job?.employmentType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job?._id}`)}>
                    View Job
                  </Button>

                  {canWithdraw && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you wish to withdraw this job application?')) {
                          withdrawMutation.mutate(app._id);
                        }
                      }}
                      isLoading={withdrawMutation.isPending}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
