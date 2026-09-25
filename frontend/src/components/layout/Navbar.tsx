import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  Briefcase,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles,
  Shield,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { ROLES } from '@jobconnect/shared';
import { useTheme } from '../../context/ThemeContext.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Job<span className="text-blue-600 dark:text-blue-400">Connect</span>
              </span>
            </Link>

            <div className="hidden md:flex ml-10 space-x-6">
              <Link
                to="/jobs"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
              >
                Find Jobs
              </Link>

              {user?.role === ROLES.CANDIDATE && (
                <>
                  <Link
                    to="/candidate/dashboard"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/candidate/applications"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Applications
                  </Link>
                  <Link
                    to="/candidate/saved-jobs"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Saved Jobs
                  </Link>
                  <Link
                    to="/candidate/ai-assistant"
                    className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors py-2"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Career Assistant
                  </Link>
                </>
              )}

              {user?.role === ROLES.RECRUITER && (
                <>
                  <Link
                    to="/recruiter/dashboard"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/recruiter/jobs"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Manage Postings
                  </Link>
                  <Link
                    to="/recruiter/jobs/create"
                    className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-2"
                  >
                    + Post a Job
                  </Link>
                </>
              )}

              {user?.role === ROLES.ADMIN && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors py-2"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Admin Portal
                  </Link>
                  <Link
                    to="/admin/users"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/jobs"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Moderate Jobs
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    Audit Logs
                  </Link>
                  <Link
                    to="/admin/profile"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors py-2"
                  >
                    Admin Profile
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Header: Theme Toggle, Auth CTA & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Functional Theme Switcher (Bright / Dark) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-0.5 shadow-sm transition-colors">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-amber-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Bright Mode (Light)"
                aria-label="Switch to bright mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-blue-400 shadow-sm ring-1 ring-slate-700'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Dark Mode"
                aria-label="Switch to dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={
                    user.role === ROLES.CANDIDATE
                      ? '/candidate/profile'
                      : user.role === ROLES.RECRUITER
                      ? '/recruiter/profile'
                      : '/admin/profile'
                  }
                  title="Click to view full profile details"
                  className="group flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 pr-2.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition-transform overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : user.firstName ? (
                      user.firstName[0]
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <div
                    className="ml-1 p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors"
                    title="View Profile Details"
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 px-3.5 py-2 rounded-xl hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2 transition-colors">
          {/* Mobile Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Appearance ({theme === 'dark' ? 'Dark' : 'Bright'})
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full ${
                  theme === 'light'
                    ? 'bg-white text-amber-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Bright Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-blue-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center space-x-3 px-3 py-2.5 mb-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : user.firstName ? (
                  user.firstName[0]
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {user.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
          >
            Find Jobs
          </Link>
          {isAuthenticated && user ? (
            <>
              {user.role === ROLES.CANDIDATE && (
                <>
                  <Link
                    to="/candidate/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Candidate Dashboard
                  </Link>
                  <Link
                    to="/candidate/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/candidate/ai-assistant"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-md"
                  >
                    AI Assistant
                  </Link>
                </>
              )}
              {user.role === ROLES.RECRUITER && (
                <>
                  <Link
                    to="/recruiter/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Recruiter Dashboard
                  </Link>
                  <Link
                    to="/recruiter/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Recruiter Profile & Details
                  </Link>
                  <Link
                    to="/recruiter/jobs/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md"
                  >
                    + Post a Job
                  </Link>
                </>
              )}
              {user.role === ROLES.ADMIN && (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                  >
                    Admin Portal
                  </Link>
                  <Link
                    to="/admin/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Admin Profile & Credentials
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Users Management
                  </Link>
                  <Link
                    to="/admin/jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Moderate Jobs
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    Audit Logs
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-slate-700 dark:text-slate-200 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 bg-blue-600 text-white font-medium rounded-lg"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
