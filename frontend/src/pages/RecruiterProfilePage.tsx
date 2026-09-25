import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import { ProfileAvatarUpload } from '../components/common/ProfileAvatarUpload.js';
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
  CheckCircle,
  Sparkles,
  ChevronDown,
  Search,
  Check,
  TrendingUp,
  FileCheck,
  Pencil,
  Shield,
  X,
} from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  GENDER_OPTIONS,
} from '@jobconnect/shared';

export const RecruiterProfilePage: React.FC = () => {
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

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [firstNameWarning, setFirstNameWarning] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
  };

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

  // Fetch recruiter profile data
  const { data, isLoading } = useQuery({
    queryKey: ['recruiterProfile'],
    queryFn: async () => {
      const res = await api.get('/recruiter/profile');
      return res.data?.data;
    },
  });

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

  // First name formatting
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

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      queryClient.invalidateQueries({ queryKey: ['recruiterProfile'] });
      refreshUser();
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading recruiter details..." />;
  }

  const stats = data?.stats || { totalJobsPosted: 0, activeJobs: 0, totalApplications: 0 };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/recruiter/dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruiter Details & Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal recruiter account, profile photo, verified organization details, and company branding
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Role: Verified Recruiter</span>
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
                className="cursor-pointer"
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
              className="cursor-pointer shadow-sm"
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
          <span>Recruiter aur Company details successfully save ho gayi hain! (All details saved).</span>
        </div>
      )}

      {/* Profile Photo / Avatar Card */}
      <ProfileAvatarUpload
        currentAvatar={data?.user?.avatar || authUser?.avatar}
        name={data?.user?.name || authUser?.name}
        isEditing={isEditing}
      />

      {/* Recruitment Activity Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Jobs Posted</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {stats.totalJobsPosted}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Across all listings</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Openings</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.activeJobs}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Accepting applications</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applicants</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {stats.totalApplications}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Candidate submissions</span>
        </div>
      </div>

      {/* Recruiter Personal Information Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            Recruiter Personal Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your name and contact details visible to candidates
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
              placeholder="e.g. Rahul"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
            {firstNameWarning && isEditing && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
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
              placeholder="e.g. Sharma"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address (Verified)
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-850 px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Verified
              </span>
            </div>
          </div>

          {/* Phone Number with Country Flag Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number
            </label>
            <div className={`flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative ${
              isEditing ? 'focus-within:ring-2 focus-within:ring-blue-500' : 'bg-slate-50 dark:bg-slate-850 cursor-not-allowed'
            }`}>
              <div className="relative" ref={countryDropdownRef}>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => isEditing && setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className={`h-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700 rounded-l-xl flex items-center space-x-2 text-xs transition-colors ${
                    isEditing ? 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer' : 'cursor-not-allowed opacity-80'
                  }`}
                >
                  <img
                    src={`https://flagcdn.com/w40/${selectedCountry.iso2.toLowerCase()}.png`}
                    alt={selectedCountry.name}
                    className="w-5 h-3.5 object-cover rounded shadow-xs flex-shrink-0"
                    loading="lazy"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedCountry.dialCode}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isCountryDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 max-h-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-60 divide-y divide-slate-50 dark:divide-slate-800">
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
                                className="w-5 h-3.5 object-cover rounded shadow-xs flex-shrink-0"
                                loading="lazy"
                              />
                              <span className="truncate">{c.name}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                              <span className="font-mono text-[11px] text-slate-500">{c.dialCode}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
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
                placeholder="Phone Number"
                className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-600 dark:disabled:text-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
              className={`relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 ${
                isEditing ? 'cursor-pointer' : 'bg-slate-50 dark:bg-slate-850 cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                ref={dobInputRef}
                type="date"
                disabled={!isEditing}
                max={maxDate}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                onClick={(e) => {
                  if (!isEditing) return;
                  try {
                    (e.target as HTMLInputElement).showPicker?.();
                  } catch {}
                }}
                className={`w-full bg-transparent pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none disabled:text-slate-600 dark:disabled:text-slate-300 ${
                  isEditing ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
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
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              <option value="">Select Gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Company & Organization Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <Building className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            Company & Organization Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your hiring company profile, website, industry, and office headquarters
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Company / Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Acme Innovations Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Website URL
            </label>
            <input
              type="url"
              disabled={!isEditing}
              placeholder="https://company.com"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Industry
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Fintech, SaaS, Healthtech"
              value={companyIndustry}
              onChange={(e) => setCompanyIndustry(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Headquarters / Location
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Bangalore, India"
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Company Size
            </label>
            <select
              disabled={!isEditing}
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              <option value="">Select Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            About Company & Culture
          </label>
          <textarea
            rows={4}
            disabled={!isEditing}
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            placeholder="Tell candidates about your mission, engineering culture, and benefits..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
          />
        </div>

        {/* Save Recruiter Profile Button (Visible only when editing) */}
        {isEditing && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All details above will be saved to your recruiter account and company profile.
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
                className="cursor-pointer"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save Profile Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
