import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../lib/api.js';
import {
  Briefcase,
  Search,
  Building2,
  LayoutDashboard,
  FileText,
  Bookmark,
  Sparkles,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  CheckCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { ROLES } from '@jobconnect/shared';
import { useTheme } from '../../context/ThemeContext.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click and Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotificationOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fetch real dynamic saved jobs count for candidate
  const { data: savedJobs } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved/all');
      return res.data?.data || [];
    },
    enabled: !!isAuthenticated && user?.role === ROLES.CANDIDATE,
  });
  const savedJobsCount = Array.isArray(savedJobs) ? savedJobs.length : 0;

  // Fetch real notifications and dynamic unread count
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.data || { notifications: [], unreadCount: 0 };
    },
    enabled: !!isAuthenticated,
  });

  const unreadCount = notifData?.unreadCount ?? 0;
  const notifications = notifData?.notifications ?? [];

  // Mutation to mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/actions/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  // Helper to test if a route is active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#080B14]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand Logo & Desktop Nav Links */}
          <div className="flex items-center space-x-6 xl:space-x-8">
            {/* JobConnect Logo matching mockup */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <span>JC</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Job<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1.5 lg:space-x-2">
              {/* Find Jobs (with Search icon) */}
              <Link
                to="/jobs"
                className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  isActive('/jobs') && location.pathname !== '/jobs/saved/all'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <Search className="w-3.5 h-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                Find Jobs
              </Link>

              {/* Candidate Links */}
              {user?.role === ROLES.CANDIDATE && (
                <>
                  <Link
                    to="/candidate/dashboard"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      isActive('/candidate/dashboard')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-400" />
                    Dashboard
                  </Link>

                  <Link
                    to="/candidate/applications"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      isActive('/candidate/applications')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-400" />
                    Applications
                  </Link>

                  <Link
                    to="/candidate/saved-jobs"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      isActive('/candidate/saved-jobs')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-400" />
                    <span>Saved Jobs</span>
                    {savedJobsCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-xs">
                        {savedJobsCount}
                      </span>
                    )}
                  </Link>

                  {/* AI Career Assistant Pill */}
                  <Link
                    to="/candidate/ai-assistant"
                    className="inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all ml-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-200" />
                    <span>AI Career Assistant</span>
                  </Link>
                </>
              )}

              {/* Recruiter Links */}
              {user?.role === ROLES.RECRUITER && (
                <>
                  <Link
                    to="/recruiter/dashboard"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      isActive('/recruiter/dashboard')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-400" />
                    Dashboard
                  </Link>
                  <Link
                    to="/recruiter/jobs"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      isActive('/recruiter/jobs') && location.pathname !== '/recruiter/jobs/create'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-400" />
                    Manage Postings
                  </Link>
                  <Link
                    to="/recruiter/jobs/create"
                    className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                  >
                    + Post a Job
                  </Link>
                </>
              )}

              {/* Admin Links */}
              {user?.role === ROLES.ADMIN && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  >
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-red-600 dark:text-red-400" />
                    Admin Portal
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full ${
                      isActive('/admin/users')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/jobs"
                    className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full ${
                      isActive('/admin/jobs')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    Moderate Jobs
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Header: Notifications, Theme Switcher & Profile Dropdown */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Bell Dropdown */}
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  aria-label="Open notifications"
                  className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800/80 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs text-blue-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                          <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          No new notifications
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif: any) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              if (!notif.read) markAsReadMutation.mutate(notif._id);
                            }}
                            className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                              notif.read
                                ? 'bg-white dark:bg-[#0D1220] hover:bg-slate-50 dark:hover:bg-[#111827]'
                                : 'bg-blue-50/40 dark:bg-[#162035]/50 hover:bg-blue-50/70 dark:hover:bg-[#162035]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                notif.read ? 'bg-transparent' : 'bg-blue-600 dark:bg-sky-400'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {notif.title || 'Platform Update'}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 text-center bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to={user?.role === ROLES.CANDIDATE ? '/candidate/applications' : '/recruiter/dashboard'}
                        onClick={() => setNotificationOpen(false)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View All Activity →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Compact Theme Switcher (Bright / Dark matching mockup) */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-full p-1 shadow-2xs backdrop-blur-xs transition-colors">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-amber-500 shadow-xs scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Light Mode"
                aria-label="Switch to light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-indigo-400 shadow-xs ring-1 ring-slate-700/80 scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Dark Mode"
                aria-label="Switch to dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-expanded={profileDropdownOpen}
                  className="flex items-center space-x-2 text-sm font-medium p-1 pr-2 rounded-full border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'Avatar'} className="w-full h-full object-cover" />
                    ) : user.firstName ? (
                      user.firstName[0]
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize leading-tight">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800/80 shadow-xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={
                          user.role === ROLES.CANDIDATE
                            ? '/candidate/profile'
                            : user.role === ROLES.RECRUITER
                            ? '/recruiter/profile'
                            : '/admin/profile'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to={
                          user.role === ROLES.CANDIDATE
                            ? '/candidate/profile'
                            : user.role === ROLES.RECRUITER
                            ? '/recruiter/profile'
                            : '/admin/profile'
                        }
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                        Edit Profile
                      </Link>

                      {user.role === ROLES.CANDIDATE && (
                        <>
                          <Link
                            to="/candidate/applications"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            Resume & Applications
                          </Link>
                          <Link
                            to="/candidate/saved-jobs"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#111827] transition-colors"
                          >
                            <Bookmark className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                            Saved Jobs ({savedJobsCount})
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/login"
                  className={`text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer ${
                    isActive('/login')
                      ? 'bg-purple-100/90 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`inline-flex items-center text-xs font-semibold px-5 py-2 rounded-full transition-all cursor-pointer ${
                    isActive('/register')
                      ? 'bg-gradient-to-r from-purple-700 via-purple-700 to-indigo-700 text-white shadow-md shadow-purple-500/35 ring-2 ring-purple-400/50'
                      : 'bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/25 hover:shadow-md hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger button */}
          <div className="flex items-center space-x-2 md:hidden">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3 transition-colors animate-in slide-in-from-top duration-200">
          {/* Mobile Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Appearance ({theme === 'dark' ? 'Dark' : 'Light'})
            </span>
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1 rounded-full ${theme === 'light' ? 'bg-white text-amber-500' : 'text-slate-400'}`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1 rounded-full ${theme === 'dark' ? 'bg-slate-900 text-blue-400' : 'text-slate-400'}`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User profile on mobile */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || 'Avatar'} className="w-full h-full object-cover" />
                ) : user.firstName ? (
                  user.firstName[0]
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{user.name}</span>
                <span className="text-[11px] text-slate-400 capitalize truncate">{user.role}</span>
              </div>
            </div>
          )}

          {/* Navigation Links on mobile */}
          <div className="space-y-1">
            <Link
              to="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            >
              <Search className="w-4 h-4 mr-2.5 text-purple-600" />
              Find Jobs
            </Link>

            {isAuthenticated && user?.role === ROLES.CANDIDATE && (
              <>
                <Link
                  to="/candidate/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2.5 text-slate-400" />
                  Dashboard
                </Link>

                <Link
                  to="/candidate/applications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <FileText className="w-4 h-4 mr-2.5 text-slate-400" />
                  Applications
                </Link>

                <Link
                  to="/candidate/saved-jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <div className="flex items-center">
                    <Bookmark className="w-4 h-4 mr-2.5 text-slate-400" />
                    Saved Jobs
                  </div>
                  {savedJobsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold">
                      {savedJobsCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/candidate/ai-assistant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3.5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-sky-200" />
                  AI Career Assistant
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === ROLES.RECRUITER && (
              <>
                <Link
                  to="/recruiter/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2.5 text-slate-400" />
                  Recruiter Dashboard
                </Link>
                <Link
                  to="/recruiter/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <Layers className="w-4 h-4 mr-2.5 text-slate-400" />
                  Manage Postings
                </Link>
              </>
            )}
          </div>

          {/* Bottom mobile logout or sign in */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
