import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import {
  AuditDetailDrawer,
  AuditLogItem,
} from '../components/admin/dashboard/AuditDetailDrawer.js';
import {
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  MonitorSmartphone,
  CalendarCheck,
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Camera,
  Pencil,
  Check,
  ChevronDown,
  Search,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  Users,
  Briefcase,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  AlertCircle,
} from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  GENDER_OPTIONS,
} from '@jobconnect/shared';

export const AdminProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: authUser, refreshUser, logout } = useAuth();

  // Profile data fetch
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['adminProfile'],
    queryFn: async () => {
      const res = await api.get('/admin/profile');
      return res.data?.data;
    },
  });

  // Sessions fetch
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['adminSessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data?.data || [];
    },
  });

  // Recent security activity (audit logs)
  const { data: activityData } = useQuery({
    queryKey: ['adminSecurityActivity'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', { params: { limit: 5 } });
      return res.data?.data?.items || res.data?.data?.auditLogs || [];
    },
  });

  const currentUser = profileData?.user || authUser;

  // Personal Info form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY.dialCode);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Country dropdown state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [confirmSignOutOthersOpen, setConfirmSignOutOthersOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // Change password inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Deactivate input
  const [deactivateConfirmationInput, setDeactivateConfirmationInput] = useState('');
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Danger Zone safety lock state (disabled by default)
  const [dangerZoneUnlocked, setDangerZoneUnlocked] = useState(false);

  // Populate state from user data
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setPhone(currentUser.nationalNumber || '');
      if (currentUser.countryCode) {
        setCountryCode(currentUser.countryCode);
        const found = COUNTRIES.find((c) => c.dialCode === currentUser.countryCode);
        if (found) setSelectedCountry(found);
      }
      setDateOfBirth(currentUser.dateOfBirth || '');
      setGender((currentUser.gender as any) || '');
    }
  }, [currentUser]);

  // Click outside listener for country dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCountryDropdownOpen]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/admin/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        countryCode,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      setSaveSuccessMsg('Profile updated successfully.');
      setSaveErrorMsg(null);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
      refreshUser();
    },
    onError: (err: any) => {
      setSaveErrorMsg(
        err.response?.data?.error?.message || 'Unable to update profile. Please try again.'
      );
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setPwSuccess('Password changed successfully.');
      setPwError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPwSuccess(null);
        setChangePasswordModalOpen(false);
      }, 2000);
      queryClient.invalidateQueries({ queryKey: ['adminSecurityActivity'] });
    },
    onError: (err: any) => {
      setPwError(
        err.response?.data?.error?.message || 'Failed to change password. Please check your credentials.'
      );
    },
  });

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/sessions/${sessionId}`);
    },
    onSuccess: () => {
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: ['adminSessions'] });
    },
  });

  // Revoke all other sessions mutation
  const revokeAllOthersMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/sessions/actions/revoke-others');
    },
    onSuccess: () => {
      refetchSessions();
      setConfirmSignOutOthersOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adminSessions'] });
    },
  });

  // Avatar upload handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size exceeds 5MB limit.');
      return;
    }

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      setAvatarError('Supported formats: PNG, JPG, JPEG, WEBP.');
      return;
    }

    setAvatarError(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/auth/avatar', formData);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
    } catch (err: any) {
      setAvatarError(err.response?.data?.error?.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeactivate = async () => {
    if (deactivateConfirmationInput.trim() !== 'DEACTIVATE') {
      setDeactivateError('Please type DEACTIVATE in capital letters to confirm.');
      return;
    }
    try {
      await api.patch(`/admin/users/${currentUser?._id}/status`, { status: 'deactivated' });
      await logout();
      navigate('/login');
    } catch (err: any) {
      setDeactivateError(err.response?.data?.error?.message || 'Failed to deactivate account.');
    }
  };

  if (isProfileLoading) {
    return <LoadingSpinner message="Loading administrator security & access center..." />;
  }

  const sessions = sessionsData || [];
  const activeDeviceCount = Math.max(1, sessions.length);
  const recentLogs: AuditLogItem[] = activityData || [];

  const adminName = currentUser?.name || `${firstName} ${lastName}`.trim() || 'Super Admin';
  const adminInitial = (adminName[0] || 'S').toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link
              to="/admin/dashboard"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Settings
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Administrator Profile
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Administrator Profile & Credentials
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              <Shield className="w-3 h-3 text-purple-500" />
              Role: Platform Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your profile, security settings and administrative access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Notifications feedback alerts */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {saveErrorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* PROFILE SUMMARY CARD */}
      <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={adminName}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                  {adminInitial}
                </div>
              )}
              {/* Only show photo upload button when editing profile */}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border-2 border-white dark:border-[#0c1427] shadow-sm transition-colors cursor-pointer animate-in fade-in zoom-in-75 duration-150"
                  title="Upload / Change Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            {/* Identity Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {adminName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Root Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Platform Super Admin
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                Full platform access with administrative privileges, security policy enforcement, and governance oversight.
              </p>
              {avatarError && (
                <p className="text-[11px] text-rose-500 font-medium">{avatarError}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 sm:self-center shrink-0">
            {/* Change Photo is only available in Edit Profile mode */}
            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 animate-in fade-in duration-150"
              >
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditing ? 'Close Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY SUMMARY CARDS (4 Compact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Account Status Card */}
        <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Account Status
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Account is active and can access the platform.
          </p>
        </div>

        {/* MFA / 2FA Card */}
        <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              MFA / 2FA
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Enabled
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Two-factor authentication is active on account.
          </p>
        </div>

        {/* Active Sessions Card */}
        <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Sessions
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <MonitorSmartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {activeDeviceCount} {activeDeviceCount === 1 ? 'device' : 'devices'}
            </span>
          </div>
          <button
            onClick={() => setSessionsModalOpen(true)}
            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
          >
            Manage active sessions →
          </button>
        </div>

        {/* Last Security Review Card */}
        <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Last Security Review
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Account security reviewed recently.
          </p>
        </div>
      </div>

      {/* MAIN 2-COLUMN GRID (Personal Credentials & Security Access) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Personal & Contact Credentials (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5 transition-colors">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Personal & Contact Credentials
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your personal identity details and contact information.
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    {firstName || 'Not provided'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    {lastName || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Official Administrator Email (Immutable & Verified) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Official Administrator Email
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                  ✓ Verified Primary
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Primary email address cannot be changed directly to ensure administrative security and immutable audit trails.
              </p>
            </div>

            {/* Contact Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone Number
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  {/* Country Selector */}
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 focus:outline-none"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="font-mono">{selectedCountry.dialCode}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {isCountryDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5">
                        <div className="px-2 py-1 mb-1">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:outline-none"
                          />
                        </div>
                        {filteredCountries.slice(0, 30).map((c) => (
                          <button
                            key={c.iso2}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountryCode(c.dialCode);
                              setIsCountryDropdownOpen(false);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                          >
                            <span>{c.flag} {c.name}</span>
                            <span className="font-mono text-slate-400">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              ) : (
                <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  {countryCode} {phone || 'Not provided'}
                </p>
              )}
            </div>

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    {dateOfBirth || 'Not provided'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    {gender || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Mode Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Security & Access (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 transition-colors">
          <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Security & Access
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your authentication and access controls.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Password & Authentication */}
            <div className="py-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Password & Authentication
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Keep your account secure with a strong password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Change Password
              </button>
            </div>

            {/* MFA */}
            <div className="py-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Multi-Factor Auth (MFA)
                    </p>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded">
                      Enabled
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Add an extra layer of security to your admin account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMfaModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Manage MFA
              </button>
            </div>

            {/* Active Sessions */}
            <div className="py-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <MonitorSmartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Active Sessions
                    </p>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {activeDeviceCount} active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    View and manage your active login sessions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionsModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                View Sessions
              </button>
            </div>

            {/* Login Activity */}
            <div className="py-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Login Activity
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Review recent sign-in attempts and account activity.
                  </p>
                </div>
              </div>
              <a
                href="#security-activity-section"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                View Activity
              </a>
            </div>

            {/* Recovery Methods */}
            <div className="py-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Recovery Methods
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Manage emergency account recovery options.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecoveryModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER 2-COLUMN GRID (Administrative Permissions & Recent Security Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="security-activity-section">
        {/* LEFT COLUMN: Administrative Permissions (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 transition-colors">
          <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Administrative Permissions
              </h3>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                Granted by Role
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permissions are governed by role-based access control and cannot be modified from this page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* User Moderation */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    User Moderation
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Granted
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Access to moderate candidates, recruiters, and account statuses.
              </p>
            </div>

            {/* Job Governance */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Job Governance
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Granted
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Manage job approvals, content takedowns, and community guidelines.
              </p>
            </div>

            {/* Audit Log Access */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Audit Log Access
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Granted
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Inspect immutable system logs, actor attributions, and IP logs.
              </p>
            </div>

            {/* Platform Security Controls */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Platform Security
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Granted
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Rate limiting oversight, session invalidation, and CSRF protection.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Security Activity (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 transition-colors">
          <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Security Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest security events related to your administrator account.
              </p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All Logs
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No recent security activity recorded.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Event</th>
                    <th className="py-2 px-3">Context</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentLogs.slice(0, 5).map((log) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedAuditLog(log)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* DANGER ZONE (Separated Red-Tinted Section) */}
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                  Danger Zone
                </h3>
                {dangerZoneUnlocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 animate-pulse">
                    <Unlock className="w-3 h-3" />
                    Unlocked · Actions Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Locked for Safety
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80">
                These actions are high risk and may immediately affect platform administrative access.
              </p>
            </div>
          </div>

          {/* Explicit Unlock/Lock Toggle Button */}
          <div>
            <button
              type="button"
              onClick={() => setDangerZoneUnlocked(!dangerZoneUnlocked)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                dangerZoneUnlocked
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
              }`}
            >
              {dangerZoneUnlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Lock Danger Zone
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  Unlock Danger Zone
                </>
              )}
            </button>
          </div>
        </div>

        {/* Safety Lock Info banner */}
        {!dangerZoneUnlocked && (
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <Lock className="w-4 h-4 text-rose-500 shrink-0" />
            <span>
              Danger Zone actions are locked to prevent accidental clicks. Click <strong>"Unlock Danger Zone"</strong> above to enable these action buttons.
            </span>
          </div>
        )}

        <div className="divide-y divide-rose-200/60 dark:divide-rose-900/40 pt-1">
          {/* Sign Out Other Sessions */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-950 dark:text-rose-200">
                Sign out all other sessions
              </p>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-0.5">
                Terminate all active sessions on other browsers and devices. You will stay signed in on this device.
              </p>
            </div>
            <button
              type="button"
              disabled={!dangerZoneUnlocked}
              onClick={() => setConfirmSignOutOthersOpen(true)}
              title={!dangerZoneUnlocked ? 'Unlock Danger Zone above to enable this action' : undefined}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 ${
                dangerZoneUnlocked
                  ? 'bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              Sign out other sessions
            </button>
          </div>

          {/* Deactivate Account */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-950 dark:text-rose-200">
                Deactivate Administrator Account
              </p>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-0.5">
                Disable administrative access to the JobConnect Admin Center. Requires explicit verification.
              </p>
            </div>
            <button
              type="button"
              disabled={!dangerZoneUnlocked}
              onClick={() => setDeactivateModalOpen(true)}
              title={!dangerZoneUnlocked ? 'Unlock Danger Zone above to enable this action' : undefined}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                dangerZoneUnlocked
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 cursor-pointer'
                  : 'bg-rose-300 dark:bg-rose-950/50 text-white/50 cursor-not-allowed opacity-50 shadow-none'
              }`}
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* 1. Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Change Administrator Password
                </h3>
              </div>
              <button
                onClick={() => {
                  setChangePasswordModalOpen(false);
                  setPwError(null);
                  setPwSuccess(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                {pwSuccess}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="At least 8 chars with letter, number & special"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => changePasswordMutation.mutate()}
                disabled={changePasswordMutation.isPending || !currentPassword || !newPassword}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Sessions Management Modal */}
      {sessionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Administrator Sessions
                </h3>
              </div>
              <button
                onClick={() => setSessionsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Only this current browser session is active.
                </p>
              ) : (
                sessions.map((sess: any) => (
                  <div
                    key={sess._id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {sess.deviceType === 'mobile' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Laptop className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {sess.browser || 'Web Browser'} · {sess.os || 'Desktop OS'}
                          </span>
                          {sess.isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          IP: {sess.ipAddress || '127.0.0.1'} · Last active:{' '}
                          {new Date(sess.lastActiveAt || sess.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {!sess.isCurrent && (
                      <button
                        type="button"
                        onClick={() => revokeSessionMutation.mutate(sess._id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSessionsModalOpen(false);
                  setConfirmSignOutOthersOpen(true);
                }}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Sign out all other sessions
              </button>
              <button
                type="button"
                onClick={() => setSessionsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MFA Modal */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Multi-Factor Authentication (MFA)
                </h3>
              </div>
              <button
                onClick={() => setMfaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">MFA is Active</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Two-factor authentication is enforced for all administrative logins.
                  </p>
                </div>
              </div>
              <p className="leading-relaxed">
                Your administrator account is protected with email & device multi-factor verification. In order to change MFA settings or update recovery credentials, contact the platform governance team.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setMfaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Recovery Methods Modal */}
      {recoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Account Recovery Methods
                </h3>
              </div>
              <button
                onClick={() => setRecoveryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Verified Administrator Email
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Active</span>
                </div>
                <p className="font-mono text-[11px] text-slate-500">
                  {currentUser?.email}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Verified Phone SMS OTP
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Configured</span>
                </div>
                <p className="font-mono text-[11px] text-slate-500">
                  {countryCode} {phone || 'Configured on file'}
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setRecoveryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sign Out All Others Confirmation Modal */}
      {confirmSignOutOthersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sign out all other sessions?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You will stay signed in on this current browser device.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All other active sessions on laptops, phones, and tablets will be invalidated immediately. Any user using those sessions will be required to re-authenticate.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmSignOutOthersOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => revokeAllOthersMutation.mutate()}
                disabled={revokeAllOthersMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition-colors"
              >
                {revokeAllOthersMutation.isPending ? 'Signing out...' : 'Sign out others'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Deactivate Administrator Account Modal */}
      {deactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-rose-300 dark:border-rose-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Deactivate Administrator Account?
                </h3>
                <p className="text-xs text-rose-600 font-medium">
                  High-Risk Security Action
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action will disable access to the JobConnect Admin Center and immediately revoke your administrator credentials and privileges.
            </p>

            {deactivateError && (
              <p className="text-xs text-rose-600 font-semibold">{deactivateError}</p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Type <span className="font-mono font-bold text-rose-600">DEACTIVATE</span> to confirm:
              </label>
              <input
                type="text"
                value={deactivateConfirmationInput}
                onChange={(e) => {
                  setDeactivateConfirmationInput(e.target.value);
                  setDeactivateError(null);
                }}
                placeholder="DEACTIVATE"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDeactivateModalOpen(false);
                  setDeactivateConfirmationInput('');
                  setDeactivateError(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={deactivateConfirmationInput.trim() !== 'DEACTIVATE'}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-sm shadow-rose-600/30 transition-colors"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Security Activity Detail Drawer */}
      <AuditDetailDrawer
        log={selectedAuditLog}
        isOpen={Boolean(selectedAuditLog)}
        onClose={() => setSelectedAuditLog(null)}
      />
    </div>
  );
};

export default AdminProfilePage;
