import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import { Shield, Search, UserX, UserCheck } from 'lucide-react';
import { ACCOUNT_STATUS } from '@jobconnect/shared';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, roleFilter],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (roleFilter) q.append('role', roleFilter);
      const res = await api.get(`/admin/users?${q.toString()}`);
      return res.data?.data?.items || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await api.patch(`/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading user directory..." />;
  }

  const users = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/admin/dashboard" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Moderation Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review registered candidates and recruiters, manage account suspension states</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
        >
          <option value="">Role: All</option>
          <option value="candidate">Candidates</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-6">User</th>
              <th className="py-3.5 px-6">Role</th>
              <th className="py-3.5 px-6">Phone (E.164)</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u: any) => (
              <tr key={u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-6">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{u.email}</p>
                </td>
                <td className="py-3.5 px-6 capitalize font-medium text-slate-700 dark:text-slate-300">{u.role}</td>
                <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.phoneE164}</td>
                <td className="py-3.5 px-6">
                  <Badge variant={u.status === 'active' ? 'green' : u.status === 'suspended' ? 'red' : 'amber'}>
                    {u.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3.5 px-6 text-right">
                  {u.status === 'suspended' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({ userId: u._id, status: ACCOUNT_STATUS.ACTIVE })
                      }
                      isLoading={updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.userId === u._id}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700/80 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Reactivate
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Suspend account for ${u.name}?`)) {
                          updateStatusMutation.mutate({ userId: u._id, status: ACCOUNT_STATUS.SUSPENDED });
                        }
                      }}
                      isLoading={updateStatusMutation.isPending && (updateStatusMutation.variables as any)?.userId === u._id}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400"
                    >
                      <UserX className="w-3.5 h-3.5 mr-1" /> Suspend
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
