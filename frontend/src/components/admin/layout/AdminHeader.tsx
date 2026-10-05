import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Shield,
  LogOut,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import { useTheme } from '../../../context/ThemeContext.js';
import { api } from '../../../lib/api.js';

interface AdminHeaderProps {
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onOpenMobileSidebar,
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  // Real-time notifications polling every 5s
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.data || [];
    },
    refetchInterval: 5000,
  });

  const notifications: Array<{
    _id: string;
    title: string;
    message: string;
    type?: string;
    isRead: boolean;
    createdAt: string;
  }> = notificationsData || [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/actions/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif._id);
    }
    if (notif.type === 'application_update') {
      navigate('/admin/applications');
      setNotificationsOpen(false);
    } else if (notif.title?.toLowerCase().includes('job')) {
      navigate('/admin/jobs');
      setNotificationsOpen(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const adminInitial = (user?.name?.[0] || 'S').toUpperCase();

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0a0f1d] border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left side: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Modern SaaS Command Search Bar */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full max-w-lg flex items-center justify-between pl-3 pr-2 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#090e1a] border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400/80 dark:hover:border-indigo-500/60 hover:bg-white dark:hover:bg-[#0c1424] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 group text-left cursor-pointer"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shadow-2xs">
              <Search className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
              Search users, jobs, audits, or commands...
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 shrink-0 ml-3">
            <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded shadow-xs group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
              Ctrl
            </kbd>
            <kbd className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded shadow-xs group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right side: Notifications, Theme Toggle, Profile Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3.5">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0c1322] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Admin Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto opacity-80" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      You're all caught up!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      No notifications at this moment.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                        item.isRead
                          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                          : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 font-medium'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {item.type === 'application_update' ? (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        ) : item.type === 'system' ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Admin User Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
          >
            {/* Avatar Initials Badge */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {adminInitial}
            </div>

            {/* Admin Name & Role (Desktop) */}
            <div className="hidden md:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate max-w-[120px]">
                {user?.name || 'Super Admin'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                Administrator
              </p>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>

          {/* Profile Menu Dropdown Card */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Super Admin'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email || 'admin@jobconnect.internal'}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Security & Profile</span>
                </Link>
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Audit Logs</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
