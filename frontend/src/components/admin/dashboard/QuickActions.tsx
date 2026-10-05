import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Users,
  Briefcase,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Manage Users',
      desc: 'View and manage all users',
      to: '/admin/users',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/60',
    },
    {
      title: 'Moderate Jobs',
      desc: 'Review and approve jobs',
      to: '/admin/jobs?filter=pending',
      icon: Briefcase,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60',
    },
    {
      title: 'View Applications',
      desc: 'Audit candidate applications',
      to: '/admin/applications',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/60',
    },
    {
      title: 'System Settings',
      desc: 'Configure platform settings',
      to: '/admin/profile',
      icon: Settings,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-3">
      {/* Card Header */}
      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span>Quick Actions</span>
      </div>

      {/* Action Items List */}
      <div className="space-y-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              to={act.to}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-purple-200 dark:hover:border-purple-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${act.color} border flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {act.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
