import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Building,
  User,
  Mail,
  Calendar,
  Phone,
  Briefcase,
  Globe,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  TrendingUp,
  FileCheck,
  Pencil,
  Shield,
  X,
  Lock,
  KeyRound,
  Laptop,
  Smartphone,
  AlertCircle,
  Eye,
  ExternalLink,
  RefreshCw,
  Bell,
  Trash2,
  Camera,
  Loader2,
  Clock,
  Zap,
  Info,
  Sliders,
  CheckSquare,
  Square,
  LogOut,
  Flame,
} from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  GENDER_OPTIONS,
} from '@jobconnect/shared';

// Standardized Industries
const INDUSTRY_OPTIONS = [
  'Software & Technology',
  'FinTech & Banking',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'EdTech & Education',
  'Consulting & Professional Services',
  'AI & Machine Learning',
  'Media & Entertainment',
  'Manufacturing & Hardware',
  'Other',
];

// Standardized Company Sizes
const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5000+ employees',
];

// Popular Recruiter Preference Categories
const POPULAR_HIRING_CATEGORIES = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Engineering',
  'DevOps & Cloud',
  'Mobile Apps (iOS/Android)',
  'Data Science & AI',
  'Product Management',
  'UI/UX Design',
  'QA & Testing',
];

// Popular Hiring Locations
const POPULAR_HIRING_LOCATIONS = [
  'Bengaluru, India',
  'Remote (Worldwide)',
  'Remote (India)',
  'Hyderabad, India',
  'Mumbai, India',
  'Delhi NCR, India',
  'Pune, India',
  'Chennai, India',
];

export const RecruiterProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser, refreshUser } = useAuth();

  // Mode toggles
  const [isEditing, setIsEditing] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);

  // Personal Info States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY.dialCode);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const dobInputRef = useRef<HTMLInputElement>(null);
  const maxDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Company Info States
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyFoundedYear, setCompanyFoundedYear] = useState<number | ''>('');

  const [firstNameWarning, setFirstNameWarning] = useState<string | null>(null);

  // Recruiter Preferences States (In-memory, zero leakage to localStorage)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([
    'Full Stack Engineering',
    'Backend Development',
  ]);

  const [preferredLocations, setPreferredLocations] = useState<string[]>([
    'Bengaluru, India',
    'Remote (India)',
  ]);

  const [preferredWorkModes, setPreferredWorkModes] = useState<string[]>([
    'remote',
    'hybrid',
  ]);

  const [notifications, setNotifications] = useState({
    newApplications: true,
    interviewUpdates: true,
    candidateMessages: true,
    aiRecommendations: true,
  });

  // Profile Visibility Toggles
  const [isPublicVisible, setIsPublicVisible] = useState(true);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch recruiter profile data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recruiterProfile'],
    queryFn: async () => {
      const res = await api.get('/recruiter/profile');
      return res.data?.data;
    },
  });

  // Fetch active sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['userSessions'],
    queryFn: async () => {
      try {
        const res = await api.get('/sessions');
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  // Synchronize form state from backend
  useEffect(() => {
    if (data) {
      const u = data.user || authUser;
      const c = data.company;

      if (u) {
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setEmail(u.email || '');
        setPhone(u.nationalNumber || '');
        if (u.countryCode) {
          setCountryCode(u.countryCode);
          const foundCountry = COUNTRIES.find((co) => co.dialCode === u.countryCode);
          if (foundCountry) setSelectedCountry(foundCountry);
        }
        setDateOfBirth(u.dateOfBirth || '');
        setGender((u.gender as any) || '');
        setAvatarSrc(u.avatar);
      }

      if (c) {
        setCompanyName(c.name || '');
        setCompanyWebsite(c.website || '');
        setCompanyIndustry(c.industry || '');
        setCompanyLocation(c.location || '');
        setCompanySize(c.companySize || '');
        setCompanyDescription(c.description || '');
        setCompanyFoundedYear(c.foundedYear || '');
      }
    }
  }, [data, authUser]);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  // First name formatting: capitalize, disallow spaces
  const handleFirstNameChange = (val: string) => {
    if (/\s/.test(val)) {
      setFirstNameWarning('Spaces are not permitted in First Name');
    } else {
      setFirstNameWarning(null);
    }
    const noSpaces = val.replace(/\s+/g, '');
    const capitalized =
      noSpaces.length > 0
        ? noSpaces.charAt(0).toUpperCase() + noSpaces.slice(1)
        : '';
    setFirstName(capitalized);
  };

  const handleLastNameBlur = () => {
    setLastName((prev) => prev.trim());
  };

  // Revert/Cancel Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstNameWarning(null);
    const u = data?.user || authUser;
    const c = data?.company;

    if (u) {
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setEmail(u.email || '');
      setPhone(u.nationalNumber || '');
      if (u.countryCode) {
        setCountryCode(u.countryCode);
        const foundCountry = COUNTRIES.find((co) => co.dialCode === u.countryCode);
        if (foundCountry) setSelectedCountry(foundCountry);
      }
      setDateOfBirth(u.dateOfBirth || '');
      setGender((u.gender as any) || '');
    }

    if (c) {
      setCompanyName(c.name || '');
      setCompanyWebsite(c.website || '');
      setCompanyIndustry(c.industry || '');
      setCompanyLocation(c.location || '');
      setCompanySize(c.companySize || '');
      setCompanyDescription(c.description || '');
      setCompanyFoundedYear(c.foundedYear || '');
    }
    showToast('Edits reverted to saved profile values.', 'error');
  };

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (!isEditing) return false;
    const u = data?.user || authUser;
    const c = data?.company;
    if (!u) return false;

    return (
      firstName !== (u.firstName || '') ||
      lastName !== (u.lastName || '') ||
      phone !== (u.nationalNumber || '') ||
      countryCode !== (u.countryCode || DEFAULT_COUNTRY.dialCode) ||
      dateOfBirth !== (u.dateOfBirth || '') ||
      gender !== ((u.gender as any) || '') ||
      companyName !== (c?.name || '') ||
      companyWebsite !== (c?.website || '') ||
      companyIndustry !== (c?.industry || '') ||
      companyLocation !== (c?.location || '') ||
      companySize !== (c?.companySize || '') ||
      companyDescription !== (c?.description || '') ||
      companyFoundedYear !== (c?.foundedYear || '')
    );
  }, [
    isEditing,
    firstName,
    lastName,
    phone,
    countryCode,
    dateOfBirth,
    gender,
    companyName,
    companyWebsite,
    companyIndustry,
    companyLocation,
    companySize,
    companyDescription,
    companyFoundedYear,
    data,
    authUser,
  ]);

  // Profile Completion Calculation (Dynamic & authoritatively based on real fields)
  const profileCompletion = useMemo(() => {
    const fields = [
      { key: 'avatar', label: 'Recruiter Profile Photo', done: Boolean(avatarSrc || data?.user?.avatar || authUser?.avatar) },
      { key: 'firstName', label: 'First Name', done: Boolean(firstName?.trim()) },
      { key: 'lastName', label: 'Last Name', done: Boolean(lastName?.trim()) },
      { key: 'email', label: 'Verified Email Address', done: Boolean(email?.trim()) },
      { key: 'phone', label: 'Contact Phone Number', done: Boolean(phone?.trim()) },
      { key: 'dob', label: 'Date of Birth', done: Boolean(dateOfBirth) },
      { key: 'companyName', label: 'Company / Organization Name', done: Boolean(companyName?.trim()) },
      { key: 'companyWebsite', label: 'Company Website URL', done: Boolean(companyWebsite?.trim()) },
      { key: 'companyLocation', label: 'Headquarters / Location', done: Boolean(companyLocation?.trim()) },
      { key: 'companyIndustry', label: 'Industry & Sector', done: Boolean(companyIndustry?.trim()) },
      { key: 'companySize', label: 'Company Team Size', done: Boolean(companySize?.trim()) },
      { key: 'companyDescription', label: 'About Company & Culture', done: Boolean(companyDescription?.trim() && companyDescription.trim().length >= 25) },
    ];

    const completed = fields.filter((f) => f.done).length;
    const percentage = Math.round((completed / fields.length) * 100);

    return {
      percentage,
      fields,
      completed,
      total: fields.length,
    };
  }, [
    avatarSrc,
    data,
    authUser,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    companyName,
    companyWebsite,
    companyLocation,
    companyIndustry,
    companySize,
    companyDescription,
  ]);

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      // Validate website URL if provided
      if (companyWebsite.trim() && !companyWebsite.trim().startsWith('http://') && !companyWebsite.trim().startsWith('https://')) {
        throw new Error('Company Website must begin with https:// or http://');
      }

      const res = await api.patch('/recruiter/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        countryCode,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim() || undefined,
        companyIndustry: companyIndustry.trim() || undefined,
        companyLocation: companyLocation.trim() || undefined,
        companySize: companySize.trim() || undefined,
        companyDescription: companyDescription.trim() || undefined,
        companyFoundedYear: companyFoundedYear ? Number(companyFoundedYear) : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      showToast('Profile and company workspace updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['recruiterProfile'] });
      refreshUser();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update recruiter profile.';
      showToast(msg, 'error');
    },
  });

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please upload a smaller image.', 'error');
      return;
    }

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      showToast('Invalid image format. Supported formats: PNG, JPG, JPEG, WEBP.', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/auth/avatar', formData);
      const newAvatarUrl = res.data?.data?.avatarUrl;
      if (newAvatarUrl) {
        setAvatarSrc(newAvatarUrl);
      }
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['recruiterProfile'] });
      showToast('Profile photo updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to upload profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Avatar Remove Handler
  const handleRemoveAvatar = async () => {
    if (!avatarSrc) return;
    setIsUploadingAvatar(true);
    try {
      await api.delete('/auth/avatar');
      setAvatarSrc(undefined);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['recruiterProfile'] });
      showToast('Profile photo removed.');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to remove profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Change Password Handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully! Please keep your new credentials safe.');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error?.message || 'Failed to update password. Check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Revoke other sessions
  const handleRevokeOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out from all other active devices?')) {
      return;
    }
    try {
      const res = await api.delete('/sessions/actions/revoke-others');
      const count = res.data?.data?.revokedCount || 0;
      refetchSessions();
      showToast(`Logged out from ${count} other device(s) successfully.`);
    } catch {
      showToast('Failed to revoke sessions. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading recruiter workspace & profile..." />;
  }

  const user = data?.user || authUser;
  const company = data?.company;
  const stats = data?.stats || {
    totalJobsPosted: 0,
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
  };

  const isVerifiedAccount = user?.isEmailVerified || company?.isVerified;
  const displayAvatar = avatarSrc || user?.avatar;
  const initials = user?.name?.trim() ? user.name.trim()[0].toUpperCase() : 'R';

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <BackButton label="Back to Dashboard" fallbackUrl="/recruiter/dashboard" />
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Workspace:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{company?.name || 'Recruiter Portal'}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: PAGE HEADER & COMPLETION BAR */}
        {/* ========================================================================= */}
        <div className="bg-white/80 dark:bg-[#0D1220]/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                  <Briefcase className="w-3.5 h-3.5" /> Recruiter Workspace
                </span>

                {isVerifiedAccount ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified Recruiter
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Verification Required
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowChecklistModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  {profileCompletion.percentage}% Profile Complete ▾
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Recruiter Profile & Workspace
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Manage your hiring identity, organization branding, candidate preferences, and security controls.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs font-semibold bg-white dark:bg-[#0C1322] border-slate-200 dark:border-slate-700"
              >
                <Eye className="w-4 h-4 mr-1.5 text-blue-600" /> Preview Public Identity
              </Button>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleCancelEdit}
                    disabled={updateMutation.isPending}
                    className="text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Discard
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => updateMutation.mutate()}
                    isLoading={updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Save Changes
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Dynamic Completion Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <span>Profile Readiness:</span>
                <span className={profileCompletion.percentage === 100 ? 'text-emerald-600' : 'text-blue-600'}>
                  {profileCompletion.percentage}%
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({profileCompletion.completed} of {profileCompletion.total} sections configured)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChecklistModal(true)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Checklist
              </button>
            </div>
            
            <div
              role="progressbar"
              aria-valuenow={profileCompletion.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  profileCompletion.percentage === 100
                    ? 'bg-emerald-500'
                    : profileCompletion.percentage > 70
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: PROFILE HERO / IDENTITY ANCHOR */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/70 to-blue-50/30 dark:from-[#0D1220] dark:via-[#090D18] dark:to-[#111827] border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            
            {/* Avatar Section with Interactive Upload Badge */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-4xl shadow-md border-3 border-white dark:border-slate-800">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={user?.name || 'Recruiter'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Upload & Remove trigger buttons (Only visible and active when editing) */}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    title="Upload or Change Photo"
                    className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-blue-600 hover:bg-blue-700 text-white transition-transform hover:scale-105 cursor-pointer animate-in fade-in zoom-in-75 duration-150"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>

                  {displayAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      title="Remove Photo"
                      className="absolute -top-2 -right-2 p-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-colors animate-in fade-in zoom-in-75 duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Recruiter & Company Meta */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {user?.name || `${firstName} ${lastName}` || 'Recruiter Name'}
                </h2>
                {isVerifiedAccount && (
                  <span className="inline-flex items-center text-blue-600 dark:text-blue-400" title="Verified Recruiter Identity">
                    <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white dark:text-slate-900 inline" />
                  </span>
                )}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 w-fit mx-auto sm:mx-0">
                  Talent Acquisition Lead
                </span>
              </div>

              {/* Company line */}
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{company?.name || companyName || 'Organization Name'}</span>
                {company?.isVerified && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Verified Org
                  </span>
                )}
              </div>

              {/* Meta details row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {companyLocation || company?.location || 'Location Not Specified'}
                </span>
                
                {companyWebsite && (
                  <a
                    href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{companyWebsite.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email || user?.email}
                </span>

                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {countryCode} {phone || 'Phone not set'}
                </span>
              </div>
            </div>

            {/* Quick Preview Action */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs font-semibold bg-white dark:bg-[#0D1220] border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Candidate View
              </Button>
              <span className="text-[10px] text-slate-400">Public visibility active</span>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: KEY RECRUITING METRICS (ACTIONABLE) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Jobs */}
          <button
            onClick={() => navigate('/recruiter/jobs')}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Jobs
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalJobsPosted}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>All job vacancies</span>
              <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">Manage →</span>
            </div>
          </button>

          {/* Card 2: Active Openings */}
          <button
            onClick={() => navigate('/recruiter/jobs')}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active Openings
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.activeJobs}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Published & live</span>
              <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">View →</span>
            </div>
          </button>

          {/* Card 3: Total Applicants */}
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Total Applicants
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {stats.totalApplications}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Candidate submissions</span>
              <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">Review →</span>
            </div>
          </button>

          {/* Card 4: Shortlisted */}
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Shortlisted
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.shortlisted || 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Passed review stages</span>
              <span className="text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">Pipeline →</span>
            </div>
          </button>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: MAIN WORKSPACE (2-COLUMN GRID) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN (~65% / 8 Cols) ================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: PERSONAL DETAILS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Personal Details</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Your identity and verified direct contact information.
                    </p>
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  {firstNameWarning && isEditing && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                      {firstNameWarning}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={handleLastNameBlur}
                    placeholder="e.g. Connor"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Account ID)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 rounded-xl cursor-not-allowed"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ✓ Verified
                    </span>
                  </div>
                </div>

                {/* Phone Number with Country Flag Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <div className={`flex rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0C1322] relative ${
                    isEditing ? 'focus-within:ring-1 focus-within:ring-blue-500' : 'opacity-80'
                  }`}>
                    <div className="relative" ref={countryDropdownRef}>
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => isEditing && setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className={`h-full px-3 py-2 border-r border-slate-200 dark:border-slate-700/80 rounded-l-xl flex items-center space-x-1.5 text-xs ${
                          isEditing ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      >
                        <img
                          src={`https://flagcdn.com/w40/${selectedCountry.iso2.toLowerCase()}.png`}
                          alt={selectedCountry.name}
                          className="w-4 h-3 object-cover rounded shadow-2xs"
                          loading="lazy"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedCountry.dialCode}</span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isCountryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-72 max-h-80 bg-white dark:bg-[#0D1220] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0C1322]">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-60 divide-y divide-slate-50 dark:divide-slate-800/80">
                            {filteredCountries.map((c) => {
                              const isSelected = selectedCountry.iso2 === c.iso2;
                              return (
                                <button
                                  key={c.iso2}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setCountryCode(c.dialCode);
                                    setIsCountryDropdownOpen(false);
                                    setCountrySearch('');
                                  }}
                                  className={`w-full px-3 py-2 flex items-center justify-between text-xs hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-left ${
                                    isSelected
                                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <img
                                      src={`https://flagcdn.com/w40/${c.iso2.toLowerCase()}.png`}
                                      alt={c.name}
                                      className="w-4 h-3 object-cover rounded shadow-2xs"
                                    />
                                    <span className="truncate">{c.name}</span>
                                  </div>
                                  <span className="font-mono text-[11px] text-slate-400">{c.dialCode}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <div
                    onClick={() => {
                      if (!isEditing) return;
                      if (dobInputRef.current) {
                        try {
                          dobInputRef.current.showPicker();
                        } catch {
                          dobInputRef.current.focus();
                        }
                      }
                    }}
                    className={`relative rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0C1322] ${
                      isEditing ? 'cursor-pointer' : 'opacity-80 cursor-not-allowed'
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <input
                      ref={dobInputRef}
                      type="date"
                      disabled={!isEditing}
                      max={maxDate}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-transparent pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    disabled={!isEditing}
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                  >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 2: COMPANY & ORGANIZATION */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Company & Organization</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hiring company profile, website, industry, and organizational brand.
                    </p>
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. Stripe, Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Company Website URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Website URL
                  </label>
                  <input
                    type="url"
                    disabled={!isEditing}
                    placeholder="https://company.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Industry */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Industry
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      list="industry-list"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="e.g. FinTech, SaaS"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-xl">
                      {companyIndustry || 'Not Specified'}
                    </div>
                  )}
                  <datalist id="industry-list">
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind} value={ind} />
                    ))}
                  </datalist>
                </div>

                {/* Headquarters / Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Headquarters / Location
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. Bengaluru, India"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Size
                  </label>
                  <select
                    disabled={!isEditing}
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                  >
                    <option value="">Select Size</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* About Company & Culture */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    About Company & Culture
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {companyDescription.length} / 3000 chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  disabled={!isEditing}
                  maxLength={3000}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Describe your organization's mission, engineering culture, benefits, and candidate expectations..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* CARD 3: RECRUITER PREFERENCES */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recruiter Hiring Preferences</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Personalize your hiring pipeline, candidate matchmaking, and alerts.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  Auto-saved
                </span>
              </div>

              {/* Preferred Hiring Categories */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Hiring Roles & Disciplines
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_HIRING_CATEGORIES.map((cat) => {
                    const isSelected = preferredCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setPreferredCategories((prev) =>
                            isSelected ? prev.filter((c) => c !== cat) : [...prev, cat]
                          );
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-2xs'
                            : 'bg-slate-50 dark:bg-[#0C1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Locations */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Preferred Talent Locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_HIRING_LOCATIONS.map((loc) => {
                    const isSelected = preferredLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setPreferredLocations((prev) =>
                            isSelected ? prev.filter((l) => l !== loc) : [...prev, loc]
                          );
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                            : 'bg-slate-50 dark:bg-[#0C1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Modes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Accepted Work Modes
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'remote', label: 'Remote' },
                    { id: 'hybrid', label: 'Hybrid' },
                    { id: 'onsite', label: 'On-site' },
                  ].map((mode) => {
                    const isSelected = preferredWorkModes.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setPreferredWorkModes((prev) =>
                            isSelected ? prev.filter((m) => m !== mode.id) : [...prev, mode.id]
                          );
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#0C1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notification Channels & Alerts
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0C1322] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300">New Applicant Submissions</span>
                    <input
                      type="checkbox"
                      checked={notifications.newApplications}
                      onChange={(e) => setNotifications({ ...notifications, newApplications: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0C1322] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300">Interview Schedules</span>
                    <input
                      type="checkbox"
                      checked={notifications.interviewUpdates}
                      onChange={(e) => setNotifications({ ...notifications, interviewUpdates: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0C1322] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300">Direct Candidate Messages</span>
                    <input
                      type="checkbox"
                      checked={notifications.candidateMessages}
                      onChange={(e) => setNotifications({ ...notifications, candidateMessages: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0C1322] border border-slate-200/70 dark:border-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300">AI Match Recommendations</span>
                    <input
                      type="checkbox"
                      checked={notifications.aiRecommendations}
                      onChange={(e) => setNotifications({ ...notifications, aiRecommendations: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ================= RIGHT COLUMN (~35% / 4 Cols - Sticky) ================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* WIDGET 1: PROFILE VISIBILITY & CANDIDATE VIEW */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" /> Profile Visibility
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isPublicVisible ? 'Live to Candidates' : 'Private'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Public Recruiter Card
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Allow applicants to view your verified hiring identity.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublicVisible}
                  onChange={(e) => {
                    setIsPublicVisible(e.target.checked);
                    showToast(`Recruiter profile visibility set to ${e.target.checked ? 'Public' : 'Private'}.`);
                  }}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer ml-3"
                />
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Candidate Visible Elements
                </span>
                
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Name, Photo & Role</span>
                  <span className="text-emerald-600 font-bold">✓ Public</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Company Name & Logo</span>
                  <span className="text-emerald-600 font-bold">✓ Public</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Location & Website</span>
                  <span className="text-emerald-600 font-bold">✓ Public</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-1">
                  <span>Direct Personal Phone</span>
                  <span className="text-slate-400 font-medium">○ Private (Protected)</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="w-full text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Public Identity
              </Button>
            </div>

            {/* WIDGET 2: SECURITY & ACCOUNT CENTER */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> Security Center
                </h3>
                <span className="text-xs text-slate-400">Account Health</span>
              </div>

              <div className="space-y-3">
                {/* Email verification status */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Email Status</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Primary login verified</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Verified
                  </span>
                </div>

                {/* Password status */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Password</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Secured with bcrypt</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change →
                  </button>
                </div>

                {/* Active Sessions */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Active Sessions</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sessionsData?.length || 1} device session active
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSessionsModal(true)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Manage →
                  </button>
                </div>
              </div>
            </div>

            {/* WIDGET 3: RECENT WORKSPACE ACTIVITY */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Workspace Activity
                </h3>
                <span className="text-xs text-slate-400">Recent</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                      Profile synchronized
                    </p>
                    <p className="text-[10px] text-slate-400">Active recruiter session</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                      {company?.name || 'Company'} branding verified
                    </p>
                    <p className="text-[10px] text-slate-400">ATS job postings connected</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                      Hiring pipeline tracking active
                    </p>
                    <p className="text-[10px] text-slate-400">{stats.totalApplications} applicant submissions</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM SAVE BAR (Appears only when dirty in edit mode) */}
      {/* ========================================================================= */}
      {isDirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0D1220]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 shadow-2xl transition-all animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>You have unsaved changes in your recruiter profile.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="flex-1 sm:flex-none text-xs font-semibold"
              >
                Discard Changes
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => updateMutation.mutate()}
                isLoading={updateMutation.isPending}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
              >
                Save Profile Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROFILE COMPLETION CHECKLIST */}
      {/* ========================================================================= */}
      {showChecklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Profile Completion ({profileCompletion.percentage}%)
                </h3>
              </div>
              <button onClick={() => setShowChecklistModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {profileCompletion.fields.map((field) => (
                <div
                  key={field.key}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium ${
                    field.done
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {field.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    {field.label}
                  </span>
                  <span className="text-[11px] font-bold">
                    {field.done ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowChecklistModal(false);
                  setIsEditing(true);
                }}
                className="text-xs font-bold bg-blue-600 text-white"
              >
                Complete Remaining Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CANDIDATE-FACING PUBLIC PROFILE PREVIEW */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Public Candidate Preview
                </h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Public Identity Card */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#101827] border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Recruiter" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {user?.name || `${firstName} ${lastName}`}
                    <CheckCircle2 className="w-4 h-4 text-blue-500 inline" />
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Recruiter at <span className="font-semibold text-slate-900 dark:text-white">{company?.name || companyName}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {companyLocation || company?.location || 'India'}
                  </p>
                </div>
              </div>

              {/* Organization Snippet */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">About {company?.name || companyName || 'Company'}</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                  {companyDescription || 'Leading technology and talent organization hiring forward-thinking engineers and innovators.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                {companyWebsite && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-medium">
                    🌐 {companyWebsite.replace(/^https?:\/\//, '')}
                  </span>
                )}
                {companyIndustry && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    🏢 {companyIndustry}
                  </span>
                )}
                {companySize && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    👥 {companySize}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-blue-600" />
              <span>Personal phone numbers, active sessions, and sensitive account credentials are strictly hidden from public view.</span>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                className="text-xs font-semibold"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHANGE PASSWORD */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Update Account Password
                </h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars with letter, number, special char"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isChangingPassword}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isChangingPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Save New Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MANAGE ACTIVE SESSIONS */}
      {/* ========================================================================= */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Logged-in Sessions
                </h3>
              </div>
              <button onClick={() => setShowSessionsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Current Browser</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.2 rounded">This Device</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Active now • Anti-CSRF Token Protected
                  </p>
                </div>
              </div>

              {sessionsData && sessionsData.length > 1 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#101827] text-xs text-slate-600 dark:text-slate-400">
                  {sessionsData.length - 1} other active device(s) logged in.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeOtherSessions}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Revoke Other Devices
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessionsModal(false)}
                className="text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
