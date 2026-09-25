import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import { ProfileAvatarUpload } from '../components/common/ProfileAvatarUpload.js';
import {
  FileText,
  Upload,
  Trash2,
  Plus,
  X,
  CheckCircle,
  ExternalLink,
  Sparkles,
  User,
  Mail,
  Calendar,
  Briefcase,
  Globe,
  GraduationCap,
  ChevronDown,
  Search,
  Check,
  Image as ImageIcon,
  Phone,
  Pencil,
  Shield,
} from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  HIGHEST_QUALIFICATIONS,
  GENDER_OPTIONS,
} from '@jobconnect/shared';

export const CandidateProfilePage: React.FC = () => {
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

  // Professional Info States
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [firstNameWarning, setFirstNameWarning] = useState<string | null>(null);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstNameWarning(null);
    const u = data?.user || authUser;
    const p = data?.profile;

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

    if (p) {
      setHeadline(p.headline || '');
      setBio(p.bio || '');
      setLocation(p.location || '');
      setNoticePeriod(p.noticePeriod || '');
      setPortfolioUrl(p.portfolioUrl || '');
      setGithubUrl(p.githubUrl || '');
      setLinkedinUrl(p.linkedinUrl || '');
      setSkills(p.skills || []);
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

  // Fetch candidate profile & user data
  const { data, isLoading } = useQuery({
    queryKey: ['candidateProfile'],
    queryFn: async () => {
      const res = await api.get('/candidate/profile');
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (data) {
      const u = data.user || authUser;
      const p = data.profile;

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

      if (p) {
        setHeadline(p.headline || '');
        setBio(p.bio || '');
        setLocation(p.location || '');
        setNoticePeriod(p.noticePeriod || '');
        setPortfolioUrl(p.portfolioUrl || '');
        setGithubUrl(p.githubUrl || '');
        setLinkedinUrl(p.linkedinUrl || '');
        setSkills(p.skills || []);
      }
    }
  }, [data, authUser]);

  // Handle first name formatting: capitalize first letter, disallow spaces
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

  // Handle last name formatting: trimmed on blur
  const handleLastNameBlur = () => {
    setLastName((prev) => prev.trim());
  };

  // Update Profile Mutation (saves ALL personal and professional data)
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/candidate/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        countryCode,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        highestQualification: highestQualification || undefined,
        headline: headline.trim(),
        bio: bio.trim(),
        location: location.trim(),
        noticePeriod: noticePeriod.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        skills,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      refreshUser();
    },
  });

  // Resume Upload Mutation (supports PDF, DOCX, DOC, PNG, JPG, JPEG, WEBP)
  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/candidate/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      refreshUser();
    },
    onError: (err: any) => {
      setUploadError(
        err.response?.data?.error?.message ||
          'Resume upload failed. Only PDF, DOCX, and Images (PNG/JPG) up to 5MB are allowed.'
      );
    },
  });

  // Delete Resume Mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/candidate/resume');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      refreshUser();
    },
  });

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadResumeMutation.mutate(e.target.files[0]);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading candidate profile..." />;
  }

  const profile = data?.profile;
  const completionPercentage = data?.profileCompletionPercentage || 0;

  // Check if resume is image
  const isImageResume =
    profile?.resumeUrl &&
    /\.(png|jpe?g|webp)$/i.test(profile.resumeUrl || profile.resumeOriginalName || '');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Details & Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal information, profile photo, technical credentials, and resume document
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Profile Score: {completionPercentage}%</span>
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
          <span>Pura profile data successfully save ho gaya hai! (All personal and professional details saved).</span>
        </div>
      )}

      {/* Profile Photo / Avatar Card */}
      <ProfileAvatarUpload
        currentAvatar={data?.user?.avatar || authUser?.avatar}
        name={data?.user?.name || authUser?.name}
        isEditing={isEditing}
      />

      {/* Resume Card (Supports PDF, DOCX, DOC, PNG, JPG, JPEG, WEBP) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              Resume / CV Document
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supports PDF, DOCX, and Images (PNG, JPG, WEBP)
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
            Max 5MB
          </span>
        </div>

        {uploadError && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
            {uploadError}
          </p>
        )}

        {profile?.resumeUrl ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                {isImageResume ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {profile.resumeOriginalName || 'Attached Resume'}
                </p>
                <div className="flex items-center space-x-3 mt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    {isImageResume ? 'Image Document' : 'Document File'}
                  </span>
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center font-medium"
                  >
                    Preview / Download <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            {isEditing && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteResumeMutation.mutate()}
                isLoading={deleteResumeMutation.isPending}
                className="cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete Resume
              </Button>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Upload your PDF, DOCX, or Image (PNG/JPG) resume
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Supports: .pdf, .docx, .doc, .png, .jpg, .jpeg, .webp (Max 5MB)
            </p>
            {isEditing ? (
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <span className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-colors shadow-sm inline-flex items-center">
                  {uploadResumeMutation.isPending ? 'Uploading...' : 'Choose Resume File'}
                </span>
              </label>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 italic">
                (Resume upload karne ke liye upar &quot;Edit Profile&quot; par click karein)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Personal Information Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            Personal Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your name, verified contact information, and demographic profile
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
              placeholder="e.g. John"
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
              placeholder="e.g. Kumar Tiwari"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email (Read-only verified) */}
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
              {/* Country dropdown trigger */}
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

                {/* Country Dropdown Popover */}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date of Birth with full click to open calendar & future date disable */}
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

          {/* Highest Qualification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Highest Qualification
            </label>
            <select
              disabled={!isEditing}
              value={highestQualification}
              onChange={(e) => setHighestQualification(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
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
      </div>

      {/* Professional Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            Professional Details & Career Summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your career headline, technical bio, notice period, and work preferences
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Professional Headline
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Senior Full Stack Engineer (React, Node.js)"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Location
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Bengaluru, India or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Professional Bio
          </label>
          <textarea
            rows={4}
            disabled={!isEditing}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your engineering background, key milestones, favorite tech stacks..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Period
            </label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Immediate / 15 Days / 30 Days"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Portfolio Website URL
            </label>
            <input
              type="url"
              disabled={!isEditing}
              placeholder="https://yourportfolio.dev"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              GitHub Profile URL
            </label>
            <input
              type="url"
              disabled={!isEditing}
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              disabled={!isEditing}
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-600 dark:disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Technical Skills (Automated Recruiter Discovery)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800"
              >
                {skill}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing ? (
            <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="e.g. React, TypeScript, Docker"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </form>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              (Skills add ya remove karne ke liye upar &quot;Edit Profile&quot; par click karein)
            </p>
          )}
        </div>

        {/* Save Profile Changes Button (Visible only when editing) */}
        {isEditing && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All details above will be saved to your candidate account.
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
