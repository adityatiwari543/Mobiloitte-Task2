import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  ShieldCheck,
  Clock,
  Settings,
  Shield,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
  applicationsBadgeCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
  className = '',
  applicationsBadgeCount = 0,
}) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/admin/dashboard',
      icon: LayoutDashboard,
      checkActive: (p: string) => p === '/admin/dashboard' || p === '/admin',
    },
    {
      label: 'Users',
      to: '/admin/users',
      icon: Users,
      checkActive: (p: string) => p.startsWith('/admin/users'),
    },
    {
      label: 'Jobs',
      to: '/admin/jobs',
      icon: Briefcase,
      checkActive: (p: string, s: string) => p === '/admin/jobs' && !s.includes('pending'),
    },
    {
      label: 'Applications',
      to: '/admin/applications',
      icon: FileText,
      badge: applicationsBadgeCount,
      checkActive: (p: string) => p.startsWith('/admin/applications'),
    },
    {
      label: 'Moderate Jobs',
      to: '/admin/jobs?filter=pending',
      icon: ShieldCheck,
      checkActive: (p: string, s: string) => p === '/admin/jobs' && s.includes('pending'),
    },
    {
      label: 'Audit Logs',
      to: '/admin/audit-logs',
      icon: Clock,
      checkActive: (p: string) => p.startsWith('/admin/audit-logs'),
    },
    {
      label: 'Settings',
      to: '/admin/profile',
      icon: Settings,
      checkActive: (p: string) => p.startsWith('/admin/profile'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0f1d] text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${className}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-600/30">
              JC
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center">
                JobConnect
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                Admin Center
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.checkActive(location.pathname, location.search);

            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => onCloseMobile?.()}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-indigo-700'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Platform Governance Security Card */}
        <div className="p-4 shrink-0">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121933] to-[#0c1224] border border-purple-900/40 p-4 text-center shadow-lg">
            {/* Glowing Shield Icon */}
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shadow-sm shadow-purple-500/30 mb-2.5">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-xs font-bold text-white tracking-wide">
              Secure • Transparent • Trusted
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Monitor platform activity, ensure security and maintain a great experience for all users.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
