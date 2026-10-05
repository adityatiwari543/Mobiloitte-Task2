import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { ACCOUNT_STATUS } from '@jobconnect/shared';
import { AdminPageHeader } from '../components/admin/common/AdminPageHeader.js';
import { AdminFilterToolbar, FilterSelect } from '../components/admin/common/AdminFilterToolbar.js';
import { AdminDataTable, ColumnDef } from '../components/admin/common/AdminDataTable.js';
import { StatusBadge } from '../components/admin/common/StatusBadge.js';
import { AdminPagination } from '../components/admin/common/AdminPagination.js';
import { AdminDetailDrawer } from '../components/admin/common/AdminDetailDrawer.js';
import { AdminConfirmDialog } from '../components/admin/common/AdminConfirmDialog.js';

interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  status: 'active' | 'suspended' | 'pending_verification' | 'deactivated';
  phoneE164?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  dateOfBirth?: string;
  gender?: string;
}

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected user for detail drawer
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Confirmation dialog state for moderation
  const [actionTargetUser, setActionTargetUser] = useState<AdminUserItem | null>(null);
  const [pendingAction, setPendingAction] = useState<'suspend' | 'activate' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch users with server-side pagination & filtering
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminUsers', debouncedSearch, roleFilter, statusFilter, page],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (debouncedSearch) q.append('search', debouncedSearch);
      if (roleFilter) q.append('role', roleFilter);
      if (statusFilter) q.append('status', statusFilter);
      q.append('page', String(page));
      q.append('limit', String(pageSize));

      const res = await api.get(`/admin/users?${q.toString()}`);
      return res.data?.data;
    },
    placeholderData: (prev) => prev,
  });

  const users: AdminUserItem[] = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    total: users.length,
    totalPages: Math.ceil(users.length / pageSize) || 1,
  };

  // Status mutation (suspend / activate)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const res = await api.patch(`/admin/users/${userId}/status`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      const isSuspending = variables.status === ACCOUNT_STATUS.SUSPENDED;
      setFeedbackMsg({
        type: 'success',
        text: `User account ${actionTargetUser?.name || ''} successfully ${
          isSuspending ? 'suspended' : 'reactivated'
        }.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      setActionTargetUser(null);
      setPendingAction(null);
      if (selectedUser && selectedUser._id === variables.userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, status: variables.status as any } : null
        );
      }
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
    onError: (err: any) => {
      setFeedbackMsg({
        type: 'error',
        text:
          err.response?.data?.error?.message ||
          'Failed to update user status. Please verify permissions.',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      setActionTargetUser(null);
      setPendingAction(null);
    },
  });

  const handleConfirmAction = () => {
    if (!actionTargetUser || !pendingAction) return;
    const targetStatus =
      pendingAction === 'suspend' ? ACCOUNT_STATUS.SUSPENDED : ACCOUNT_STATUS.ACTIVE;
    updateStatusMutation.mutate({
      userId: actionTargetUser._id,
      status: targetStatus,
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const hasActiveFilters = Boolean(searchInput || roleFilter || statusFilter);

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  // Filter dropdown configuration
  const filterSelects: FilterSelect[] = [
    {
      id: 'roleFilter',
      label: 'Role',
      value: roleFilter,
      onChange: (val) => {
        setRoleFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Roles', value: '' },
        { label: 'Candidates', value: 'candidate' },
        { label: 'Recruiters', value: 'recruiter' },
        { label: 'Admins', value: 'admin' },
      ],
    },
    {
      id: 'statusFilter',
      label: 'Status',
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Pending Review', value: 'pending_verification' },
        { label: 'Deactivated', value: 'deactivated' },
      ],
    },
  ];

  // Table column definition
  const columns: ColumnDef<AdminUserItem>[] = [
    {
      key: 'user',
      header: 'User & Identity',
      render: (u) => {
        const initial = (u.name?.[0] || 'U').toUpperCase();
        return (
          <div className="flex items-center gap-3">
            {u.avatar ? (
              <img
                src={u.avatar}
                alt={u.name}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {u.name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="truncate">{u.email}</span>
                <span>•</span>
                <span className="font-mono text-[10px]">#{u._id.slice(-6)}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'System Role',
      render: (u) => {
        const isAdm = u.role === 'admin';
        const isRec = u.role === 'recruiter';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
              isAdm
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                : isRec
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {isAdm && <Shield className="w-3 h-3 text-purple-500" />}
            {u.role}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'contact',
      header: 'Phone (E.164)',
      render: (u) => (
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
          {u.phoneE164 || '—'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined Date',
      render: (u) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {new Date(u.createdAt).toLocaleDateString('en-US', {
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
      render: (u) => {
        return (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(u)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Inspect User Details"
              aria-label="View user details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {u.status === 'suspended' ? (
              <button
                type="button"
                onClick={() => {
                  setActionTargetUser(u);
                  setPendingAction('activate');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActionTargetUser(u);
                  setPendingAction('suspend');
                }}
                disabled={u.role === 'admin'}
                title={u.role === 'admin' ? 'Super Admin cannot be suspended' : 'Suspend Account'}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Suspend</span>
              </button>
            )}
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
          { label: 'Users' },
        ]}
        title="User Moderation Directory"
        description="Review registered candidates and recruiters, manage account access and verification states."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <Users className="w-3 h-3 text-blue-500" />
            {pagination.total} Registered Users
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

      {/* Shared Filter Toolbar */}
      <AdminFilterToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search users by name or email address..."
        filters={filterSelects}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Shared Data Table with Server-Side Pagination */}
      <AdminDataTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u._id}
        isLoading={isLoading}
        error={error ? 'Failed to fetch user directory. Please try again.' : null}
        onRetry={() => refetch()}
        onRowClick={(u) => setSelectedUser(u)}
        emptyTitle="No users found"
        emptyDescription={
          hasActiveFilters
            ? 'No users match your active search and filter settings.'
            : 'No users have registered on the platform yet.'
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
        renderMobileCard={(u) => (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {(u.name?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">{u.name}</p>
                  <p className="text-[11px] text-slate-400">{u.email}</p>
                </div>
              </div>
              <StatusBadge status={u.status} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="capitalize font-medium">Role: {u.role}</span>
              <span>
                Joined{' '}
                {new Date(u.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
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

      {/* User Detail Drawer */}
      <AdminDetailDrawer
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || 'User Profile'}
        subtitle="Identity & Access Governance"
        icon={Users}
        badge={selectedUser ? <StatusBadge status={selectedUser.status} /> : undefined}
        footerActions={
          selectedUser && (
            <>
              {selectedUser.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionTargetUser(selectedUser);
                    setPendingAction('activate');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/20"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Reactivate Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionTargetUser(selectedUser);
                    setPendingAction('suspend');
                  }}
                  disabled={selectedUser.role === 'admin'}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Suspend Account
                </button>
              )}
            </>
          )
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Identity Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center">
                    {(selectedUser.name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedUser.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedUser.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {selectedUser.role} Account
                  </span>
                </div>
              </div>

              {/* ID copy line */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  User ID: #{selectedUser._id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedUser._id)}
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

            {/* Profile Credentials */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contact & Verification
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Address
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> Phone (E.164)
                  </span>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {selectedUser.phoneE164 || 'Not registered'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Registered On
                  </span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-500" /> Account Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Governance Safety Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-blue-950 dark:text-blue-300">
                Governance Enforcement
              </p>
              <p className="text-[11px] leading-relaxed">
                Suspending this user will immediately revoke all active sessions across web and mobile, preventing any further platform interactions.
              </p>
            </div>
          </div>
        )}
      </AdminDetailDrawer>

      {/* Moderation Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(actionTargetUser && pendingAction)}
        onClose={() => {
          setActionTargetUser(null);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmAction}
        isLoading={updateStatusMutation.isPending}
        title={
          pendingAction === 'suspend'
            ? `Suspend ${actionTargetUser?.name || 'Account'}?`
            : `Reactivate ${actionTargetUser?.name || 'Account'}?`
        }
        description={
          pendingAction === 'suspend'
            ? `Are you sure you want to suspend this ${actionTargetUser?.role} account (${actionTargetUser?.email})?`
            : `This will restore access for ${actionTargetUser?.name} (${actionTargetUser?.email}).`
        }
        impactText={
          pendingAction === 'suspend'
            ? 'Impact: All active sessions will be terminated immediately. The user will be unable to log in until an administrator reactivates the account.'
            : 'Impact: The user will regain immediate access to sign in, view applications, and use platform features.'
        }
        confirmLabel={pendingAction === 'suspend' ? 'Suspend User' : 'Reactivate User'}
        variant={pendingAction === 'suspend' ? 'danger' : 'primary'}
      />
    </div>
  );
};
