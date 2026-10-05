import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import {
  Briefcase,
  Search,
  Pause,
  Play,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { AdminPageHeader } from '../components/admin/common/AdminPageHeader.js';
import { AdminFilterToolbar, ToolbarTab } from '../components/admin/common/AdminFilterToolbar.js';
import { AdminDataTable, ColumnDef } from '../components/admin/common/AdminDataTable.js';
import { StatusBadge } from '../components/admin/common/StatusBadge.js';
import { AdminPagination } from '../components/admin/common/AdminPagination.js';
import { AdminDetailDrawer } from '../components/admin/common/AdminDetailDrawer.js';
import { AdminConfirmDialog } from '../components/admin/common/AdminConfirmDialog.js';

interface AdminJobItem {
  _id: string;
  title: string;
  companyId?: {
    _id?: string;
    name?: string;
    logoUrl?: string;
  } | string;
  recruiterId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
  location?: string;
  employmentType?: string;
  workplaceType?: string;
  status: 'published' | 'paused' | 'closed' | 'rejected' | string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  skills?: string[];
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export const AdminJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const filterParam = searchParams.get('filter') || searchParams.get('status') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState(
    filterParam === 'pending' ? 'paused' : filterParam
  );
  const [page, setPage] = useState(pageParam);
  const pageSize = 10;

  // Selected job for detail drawer
  const [selectedJob, setSelectedJob] = useState<AdminJobItem | null>(null);

  // Moderation action confirmation state
  const [actionTargetJob, setActionTargetJob] = useState<AdminJobItem | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'pause' | 'publish' | 'resume' | 'close' | 'delete' | null
  >(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Sync tab with URL searchParams
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setPage(1);
    if (tabId === 'all') {
      searchParams.delete('filter');
      searchParams.delete('status');
    } else {
      searchParams.set('status', tabId);
    }
    setSearchParams(searchParams);
  };

  // Fetch jobs query
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminJobs', activeTab, debouncedSearch, page],
    queryFn: async () => {
      const res = await api.get('/admin/jobs', {
        params: {
          status: activeTab === 'all' ? undefined : activeTab,
          search: debouncedSearch || undefined,
          page,
          limit: pageSize,
        },
      });
      return res.data?.data;
    },
    placeholderData: (prev) => prev,
  });

  const jobs: AdminJobItem[] = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    total: jobs.length,
    totalPages: Math.ceil(jobs.length / pageSize) || 1,
  };

  // Moderate job mutation
  const moderateMutation = useMutation({
    mutationFn: async ({
      jobId,
      action,
    }: {
      jobId: string;
      action: 'pause' | 'publish' | 'resume' | 'close' | 'delete';
    }) => {
      const res = await api.patch(`/admin/jobs/${jobId}/moderate`, { action });
      return res.data;
    },
    onSuccess: (data, variables) => {
      setFeedbackMsg({
        type: 'success',
        text: data?.message || `Job successfully updated (${variables.action}).`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      setActionTargetJob(null);
      setPendingAction(null);
      if (selectedJob && selectedJob._id === variables.jobId) {
        if (variables.action === 'delete') {
          setSelectedJob(null);
        } else {
          const newStatus =
            variables.action === 'pause'
              ? 'paused'
              : variables.action === 'close'
              ? 'closed'
              : 'published';
          setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
    onError: (err: any) => {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to moderate job posting.',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      setActionTargetJob(null);
      setPendingAction(null);
    },
  });

  const handleConfirmModeration = () => {
    if (!actionTargetJob || !pendingAction) return;
    moderateMutation.mutate({
      jobId: actionTargetJob._id,
      action: pendingAction,
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const tabs: ToolbarTab[] = [
    { id: 'all', label: 'All Jobs' },
    { id: 'published', label: 'Published' },
    { id: 'paused', label: 'In Review / Paused' },
    { id: 'closed', label: 'Closed' },
  ];

  const hasActiveFilters = Boolean(searchInput || activeTab !== 'all');

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setActiveTab('all');
    setPage(1);
    searchParams.delete('filter');
    searchParams.delete('status');
    setSearchParams(searchParams);
  };

  // Helper for company display
  const getCompanyName = (job: AdminJobItem) => {
    if (typeof job.companyId === 'object' && job.companyId?.name) {
      return job.companyId.name;
    }
    return 'Independent Recruiter';
  };

  const getCompanyLogo = (job: AdminJobItem) => {
    if (typeof job.companyId === 'object' && job.companyId?.logoUrl) {
      return job.companyId.logoUrl;
    }
    return null;
  };

  const formatSalary = (sal?: AdminJobItem['salary']) => {
    if (!sal || (!sal.min && !sal.max)) return 'Not specified';
    const curr = sal.currency || 'USD';
    const period = sal.period ? `/${sal.period}` : '';
    if (sal.min && sal.max) return `${curr} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()}${period}`;
    if (sal.min) return `From ${curr} ${sal.min.toLocaleString()}${period}`;
    return `Up to ${curr} ${sal.max?.toLocaleString()}${period}`;
  };

  // Columns definition
  const columns: ColumnDef<AdminJobItem>[] = [
    {
      key: 'job',
      header: 'Job Title & Organization',
      render: (job) => {
        const logo = getCompanyLogo(job);
        const compName = getCompanyName(job);
        return (
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={compName}
                className="w-9 h-9 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-800 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <Building2 className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {job.title}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="truncate">{compName}</span>
                <span>•</span>
                <span className="font-mono text-[10px]">#{job._id.slice(-6)}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'location',
      header: 'Location & Mode',
      render: (job) => (
        <div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            {job.location || 'Remote'}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">
            {job.workplaceType || job.employmentType || 'Full-time'}
          </p>
        </div>
      ),
    },
    {
      key: 'compensation',
      header: 'Compensation',
      render: (job) => (
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
          {formatSalary(job.salary)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Moderation Status',
      render: (job) => <StatusBadge status={job.status} />,
    },
    {
      key: 'posted',
      header: 'Posted Date',
      render: (job) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {new Date(job.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (job) => {
        const isPaused = job.status === 'paused';
        return (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedJob(job)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Inspect Job Listing"
              aria-label="View job details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {isPaused ? (
              <button
                type="button"
                onClick={() => {
                  setActionTargetJob(job);
                  setPendingAction('publish');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title="Publish / Approve Job"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Publish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActionTargetJob(job);
                  setPendingAction('pause');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                title="Pause Job"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActionTargetJob(job);
                setPendingAction('delete');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Reject & Delete Job"
              aria-label="Delete job posting"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Shared Page Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Job Moderation' },
        ]}
        title="Job Content Moderation"
        description="Review live listings, enforce community guidelines, and moderate postings."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <Briefcase className="w-3 h-3 text-emerald-500" />
            {pagination.total} Total Listings
          </span>
        }
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Action feedback toast banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium animate-in fade-in duration-150 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Shared Filter Toolbar with Tabs */}
      <AdminFilterToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search jobs by title, company, or location..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Shared Data Table with Server-Side Pagination */}
      <AdminDataTable
        columns={columns}
        data={jobs}
        keyExtractor={(j) => j._id}
        isLoading={isLoading}
        error={error ? 'Failed to fetch job postings. Please try again.' : null}
        onRetry={() => refetch()}
        onRowClick={(j) => setSelectedJob(j)}
        emptyTitle="No jobs found"
        emptyDescription={
          hasActiveFilters
            ? 'No job listings match your current filters and search query.'
            : 'No jobs have been posted on the platform yet.'
        }
        emptyAction={
          hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          ) : undefined
        }
        renderMobileCard={(job) => (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs">{job.title}</p>
                <p className="text-[11px] text-slate-400">{getCompanyName(job)}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>{job.location || 'Remote'}</span>
              <span>
                Posted{' '}
                {new Date(job.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}
        pagination={
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => setPage(p)}
          />
        }
      />

      {/* Job Detail Drawer */}
      <AdminDetailDrawer
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || 'Job Listing'}
        subtitle={selectedJob ? getCompanyName(selectedJob) : undefined}
        icon={Briefcase}
        badge={selectedJob ? <StatusBadge status={selectedJob.status} /> : undefined}
        footerActions={
          selectedJob && (
            <>
              {selectedJob.status === 'paused' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionTargetJob(selectedJob);
                    setPendingAction('publish');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Publish Listing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionTargetJob(selectedJob);
                    setPendingAction('pause');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shadow-amber-600/20"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause Listing
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActionTargetJob(selectedJob);
                  setPendingAction('delete');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reject & Delete
              </button>
            </>
          )
        }
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedJob.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getCompanyName(selectedJob)}
                  </p>
                </div>
                <StatusBadge status={selectedJob.status} size="md" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Job ID: #{selectedJob._id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedJob._id)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Position Specifications */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Position Details
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Location
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {selectedJob.location || 'Remote'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> Employment Type
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 capitalize">
                    {selectedJob.employmentType || selectedJob.workplaceType || 'Full-time'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Compensation
                  </span>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {formatSalary(selectedJob.salary)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" /> Posted On
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {new Date(selectedJob.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tagged Skills
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedJob.description && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Job Description Excerpt
                </h5>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminDetailDrawer>

      {/* Moderation Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(actionTargetJob && pendingAction)}
        onClose={() => {
          setActionTargetJob(null);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmModeration}
        isLoading={moderateMutation.isPending}
        title={
          pendingAction === 'delete'
            ? `Reject & Delete "${actionTargetJob?.title}"?`
            : pendingAction === 'pause'
            ? `Pause Listing "${actionTargetJob?.title}"?`
            : `Publish Listing "${actionTargetJob?.title}"?`
        }
        description={
          pendingAction === 'delete'
            ? `Are you sure you want to permanently remove "${actionTargetJob?.title}" posted by ${actionTargetJob ? getCompanyName(actionTargetJob) : ''}?`
            : pendingAction === 'pause'
            ? `Pausing this listing will immediately hide it from candidate search and application submission.`
            : `Publishing this listing will restore its visibility across the platform for active candidate applications.`
        }
        impactText={
          pendingAction === 'delete'
            ? 'Impact: This action is permanent and creates an immutable administrative audit event. All associated applicant links will be invalidated.'
            : pendingAction === 'pause'
            ? 'Impact: Candidate discovery will be temporarily paused. Existing applications will remain safely archived.'
            : 'Impact: Job will be marked active and searchable in the public candidate directory.'
        }
        confirmLabel={
          pendingAction === 'delete'
            ? 'Reject & Delete'
            : pendingAction === 'pause'
            ? 'Pause Job'
            : 'Publish Job'
        }
        variant={pendingAction === 'delete' ? 'danger' : pendingAction === 'pause' ? 'warning' : 'primary'}
      />
    </div>
  );
};
