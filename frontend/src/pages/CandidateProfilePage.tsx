import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  FileText,
  Upload,
  Trash2,
  Plus,
  X,
  CheckCircle2,
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
  Phone,
  Pencil,
  Shield,
  Eye,
  Sliders,
  Flame,
  Camera,
  Loader2,
  AlertCircle,
  FileCheck,
  Bookmark,
  Layers,
  Send,
  Bot,
  Copy,
  Download,
  Square,
  Lock,
  MapPin,
} from 'lucide-react';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  HIGHEST_QUALIFICATIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_TYPES,
} from '@jobconnect/shared';

// Standard notice periods
const NOTICE_PERIOD_OPTIONS = [
  'Immediate Joiner (0 days)',
  '15 Days',
  '30 Days (1 Month)',
  '60 Days (2 Months)',
  '90 Days (3 Months)',
];

// Popular technical skill suggestions
const POPULAR_SKILLS = [
  'react.js',
  'typescript',
  'node.js',
  'next.js',
  'python',
  'express.js',
  'mongodb',
  'postgresql',
  'docker',
  'aws',
  'graphql',
  'tailwind css',
  'git',
];

// Popular candidate career locations
const PREFERRED_LOCATIONS_LIST = [
  'Bengaluru, India',
  'Remote (Worldwide)',
  'Remote (India)',
  'Hyderabad, India',
  'Pune, India',
  'Mumbai, India',
  'Delhi NCR, India',
  'Chennai, India',
];

interface EducationItem {
  _id?: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
  grade?: string;
}

interface ExperienceItem {
  _id?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  isCurrent: boolean;
  description?: string;
}

export const CandidateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser, refreshUser } = useAuth();

  // Mode toggles
  const [isEditing, setIsEditing] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Modals for adding/editing Education & Experience
  const [editingEducation, setEditingEducation] = useState<{ index: number | null; data: EducationItem } | null>(null);
  const [editingExperience, setEditingExperience] = useState<{ index: number | null; data: ExperienceItem } | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
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

  // Experience & Education structured states
  const [educationList, setEducationList] = useState<EducationItem[]>([]);
  const [experienceList, setExperienceList] = useState<ExperienceItem[]>([]);
  const [totalExperienceYears, setTotalExperienceYears] = useState<number>(0);
  const [totalExperienceMonths, setTotalExperienceMonths] = useState<number>(0);

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Preferences
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>(['full-time']);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(['Bengaluru, India', 'Remote (India)']);
  const [expectedSalaryMin, setExpectedSalaryMin] = useState<number | ''>('');
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<number | ''>('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');

  // Profile Visibility
  const [isProfileVisible, setIsProfileVisible] = useState(true);

  // AI Copilot state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [firstNameWarning, setFirstNameWarning] = useState<string | null>(null);

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

  // Fetch candidate profile & user data
  const { data, isLoading } = useQuery({
    queryKey: ['candidateProfile'],
    queryFn: async () => {
      const res = await api.get('/candidate/profile');
      return res.data?.data;
    },
  });

  // Synchronize form state from backend
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
        setAvatarSrc(u.avatar);
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
        setTotalExperienceYears(p.totalExperienceYears ?? 0);
        setTotalExperienceMonths(p.totalExperienceMonths ?? 0);

        // Synchronize education
        if (Array.isArray(p.education) && p.education.length > 0) {
          setEducationList(p.education);
        } else if (p.educationDegree || p.educationInstitution) {
          setEducationList([
            {
              degree: p.educationDegree || 'Bachelor of Technology',
              institution: p.educationInstitution || 'University',
              fieldOfStudy: p.educationDegree || 'Computer Science',
              startYear: p.educationStartYear || 2018,
              endYear: p.educationEndYear || 2022,
            },
          ]);
        }

        // Synchronize experience
        if (Array.isArray(p.experience) && p.experience.length > 0) {
          setExperienceList(p.experience);
        }

        if (Array.isArray(p.preferredJobTypes) && p.preferredJobTypes.length > 0) {
          setPreferredJobTypes(p.preferredJobTypes);
        }
        if (Array.isArray(p.preferredLocations) && p.preferredLocations.length > 0) {
          setPreferredLocations(p.preferredLocations);
        }
        if (p.expectedSalary) {
          setExpectedSalaryMin(p.expectedSalary.min ?? '');
          setExpectedSalaryMax(p.expectedSalary.max ?? '');
          setSalaryCurrency(p.expectedSalary.currency || 'INR');
        }
      }
    }
  }, [data, authUser]);

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
      setTotalExperienceYears(p.totalExperienceYears ?? 0);
      setTotalExperienceMonths(p.totalExperienceMonths ?? 0);
      setEducationList(p.education || []);
      setExperienceList(p.experience || []);
      setPreferredJobTypes(p.preferredJobTypes || ['full-time']);
      setPreferredLocations(p.preferredLocations || ['Bengaluru, India']);
    }
    showToast('Changes discarded.', 'error');
  };

  // Check if form is dirty
  const isDirty = useMemo(() => {
    if (!isEditing) return false;
    const u = data?.user || authUser;
    const p = data?.profile;
    if (!u) return false;

    return (
      firstName !== (u.firstName || '') ||
      lastName !== (u.lastName || '') ||
      phone !== (u.nationalNumber || '') ||
      countryCode !== (u.countryCode || DEFAULT_COUNTRY.dialCode) ||
      dateOfBirth !== (u.dateOfBirth || '') ||
      gender !== ((u.gender as any) || '') ||
      highestQualification !== (u.highestQualification || '') ||
      headline !== (p?.headline || '') ||
      bio !== (p?.bio || '') ||
      location !== (p?.location || '') ||
      noticePeriod !== (p?.noticePeriod || '') ||
      portfolioUrl !== (p?.portfolioUrl || '') ||
      githubUrl !== (p?.githubUrl || '') ||
      linkedinUrl !== (p?.linkedinUrl || '') ||
      JSON.stringify(skills) !== JSON.stringify(p?.skills || []) ||
      JSON.stringify(educationList) !== JSON.stringify(p?.education || []) ||
      JSON.stringify(experienceList) !== JSON.stringify(p?.experience || [])
    );
  }, [
    isEditing,
    firstName,
    lastName,
    phone,
    countryCode,
    dateOfBirth,
    gender,
    highestQualification,
    headline,
    bio,
    location,
    noticePeriod,
    portfolioUrl,
    githubUrl,
    linkedinUrl,
    skills,
    educationList,
    experienceList,
    data,
    authUser,
  ]);

  // Profile Readiness / Completion calculation
  const profileCompletion = useMemo(() => {
    const fields = [
      { key: 'avatar', label: 'Candidate Profile Photo', done: Boolean(avatarSrc || data?.user?.avatar || authUser?.avatar) },
      { key: 'name', label: 'Full Legal Name', done: Boolean(firstName?.trim() && lastName?.trim()) },
      { key: 'email', label: 'Verified Email Address', done: Boolean(email?.trim()) },
      { key: 'phone', label: 'Verified Contact Phone', done: Boolean(phone?.trim()) },
      { key: 'headline', label: 'Professional Headline', done: Boolean(headline?.trim()) },
      { key: 'location', label: 'Current Location', done: Boolean(location?.trim()) },
      { key: 'bio', label: 'Career Summary & Bio', done: Boolean(bio?.trim() && bio.trim().length >= 30) },
      { key: 'resume', label: 'Resume / CV Document', done: Boolean(data?.profile?.resumeUrl) },
      { key: 'skills', label: 'Key Technical Skills (3+)', done: Boolean(skills && skills.length >= 3) },
      { key: 'education', label: 'Education & Degree', done: Boolean(educationList && educationList.length > 0) },
      { key: 'experience', label: 'Professional Experience', done: Boolean(experienceList && experienceList.length > 0) },
      { key: 'preferences', label: 'Career Preferences', done: Boolean(preferredJobTypes.length > 0 && preferredLocations.length > 0) },
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
    headline,
    location,
    bio,
    skills,
    educationList,
    experienceList,
    preferredJobTypes,
    preferredLocations,
  ]);

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      // Validate URLs
      const validateUrl = (url: string, field: string) => {
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error(`${field} must start with https:// or http://`);
        }
      };
      if (portfolioUrl.trim()) validateUrl(portfolioUrl.trim(), 'Portfolio URL');
      if (githubUrl.trim()) validateUrl(githubUrl.trim(), 'GitHub URL');
      if (linkedinUrl.trim()) validateUrl(linkedinUrl.trim(), 'LinkedIn URL');

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
        education: educationList,
        experience: experienceList,
        preferredJobTypes,
        preferredLocations,
        expectedSalary: expectedSalaryMin || expectedSalaryMax ? {
          min: expectedSalaryMin ? Number(expectedSalaryMin) : undefined,
          max: expectedSalaryMax ? Number(expectedSalaryMax) : undefined,
          currency: salaryCurrency,
        } : undefined,
        totalExperienceYears: Number(totalExperienceYears) || 0,
        totalExperienceMonths: Number(totalExperienceMonths) || 0,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsEditing(false);
      showToast('Career profile and credentials saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      refreshUser();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update candidate profile.';
      showToast(msg, 'error');
    },
  });

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      showToast('Invalid format. Use PNG, JPG, or WEBP.', 'error');
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
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      showToast('Profile photo updated successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to upload photo.', 'error');
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
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      showToast('Profile photo removed.');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to remove photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Resume Upload Mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/candidate/resume', formData);
      return res.data;
    },
    onSuccess: () => {
      showToast('Resume document uploaded and linked successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      refreshUser();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || 'Failed to upload resume document.', 'error');
    },
  });

  // Resume Delete Mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/candidate/resume');
    },
    onSuccess: () => {
      showToast('Resume deleted from profile.');
      queryClient.invalidateQueries({ queryKey: ['candidateProfile'] });
      refreshUser();
    },
    onError: () => {
      showToast('Failed to delete resume.', 'error');
    },
  });

  // Skills helpers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkill.trim().toLowerCase();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // AI Assistant Query Handler
  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post('/ai/chat', { query: aiPrompt });
      setAiResponse(res.data?.data?.response || res.data?.data?.message || 'Analysis complete.');
    } catch (err: any) {
      setAiResponse('AI Career Assistant is temporarily busy. Please retry shortly.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading candidate career workspace..." />;
  }

  const user = data?.user || authUser;
  const profile = data?.profile;
  const metrics = data?.metrics || { totalApplications: 0, savedJobsCount: 0 };
  const displayAvatar = avatarSrc || user?.avatar;
  const initials = user?.name?.trim() ? user.name.trim()[0].toUpperCase() : 'C';

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

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleAvatarFileChange}
        className="hidden"
      />
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            uploadResumeMutation.mutate(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <BackButton label="Back to Dashboard" fallbackUrl="/candidate/dashboard" />
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Career Portal:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'Candidate Workspace'}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: PAGE HEADER & READINESS BAR */}
        {/* ========================================================================= */}
        <div className="bg-white/80 dark:bg-[#0D1220]/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                  <User className="w-3.5 h-3.5" /> Candidate Career Workspace
                </span>

                {user?.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified Email
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowChecklistModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  {profileCompletion.percentage}% Profile Strength ▾
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Candidate Profile & Career Workspace
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Manage your professional identity, resume document, academic qualifications, experience, and hiring preferences.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs font-semibold bg-white dark:bg-[#0C1322] border-slate-200 dark:border-slate-700"
              >
                <Eye className="w-4 h-4 mr-1.5 text-blue-600" /> Preview Recruiter View
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
                <span>Application Readiness:</span>
                <span className={profileCompletion.percentage >= 80 ? 'text-emerald-600' : 'text-blue-600'}>
                  {profileCompletion.percentage}%
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({profileCompletion.completed} of {profileCompletion.total} milestones achieved)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChecklistModal(true)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Improvement Checklist
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
                  profileCompletion.percentage >= 80
                    ? 'bg-emerald-500'
                    : profileCompletion.percentage > 50
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: CANDIDATE IDENTITY HERO CARD */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/70 to-blue-50/30 dark:from-[#0D1220] dark:via-[#090D18] dark:to-[#111827] border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            
            {/* Avatar Section: Camera & Trash buttons ONLY active/visible when isEditing is true */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-4xl shadow-md border-3 border-white dark:border-slate-800">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={user?.name || 'Candidate'}
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

            {/* Candidate Identity Meta */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {user?.name || `${firstName} ${lastName}` || 'Candidate Name'}
                </h2>
                {user?.isEmailVerified && (
                  <span className="inline-flex items-center text-blue-600 dark:text-blue-400" title="Verified Candidate">
                    <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white dark:text-slate-900 inline" />
                  </span>
                )}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 w-fit mx-auto sm:mx-0">
                  {noticePeriod || 'Actively Looking'}
                </span>
              </div>

              {/* Headline */}
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {headline || 'Professional Headline not set. Add your current specialty.'}
              </p>

              {/* Details row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {location || 'Location Not Specified'}
                </span>

                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email || user?.email}
                </span>

                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {countryCode} {phone}
                  </span>
                )}

                {portfolioUrl && (
                  <a
                    href={portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {githubUrl && (
                  <a
                    href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:underline"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick action button */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs font-semibold bg-white dark:bg-[#0D1220] border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Recruiter View
              </Button>
              <span className="text-[10px] text-slate-400">Public visibility active</span>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: KEY PROFILE METRICS (ACTIONABLE) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Profile Strength */}
          <button
            onClick={() => setShowChecklistModal(true)}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Profile Strength
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {profileCompletion.percentage}%
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>{profileCompletion.completed} of {profileCompletion.total} milestones</span>
              <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">Review →</span>
            </div>
          </button>

          {/* Card 2: Resume Status */}
          <button
            onClick={() => {
              if (profile?.resumeUrl) {
                setShowResumeModal(true);
              } else {
                resumeInputRef.current?.click();
              }
            }}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Resume / CV
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {profile?.resumeUrl ? 'Uploaded' : 'Missing'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>{profile?.resumeOriginalName ? 'Document ready' : 'Upload to apply'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">Manage →</span>
            </div>
          </button>

          {/* Card 3: Total Applications */}
          <button
            onClick={() => navigate('/candidate/applications')}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Applications
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {metrics.totalApplications}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Active submissions</span>
              <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">Track →</span>
            </div>
          </button>

          {/* Card 4: Saved Jobs */}
          <button
            onClick={() => navigate('/candidate/saved-jobs')}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-600/80 transition-all text-left shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Saved Jobs
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bookmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics.savedJobsCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Bookmarked roles</span>
              <span className="text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">View →</span>
            </div>
          </button>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: MAIN WORKSPACE (2-COLUMN GRID) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN (~68% / 8 Cols) ================= */}
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
                      Your identity, verified email, and contact information.
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
                    placeholder="e.g. Aditya"
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
                    placeholder="e.g. Sharma"
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
                    Phone Number
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                {/* Highest Qualification */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Highest Qualification
                  </label>
                  <select
                    disabled={!isEditing}
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                  >
                    <option value="">Select Qualification</option>
                    {HIGHEST_QUALIFICATIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 2: RESUME / CV CENTER */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Resume / CV Document</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Your master curriculum vitae used for 1-click Quick Apply.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadResumeMutation.isPending}
                  className="text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {profile?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}
                </Button>
              </div>

              {profile?.resumeUrl ? (
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#101827] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {profile.resumeOriginalName || 'Candidate_Resume.pdf'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-emerald-600 font-bold">✓ Active on file</span>
                        <span>•</span>
                        <span>Verified format</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <a
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1220] hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </a>

                    <a
                      href={profile.resumeUrl}
                      download
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1220] hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete your current resume?')) {
                            deleteResumeMutation.mutate();
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => resumeInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center hover:border-blue-400 cursor-pointer transition-all space-y-2"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No resume document uploaded yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Upload your PDF, DOCX or image resume (up to 5MB) for 1-click applications.
                  </p>
                </div>
              )}
            </div>

            {/* CARD 3: EDUCATION (STRUCTURED TIMELINE) */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Education & Academics</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Degrees, institutions, field of study, and graduating years.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(true);
                    setEditingEducation({
                      index: null,
                      data: {
                        degree: 'Bachelor of Technology (B.Tech)',
                        institution: '',
                        fieldOfStudy: 'Computer Science & Engineering',
                        startYear: 2019,
                        endYear: 2023,
                        grade: '',
                      },
                    });
                  }}
                  className="text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Education
                </Button>
              </div>

              {educationList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No academic degrees recorded. Click "+ Add Education" to showcase your qualifications.
                </div>
              ) : (
                <div className="space-y-4">
                  {educationList.map((edu, idx) => (
                    <div
                      key={edu._id || idx}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#101827]/40 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {edu.degree}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                            {edu.startYear} – {edu.endYear || 'Present'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {edu.institution} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                        </p>
                        {edu.grade && (
                          <p className="text-[11px] text-slate-500">Grade / CGPA: {edu.grade}</p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingEducation({ index: idx, data: { ...edu } })}
                            className="p-1 rounded text-slate-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Remove this education entry?')) {
                                setEducationList(educationList.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 4: PROFESSIONAL EXPERIENCE (STRUCTURED TIMELINE) */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Professional Experience</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Work history, companies, tenure, and engineering impact.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(true);
                    setEditingExperience({
                      index: null,
                      data: {
                        title: 'Software Engineer',
                        company: '',
                        location: 'Bengaluru, India',
                        startDate: '2023-01',
                        isCurrent: true,
                        description: 'Built scalable backend microservices, optimized REST/GraphQL APIs, and contributed to CI/CD pipelines.',
                      },
                    });
                  }}
                  className="text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Experience
                </Button>
              </div>

              {experienceList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No professional experience entries listed yet. Click "+ Add Experience" to record your history.
                </div>
              ) : (
                <div className="space-y-4">
                  {experienceList.map((exp, idx) => (
                    <div
                      key={exp._id || idx}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-[#101827]/40 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {exp.title}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            at {exp.company}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40">
                            {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                          </span>
                        </div>
                        {exp.location && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {exp.location}
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                            {exp.description}
                          </p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingExperience({ index: idx, data: { ...exp } })}
                            className="p-1 rounded text-slate-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Remove this experience entry?')) {
                                setExperienceList(experienceList.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 5: CAREER SUMMARY & PROFESSIONAL BIO */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Career Summary & Bio</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Your professional positioning statement and detailed overview.
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

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Headline (Max 120 chars)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  disabled={!isEditing}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer | React, TypeScript & Node.js Specialist"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Professional Summary & Bio
                  </label>
                  <span className="text-[11px] text-slate-400">{bio.length} / 3000 chars</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={3000}
                  disabled={!isEditing}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your engineering journey, key system architectures delivered, and what technologies you specialize in..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Base Location
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* CARD 6: TECHNICAL SKILLS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Technical Skills & Competencies</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Technologies used for automated candidate matching against recruiter jobs.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {skills.length} Skills Added
                </span>
              </div>

              {/* Add Skill Input */}
              {isEditing && (
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Type skill name and press Enter (e.g. React, Docker, Python)..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" size="sm" className="text-xs font-bold bg-blue-600">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </form>
              )}

              {/* Skills Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-bold"
                  >
                    <span>{skill}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-400 hover:text-rose-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Quick Suggestions */}
              {isEditing && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSkills([...skills, s])}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CARD 7: SOCIAL & PORTFOLIO LINKS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Social & Portfolio Links</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Showcase your live engineering work, open source code, and professional network.
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    disabled={!isEditing}
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    disabled={!isEditing}
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    disabled={!isEditing}
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (~32% / 4 Cols - Sticky) ================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* WIDGET 1: AI CAREER ASSISTANT (POWERED BY /ai/chat) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-blue-950 border border-indigo-700/40 text-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Career Copilot</h3>
                    <span className="text-[10px] text-amber-300">Profile & Resume Intelligence</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Live
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Ask our AI assistant to optimize your headline, review your career bio, or suggest missing keywords for ATS screening.
              </p>

              {/* Quick AI Prompt Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Improve my headline',
                  'Suggest missing skills',
                  'Review career summary',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      setAiPrompt(promptText);
                    }}
                    className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  >
                    ✦ {promptText}
                  </button>
                ))}
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask AI Career Copilot..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleAskAi}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* AI Response Output */}
                {aiResponse && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs text-slate-200 space-y-2 max-h-48 overflow-y-auto">
                    <p className="leading-relaxed">{aiResponse}</p>
                    <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiResponse);
                          showToast('Copied to clipboard!');
                        }}
                        className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* WIDGET 2: CAREER & JOB SEARCH PREFERENCES */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600" /> Career Preferences
                </h3>
                <span className="text-[10px] text-slate-400">Influences Job Feed</span>
              </div>

              {/* Preferred Job Types */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Desired Job Types
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['full-time', 'part-time', 'contract', 'internship'].map((type) => {
                    const isSelected = preferredJobTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setPreferredJobTypes((prev) =>
                            isSelected ? prev.filter((t) => t !== type) : [...prev, type]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold'
                            : 'bg-slate-50 dark:bg-[#0C1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {type.replace('-', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Locations */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Preferred Work Locations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PREFERRED_LOCATIONS_LIST.map((loc) => {
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
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold'
                            : 'bg-slate-50 dark:bg-[#0C1322] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notice Period Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notice Period / Availability
                </label>
                <select
                  disabled={!isEditing}
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                >
                  <option value="">Select Notice Period</option>
                  {NOTICE_PERIOD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* WIDGET 3: PROFILE VISIBILITY & PRIVACY */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> Profile Visibility
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isProfileVisible ? 'Recruiter Visible' : 'Private'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Recruiter Search Visibility
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verified recruiters can discover your profile for matching jobs.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isProfileVisible}
                  onChange={(e) => {
                    setIsProfileVisible(e.target.checked);
                    showToast(`Profile visibility set to ${e.target.checked ? 'Visible' : 'Private'}.`);
                  }}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer ml-3"
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Name, Headline & Skills</span>
                  <span className="text-emerald-600 font-bold">✓ Visible</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Experience & Education</span>
                  <span className="text-emerald-600 font-bold">✓ Visible</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Phone Number & Security</span>
                  <span className="text-slate-400 font-medium">○ Protected</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="w-full text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Recruiter Card
              </Button>
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
              <span>You have unsaved changes in your candidate career profile.</span>
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
                  Application Readiness ({profileCompletion.percentage}%)
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
                    {field.done ? 'Ready' : 'Pending'}
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
      {/* MODAL 2: RECRUITER-FACING PUBLIC PROFILE PREVIEW */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recruiter Candidate Card Preview
                </h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Public Card */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#101827] border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {user?.name || `${firstName} ${lastName}`}
                    <CheckCircle2 className="w-4 h-4 text-blue-500 inline" />
                  </h4>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {headline || 'Full Stack Engineer'}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {location || 'India'} • {noticePeriod || 'Actively Looking'}
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">About Candidate</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                  {bio || 'Experienced engineering candidate focused on delivering modern web architectures and reliable software solutions.'}
                </p>
              </div>

              {/* Top Skills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.slice(0, 6).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200/60 dark:border-blue-900/60">
                    {s}
                  </span>
                ))}
              </div>
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
      {/* MODAL 3: ADD/EDIT EDUCATION */}
      {/* ========================================================================= */}
      {editingEducation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingEducation.index !== null ? 'Edit Education' : 'Add Education'}
              </h3>
              <button onClick={() => setEditingEducation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Degree / Certificate <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingEducation.data.degree}
                  onChange={(e) => setEditingEducation({
                    ...editingEducation,
                    data: { ...editingEducation.data, degree: e.target.value }
                  })}
                  placeholder="e.g. Bachelor of Technology"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  University / College <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingEducation.data.institution}
                  onChange={(e) => setEditingEducation({
                    ...editingEducation,
                    data: { ...editingEducation.data, institution: e.target.value }
                  })}
                  placeholder="e.g. Delhi Technological University"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Field of Study <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingEducation.data.fieldOfStudy}
                  onChange={(e) => setEditingEducation({
                    ...editingEducation,
                    data: { ...editingEducation.data, fieldOfStudy: e.target.value }
                  })}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1970}
                    max={2030}
                    value={editingEducation.data.startYear}
                    onChange={(e) => setEditingEducation({
                      ...editingEducation,
                      data: { ...editingEducation.data, startYear: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Year (or Expected)
                  </label>
                  <input
                    type="number"
                    min={1970}
                    max={2035}
                    value={editingEducation.data.endYear || ''}
                    onChange={(e) => setEditingEducation({
                      ...editingEducation,
                      data: { ...editingEducation.data, endYear: e.target.value ? Number(e.target.value) : undefined }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingEducation(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!editingEducation.data.degree.trim() || !editingEducation.data.institution.trim()) {
                    showToast('Please specify degree and institution.', 'error');
                    return;
                  }
                  if (editingEducation.index !== null) {
                    const copy = [...educationList];
                    copy[editingEducation.index] = editingEducation.data;
                    setEducationList(copy);
                  } else {
                    setEducationList([...educationList, editingEducation.data]);
                  }
                  setEditingEducation(null);
                  showToast('Education updated! Click "Save Changes" to persist.');
                }}
                className="text-xs font-bold bg-blue-600 text-white"
              >
                Apply Education
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD/EDIT PROFESSIONAL EXPERIENCE */}
      {/* ========================================================================= */}
      {editingExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingExperience.index !== null ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button onClick={() => setEditingExperience(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingExperience.data.title}
                  onChange={(e) => setEditingExperience({
                    ...editingExperience,
                    data: { ...editingExperience.data, title: e.target.value }
                  })}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingExperience.data.company}
                  onChange={(e) => setEditingExperience({
                    ...editingExperience,
                    data: { ...editingExperience.data, company: e.target.value }
                  })}
                  placeholder="e.g. Microsoft, Google, Razorpay"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date (YYYY-MM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={editingExperience.data.startDate}
                    onChange={(e) => setEditingExperience({
                      ...editingExperience,
                      data: { ...editingExperience.data, startDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date (or Present)
                  </label>
                  <input
                    type="month"
                    disabled={editingExperience.data.isCurrent}
                    value={editingExperience.data.endDate || ''}
                    onChange={(e) => setEditingExperience({
                      ...editingExperience,
                      data: { ...editingExperience.data, endDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currentJobCheckbox"
                  checked={editingExperience.data.isCurrent}
                  onChange={(e) => setEditingExperience({
                    ...editingExperience,
                    data: { ...editingExperience.data, isCurrent: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="currentJobCheckbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  I currently work in this role
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Key Achievements & Responsibilities
                </label>
                <textarea
                  rows={3}
                  value={editingExperience.data.description || ''}
                  onChange={(e) => setEditingExperience({
                    ...editingExperience,
                    data: { ...editingExperience.data, description: e.target.value }
                  })}
                  placeholder="Outline key systems, tech stack, scale, and performance impact..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0C1322] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingExperience(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!editingExperience.data.title.trim() || !editingExperience.data.company.trim()) {
                    showToast('Please specify job title and company.', 'error');
                    return;
                  }
                  if (editingExperience.index !== null) {
                    const copy = [...experienceList];
                    copy[editingExperience.index] = editingExperience.data;
                    setExperienceList(copy);
                  } else {
                    setExperienceList([...experienceList, editingExperience.data]);
                  }
                  setEditingExperience(null);
                  showToast('Experience updated! Click "Save Changes" to persist.');
                }}
                className="text-xs font-bold bg-blue-600 text-white"
              >
                Apply Experience
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RESUME PREVIEW */}
      {/* ========================================================================= */}
      {showResumeModal && profile?.resumeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D1220] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {profile.resumeOriginalName || 'Resume Document'}
                </h3>
              </div>
              <button onClick={() => setShowResumeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 h-96 flex items-center justify-center">
              <iframe
                src={profile.resumeUrl}
                title="Resume Preview"
                className="w-full h-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <a
                href={profile.resumeUrl}
                download
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download Document
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResumeModal(false)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
