import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import {
  FileText,
  Search,
  ExternalLink,
  Download,
  Building2,
  Calendar,
  User,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  Clock,
} from 'lucide-react';
import { AdminPageHeader } from '../components/admin/common/AdminPageHeader.js';
import { AdminFilterToolbar, ToolbarTab } from '../components/admin/common/AdminFilterToolbar.js';
import { AdminDataTable, ColumnDef } from '../components/admin/common/AdminDataTable.js';
import { StatusBadge } from '../components/admin/common/StatusBadge.js';
import { AdminPagination } from '../components/admin/common/AdminPagination.js';
import { AdminDetailDrawer } from '../components/admin/common/AdminDetailDrawer.js';

interface AdminApplicationItem {
  _id: string;
  candidateId?: {
    _id?: string;
    name?: string;
    email?: string;
    phoneE164?: string;
  } | string;
  jobId?: {
    _id?: string;
    title?: string;
    location?: string;
    companyId?: {
      _id?: string;
      name?: string;
      logoUrl?: string;
    };
  } | string;
  status:
    | 'applied'
    | 'under_review'
    | 'shortlisted'
    | 'interview'
    | 'selected'
    | 'rejected'
    | 'withdrawn'
    | string;
  resumeUrl?: string;
  coverLetter?: string;
  createdAt: string;
  updatedAt?: string;
}

export const AdminApplicationsPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected application for detail drawer
  const [selectedApp, setSelectedApp] = useState<AdminApplicationItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch applications query
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminApplications', activeTab, debouncedSearch, page],
    queryFn: async () => {
      const res = await api.get('/admin/applications', {
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

  const applications: AdminApplicationItem[] = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    total: applications.length,
    totalPages: Math.ceil(applications.length / pageSize) || 1,
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const tabs: ToolbarTab[] = [
    { id: 'all', label: 'All' },
    { id: 'applied', label: 'Applied' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'interview', label: 'Interview' },
    { id: 'selected', label: 'Selected' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const hasActiveFilters = Boolean(searchInput || activeTab !== 'all');

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setActiveTab('all');
    setPage(1);
  };

  // Helper getters
  const getCandidateName = (app: AdminApplicationItem) => {
    if (typeof app.candidateId === 'object' && app.candidateId?.name) {
      return app.candidateId.name;
    }
    return 'Candidate';
  };

  const getCandidateEmail = (app: AdminApplicationItem) => {
    if (typeof app.candidateId === 'object' && app.candidateId?.email) {
      return app.candidateId.email;
    }
    return '—';
  };

  const getJobTitle = (app: AdminApplicationItem) => {
    if (typeof app.jobId === 'object' && app.jobId?.title) {
      return app.jobId.title;
    }
    return 'Role Unavailable';
  };

  const getCompanyName = (app: AdminApplicationItem) => {
    if (
      typeof app.jobId === 'object' &&
      app.jobId?.companyId &&
      typeof app.jobId.companyId === 'object' &&
      app.jobId.companyId.name
    ) {
      return app.jobId.companyId.name;
    }
    return 'JobConnect Recruiter';
  };

  // Table columns definition
  const columns: ColumnDef<AdminApplicationItem>[] = [
    {
      key: 'candidate',
      header: 'Applicant Identity',
      render: (app) => {
        const name = getCandidateName(app);
        const email = getCandidateEmail(app);
        const initial = (name[0] || 'C').toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="truncate">{email}</span>
                <span>•</span>
                <span className="font-mono text-[10px]">#{app._id.slice(-6)}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'job',
      header: 'Target Job & Company',
      render: (app) => {
        const title = getJobTitle(app);
        const company = getCompanyName(app);
        return (
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
              {title}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{company}</span>
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (app) => <StatusBadge status={app.status} />,
    },
    {
      key: 'resume',
      header: 'Resume File',
      render: (app) => {
        if (!app.resumeUrl) {
          return (
            <span className="text-[11px] text-slate-400 italic">No file attached</span>
          );
        }
        return (
          <a
            href={app.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>View Resume</span>
          </a>
        );
      },
    },
    {
      key: 'applied',
      header: 'Applied Date',
      render: (app) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {new Date(app.createdAt).toLocaleDateString('en-US', {
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
      render: (app) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setSelectedApp(app)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Inspect Application Details"
            aria-label="View application details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Shared Page Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Applications' },
        ]}
        title="Platform Job Applications"
        description="Monitor and audit all candidate applications submitted across the platform."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <FileText className="w-3 h-3 text-blue-500" />
            {pagination.total} Total Submissions
          </span>
        }
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Shared Filter Toolbar with Tabs */}
      <AdminFilterToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by candidate name, target job, or company..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Shared Data Table with Server-Side Pagination */}
      <AdminDataTable
        columns={columns}
        data={applications}
        keyExtractor={(a) => a._id}
        isLoading={isLoading}
        error={error ? 'Failed to fetch platform applications. Please try again.' : null}
        onRetry={() => refetch()}
        onRowClick={(a) => setSelectedApp(a)}
        emptyTitle="No applications found"
        emptyDescription={
          hasActiveFilters
            ? 'No candidate applications match your active filter settings.'
            : 'No applications have been submitted to jobs on the platform yet.'
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
        renderMobileCard={(app) => (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {getCandidateName(app)}
                </p>
                <p className="text-[11px] text-slate-400">{getJobTitle(app)}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>{getCompanyName(app)}</span>
              <span>
                {new Date(app.createdAt).toLocaleDateString('en-US', {
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

      {/* Application Detail Drawer */}
      <AdminDetailDrawer
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? getCandidateName(selectedApp) : 'Application Details'}
        subtitle={selectedApp ? `Applied for ${getJobTitle(selectedApp)}` : undefined}
        icon={FileText}
        badge={selectedApp ? <StatusBadge status={selectedApp.status} /> : undefined}
        footerActions={
          selectedApp?.resumeUrl ? (
            <a
              href={selectedApp.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shadow-blue-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Attached Resume</span>
            </a>
          ) : undefined
        }
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Header Identity Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {getCandidateName(selectedApp)}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getCandidateEmail(selectedApp)}
                  </p>
                </div>
                <StatusBadge status={selectedApp.status} size="md" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Application ID: #{selectedApp._id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedApp._id)}
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

            {/* Target Job & Company */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Position Overview
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Job Title
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {getJobTitle(selectedApp)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Employer / Company
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {getCompanyName(selectedApp)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Submitted On
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {new Date(selectedApp.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" /> Last Updated
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {selectedApp.updatedAt
                      ? new Date(selectedApp.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Initial submission'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Letter / Submission Note */}
            {selectedApp.coverLetter && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Candidate Note / Cover Letter
                </h5>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedApp.coverLetter}
                </div>
              </div>
            )}

            {/* Privacy & Governance Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                Privacy Protection Notice
              </p>
              Candidate contact details and attached application artifacts are restricted to authorized administrators and the direct recruiting organization under JobConnect platform governance policies.
            </div>
          </div>
        )}
      </AdminDetailDrawer>
    </div>
  );
};
