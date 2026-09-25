import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import { ProfileAvatarUpload } from '../components/common/ProfileAvatarUpload.js';
import {
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  CheckCircle,
  Check,
  Pencil,
  X,
  ChevronDown,
  Search,
  Lock,
  KeyRound,
  Award,
  Activity,
  Users,
  Briefcase,
} from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  GENDER_OPTIONS,
  HIGHEST_QUALIFICATIONS,
} from '@jobconnect/shared';

export const AdminProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: authUser, refreshUser } = useAuth();

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
  const [highestQualification, setHighestQualification] = useState('');
  const dobInputRef = useRef<HTMLInputElement>(null);
  const maxDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [firstNameWarning, setFirstNameWarning] = useState<string | null>(null);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstNameWarning(null);
    const u = data?.user || authUser;

    if (u) {
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setEmail(u.email || '');
      setPhone(u.nationalNumber || '');
      if (u.countryCode) {
        setCountryCode(u.countryCode);
        const foundCountry = COUNTRIES.find((c) => c.dialCode === u.countryCode);
        if (foundCountry) setSelectedCountry(foundCountry);
      }
      setDateOfBirth(u.dateOfBirth || '');
      setGender((u.gender as any) || '');
      setHighestQualification(u.highestQualification || '');
    }
  };

  // Close country dropdown when clicked outside
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

  // Fetch admin profile data
  const { data, isLoading } = useQuery({
    queryKey: ['adminProfile'],
    queryFn: async () => {
      const res = await api.get('/admin/profile');
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (data) {
      const u = data.user || authUser;
      if (u) {
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setEmail(u.email || '');
        setPhone(u.nationalNumber || '');
        if (u.countryCode) {
          setCountryCode(u.countryCode);
          const foundCountry = COUNTRIES.find((c) => c.dialCode === u.countryCode);
          if (foundCountry) setSelectedCountry(foundCountry);
        }
        setDateOfBirth(u.dateOfBirth || '');
        setGender((u.gender as any) || '');
        setHighestQualification(u.highestQualification || '');
      }
    }
  }, [data, authUser]);

  // Format first name: capitalize first letter, disallow spaces
  const handleFirstNameChange = (val: string) => {
    if (/\s/.test(val)) {
      setFirstNameWarning('Spaces are not allowed in First Name');
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

  // Update Admin Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/admin/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        countryCode,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        highestQualification: highestQualification || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
      refreshUser();
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading administrator profile..." />;
  }

  const currentUser = data?.user || authUser;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/admin/dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Administrator Profile & Credentials
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your primary platform administrator identity, security clearance, and contact details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/40 px-3.5 py-1.5 rounded-xl border border-red-100 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold">
            <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Role: Platform Super Admin</span>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => updateMutation.mutate()}
                isLoading={updateMutation.isPending}
                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Save Changes
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="cursor-pointer shadow-sm bg-red-600 hover:bg-red-700 text-white"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center shadow-sm transition-all">
          <CheckCircle className="w-5 h-5 mr-2.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Administrator profile details successfully updated and logged in the immutable audit trail!</span>
        </div>
      )}

      {/* Profile Photo / Avatar Card */}
      <ProfileAvatarUpload
        currentAvatar={currentUser?.avatar}
        name={currentUser?.name}
        roleTitle="Platform Administrator"
        isEditing={isEditing}
      />

      {/* System Governance & Vitality Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Security Clearance</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Level 5 (ROOT_ADMIN)</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">System Status</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Active & Verified</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Governance Scope</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Platform-Wide Authority</p>
          </div>
        </div>
      </div>

      {/* Main Admin Information Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-red-600 dark:text-red-400" /> Personal & Contact Credentials
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal identity information associated with your platform administrator account
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder="e.g. Super"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
            {firstNameWarning && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {firstNameWarning}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={handleLastNameBlur}
              placeholder="e.g. Admin"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Email Address (Official Admin Email - Read Only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Official Administrator Email
          </label>
          <div className="relative">
            <input
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-not-allowed pr-28"
            />
            <span className="absolute right-3 top-2.5 inline-flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-3 h-3 mr-1" /> Root Verified
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Primary email address cannot be changed directly to ensure administrative security and immutable audit trails.
          </p>
        </div>

        {/* Contact Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Contact Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {/* Country Selector */}
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="h-full flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:cursor-not-allowed"
              >
                <span>{selectedCountry.dialCode}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isCountryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-2">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.dialCode + c.name}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setCountryCode(c.dialCode);
                          setIsCountryDropdownOpen(false);
                          setCountrySearch('');
                        }}
                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-slate-700 dark:text-slate-200"
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                          {c.dialCode}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* National Number Input */}
            <input
              type="tel"
              disabled={!isEditing}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 9999999991"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Date of Birth, Gender, Highest Qualification */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date of Birth with clickable calendar picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date of Birth
            </label>
            <div
              className={`relative flex items-center ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => {
                if (isEditing && dobInputRef.current) {
                  try {
                    dobInputRef.current.showPicker?.();
                  } catch {
                    dobInputRef.current.focus();
                  }
                }
              }}
            >
              <input
                ref={dobInputRef}
                type="date"
                disabled={!isEditing}
                max={maxDate}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gender
            </label>
            <select
              disabled={!isEditing}
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              <option value="">Select Gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Highest Qualification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Highest Qualification
            </label>
            <select
              disabled={!isEditing}
              value={highestQualification}
              onChange={(e) => setHighestQualification(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              <option value="">Select Qualification</option>
              {HIGHEST_QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform Privileges & Security Clearances Section */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-red-600 dark:text-red-400" /> Platform Super Admin Privileges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-2.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">User Moderation Authority</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ability to activate, suspend, or update verification statuses of all candidates and recruiters.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-2.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Job Postings Governance</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Moderate, publish, pause, or review all job postings across the entire platform.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-2.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Immutable Audit Trail Access</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full forensic log examination of all authentication, moderation, and security events.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-2.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Platform Security Policy Control</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Rate limiting, session management, and CSRF protection oversight.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Admin Profile Button (Visible only when editing) */}
        {isEditing && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All credentials and identity updates will be saved to your administrator account and logged in audit logs.
            </p>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => updateMutation.mutate()}
                isLoading={updateMutation.isPending}
                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save Administrator Profile
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
