import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Briefcase,
  Sparkles,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Building,
  DollarSign,
  FileText,
  Layers,
  Bot,
  Eye,
  CheckCircle2,
  Calendar,
  Zap,
  HelpCircle,
  Plus,
  Send,
  ArrowRight,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { REMOTE_TYPES, EMPLOYMENT_TYPES, JOB_STATUS } from '@jobconnect/shared';

// Common suggested skills for quick one-click adding
const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Go',
  'MongoDB',
  'PostgreSQL',
  'Docker',
  'AWS',
  'Tailwind CSS',
  'Next.js',
  'GraphQL',
];

export const RecruiterJobCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  // AI Modal & Draft states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [aiSkills, setAiSkills] = useState('');
  const [aiExperience, setAiExperience] = useState<number | ''>('');
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [aiConflictModal, setAiConflictModal] = useState(false);

  // Skill tags state
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Unsaved changes & submit states
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewTabMobile, setPreviewTabMobile] = useState<'form' | 'preview'>('form');

  // Today's date string for min deadline
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      remoteType: '',
      employmentType: '',
      experienceMin: '',
      experienceMax: '',
      salaryMin: '',
      salaryMax: '',
      currency: '',
      applicationDeadline: '',
    },
  });

  // Watch form fields for real-time preview
  const watchedTitle = watch('title');
  const watchedLocation = watch('location');
  const watchedRemoteType = watch('remoteType');
  const watchedEmploymentType = watch('employmentType');
  const watchedExpMin = watch('experienceMin');
  const watchedExpMax = watch('experienceMax');
  const watchedSalaryMin = watch('salaryMin');
  const watchedSalaryMax = watch('salaryMax');
  const watchedCurrency = watch('currency');
  const watchedDeadline = watch('applicationDeadline');
  const watchedDescription = watch('description');

  // Prevent accidental navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || skillsList.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, skillsList]);

  // AI JD Generator Mutation calling real backend /ai/generate-jd
  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const skillsArray = aiSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/ai/generate-jd', {
        title: aiTitle.trim(),
        notes: aiNotes.trim() || 'Focus on scalable architecture, clean code, and team collaboration.',
        skills: skillsArray.length > 0 ? skillsArray : ['React', 'TypeScript', 'Node.js'],
        experienceYears: aiExperience !== '' ? Number(aiExperience) : 0,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data) {
        setAiGeneratedData(data);
        // If description is already written, ask before overwriting
        if (watchedDescription && watchedDescription.trim().length > 20) {
          setAiConflictModal(true);
        } else {
          applyAiContent(data, 'replace');
        }
      }
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.error?.message || 'AI Generation failed. Please try again.');
    },
  });

  // Apply AI content to form
  const applyAiContent = (data: any, mode: 'replace' | 'append') => {
    if (data.title && !watchedTitle) {
      setValue('title', data.title, { shouldDirty: true });
    }

    if (data.overview && data.responsibilities && data.requirements) {
      const formatted = `${data.overview}\n\nKey Responsibilities:\n${data.responsibilities
        .map((r: string) => `• ${r}`)
        .join('\n')}\n\nRequirements & Qualifications:\n${data.requirements
        .map((req: string) => `• ${req}`)
        .join('\n')}`;

      if (mode === 'append' && watchedDescription) {
        setValue('description', `${watchedDescription}\n\n${formatted}`, { shouldDirty: true });
      } else {
        setValue('description', formatted, { shouldDirty: true });
      }
    }

    if (data.preferredSkills && Array.isArray(data.preferredSkills)) {
      const merged = Array.from(
        new Set([...skillsList, ...data.preferredSkills.map((s: string) => s.toLowerCase().trim())])
      );
      setSkillsList(merged);
    }

    setAiConflictModal(false);
    setAiModalOpen(false);
    setAiGeneratedData(null);
  };

  // Open AI modal with pre-fills from form
  const handleOpenAiModal = () => {
    setAiTitle(watchedTitle || '');
    setAiSkills(skillsList.join(', ') || '');
    setAiExperience(watchedExpMax ? Number(watchedExpMax) : (watchedExpMin ? Number(watchedExpMin) : ''));
    setAiNotes('');
    setAiModalOpen(true);
  };

  // Skill management
  const handleAddSkill = (skillToAdd?: string) => {
    const raw = skillToAdd !== undefined ? skillToAdd : newSkill;
    const clean = raw.trim().toLowerCase();
    if (clean && !skillsList.includes(clean)) {
      setSkillsList([...skillsList, clean]);
      if (skillToAdd === undefined) setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  // Insert description snippet templates
  const handleInsertTemplate = (type: 'responsibilities' | 'qualifications' | 'benefits') => {
    let snippet = '';
    if (type === 'responsibilities') {
      snippet = `\n\nKey Responsibilities:\n• Architect, develop and maintain robust, high-availability web applications.\n• Collaborate with product managers and designers to iterate on technical requirements.\n• Write comprehensive automated unit and integration tests.\n• Participate in code reviews and mentor junior engineering peers.`;
    } else if (type === 'qualifications') {
      snippet = `\n\nRequirements & Qualifications:\n• ${watchedExpMin || 2}+ years of hands-on production experience in modern software development.\n• Strong proficiency in TypeScript, React, Node.js and distributed systems.\n• Experience with relational and NoSQL databases (e.g. PostgreSQL, MongoDB, Redis).\n• Solid understanding of CI/CD pipelines, Docker containerization, and RESTful APIs.`;
    } else if (type === 'benefits') {
      snippet = `\n\nBenefits & Perks:\n• Competitive compensation and equity options.\n• Comprehensive health, dental, and wellness insurance coverage.\n• Flexible remote work policy and ergonomic home office allowance.\n• Annual learning and conference sponsorship stipend.`;
    }
    setValue('description', (watchedDescription || '').trim() + snippet, { shouldDirty: true });
  };

  // Submit job (Publish or Save as Draft)
  const handleJobSubmit = async (formData: any, statusToSet: 'published' | 'draft') => {
    setServerError(null);

    if (!profile?._id) {
      setServerError('Company profile is not initialized for this recruiter account. Please update profile.');
      return;
    }

    if (skillsList.length === 0 && statusToSet === 'published') {
      setServerError('Please specify at least 1 required technical skill before publishing.');
      return;
    }

    const minExp = Number(formData.experienceMin);
    const maxExp = Number(formData.experienceMax);
    if (minExp > maxExp) {
      setServerError('Minimum experience cannot be greater than maximum experience.');
      return;
    }

    const minSal = formData.salaryMin ? Number(formData.salaryMin) : undefined;
    const maxSal = formData.salaryMax ? Number(formData.salaryMax) : undefined;
    if (minSal !== undefined && maxSal !== undefined && minSal > maxSal) {
      setServerError('Minimum salary cannot be greater than maximum salary.');
      return;
    }

    if (statusToSet === 'published') {
      setIsPublishing(true);
    } else {
      setIsDraftSaving(true);
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        remoteType: formData.remoteType,
        employmentType: formData.employmentType,
        companyId: profile._id,
        skills: skillsList.length > 0 ? skillsList : ['general'],
        experienceMin: minExp,
        experienceMax: maxExp,
        salaryMin: minSal,
        salaryMax: maxSal,
        currency: formData.currency || 'INR',
        applicationDeadline: formData.applicationDeadline,
        status: statusToSet,
      };

      const res = await api.post('/jobs', payload);

      if (res.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
        queryClient.invalidateQueries({ queryKey: ['recruiterJobsOverview'] });
        queryClient.invalidateQueries({ queryKey: ['recruiterDashboard'] });

        if (statusToSet === 'published') {
          navigate(`/jobs/${res.data.data._id}`);
        } else {
          navigate('/recruiter/jobs');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create job posting.';
      setServerError(msg);
    } finally {
      setIsPublishing(false);
      setIsDraftSaving(false);
    }
  };

  // Salary formatted preview string
  const formatSalaryPreview = () => {
    if (!watchedSalaryMin && !watchedSalaryMax) return 'Competitive / Disclosed on request';
    const sym = watchedCurrency === 'USD' ? '$' : watchedCurrency === 'EUR' ? '€' : watchedCurrency === 'GBP' ? '£' : '₹';
    const formatNum = (numStr: string) => {
      const n = Number(numStr);
      if (!n) return '';
      if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
      return n.toLocaleString();
    };
    if (watchedSalaryMin && watchedSalaryMax) {
      return `${sym}${formatNum(watchedSalaryMin)} – ${sym}${formatNum(watchedSalaryMax)} / yr`;
    }
    if (watchedSalaryMin) return `From ${sym}${formatNum(watchedSalaryMin)} / yr`;
    return `Up to ${sym}${formatNum(watchedSalaryMax)} / yr`;
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        
        {/* Navigation & AI Quick Launch */}
        <div className="flex items-center justify-between gap-4">
          <BackButton
            label="Back to Dashboard"
            fallbackUrl="/recruiter/dashboard"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAiModal}
            className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-bold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
            ✦ Draft JD with AI
          </Button>
        </div>

        {/* Page Header */}
        <div className="bg-white/80 dark:bg-[#0D1220]/90 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60">
                  <Briefcase className="w-3 h-3" /> Recruiter Workspace
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Hiring Mode
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create Job Posting
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Publish an engineering role with detailed compensation, requirements and responsibilities.
              </p>
            </div>

            {/* Company Posting Context */}
            {profile?.name && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-200/70 dark:border-slate-800 shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm overflow-hidden">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile.name[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Posting for</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    {profile.name}
                    {profile.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View Switcher (Form vs Preview) */}
        <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setPreviewTabMobile('form')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              previewTabMobile === 'form'
                ? 'bg-white dark:bg-[#101827] text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Job Creation Form
          </button>
          <button
            onClick={() => setPreviewTabMobile('preview')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              previewTabMobile === 'preview'
                ? 'bg-white dark:bg-[#101827] text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Candidate Preview
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{serverError}</span>
            </div>
            <button onClick={() => setServerError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: FORM (LEFT) + SIDEBAR (RIGHT) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT / FORM (68% / 8 Cols) ================= */}
          <div className={`lg:col-span-8 space-y-6 ${previewTabMobile === 'preview' ? 'hidden lg:block' : 'block'}`}>
            <form onSubmit={handleSubmit((d) => handleJobSubmit(d, 'published'))} className="space-y-6">
              
              {/* SECTION 1: ROLE DETAILS */}
              <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Role & Basic Information</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Position title, location, work model and deadline.</p>
                    </div>
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Job Title <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {(watchedTitle || '').length} / 100
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Senior Full-Stack Engineer (React & Node.js)"
                    className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#0C1322] border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 ${
                      errors.title ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                    }`}
                    {...register('title', {
                      required: 'Job title is required',
                      minLength: { value: 3, message: 'Minimum 3 characters required' },
                    })}
                  />
                  {errors.title && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{String(errors.title.message)}</p>
                  )}
                </div>

                {/* Location, Work Mode, Employment Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Location <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru, India or Remote"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                        {...register('location', { required: 'Location is required' })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Work Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium ${
                        errors.remoteType ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                      }`}
                      {...register('remoteType', { required: 'Work mode is required' })}
                    >
                      <option value="">Select Work Mode</option>
                      <option value={REMOTE_TYPES.ONSITE}>On-site (Office)</option>
                      <option value={REMOTE_TYPES.REMOTE}>Remote</option>
                      <option value={REMOTE_TYPES.HYBRID}>Hybrid</option>
                    </select>
                    {errors.remoteType && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{String(errors.remoteType.message)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Employment Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium ${
                        errors.employmentType ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                      }`}
                      {...register('employmentType', { required: 'Employment type is required' })}
                    >
                      <option value="">Select Employment Type</option>
                      <option value={EMPLOYMENT_TYPES.FULL_TIME}>Full-Time</option>
                      <option value={EMPLOYMENT_TYPES.PART_TIME}>Part-Time</option>
                      <option value={EMPLOYMENT_TYPES.CONTRACT}>Contract</option>
                      <option value={EMPLOYMENT_TYPES.INTERNSHIP}>Internship</option>
                    </select>
                    {errors.employmentType && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{String(errors.employmentType.message)}</p>
                    )}
                  </div>
                </div>

                {/* Experience Range & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Min Experience (Yrs) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      placeholder="e.g. 0"
                      className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 ${
                        errors.experienceMin ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                      }`}
                      {...register('experienceMin', { required: 'Min experience is required' })}
                    />
                    {errors.experienceMin && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{String(errors.experienceMin.message)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Max Experience (Yrs) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      placeholder="e.g. 3"
                      className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 ${
                        errors.experienceMax ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                      }`}
                      {...register('experienceMax', { required: 'Max experience is required' })}
                    />
                    {errors.experienceMax && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{String(errors.experienceMax.message)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Application Deadline <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 ${
                        errors.applicationDeadline ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                      }`}
                      {...register('applicationDeadline', { required: 'Deadline is required' })}
                    />
                    {errors.applicationDeadline && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{String(errors.applicationDeadline.message)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: JOB DESCRIPTION EDITOR */}
              <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Job Description & Responsibilities</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Describe day-to-day work, technical scope, and team impact.</p>
                    </div>
                  </div>

                  {/* AI Quick Assistant Trigger */}
                  <button
                    type="button"
                    onClick={handleOpenAiModal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Draft with AI
                  </button>
                </div>

                {/* Quick Insert Snippet Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Insert:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('responsibilities')}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    + Responsibilities
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('qualifications')}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    + Qualifications
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate('benefits')}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    + Benefits & Perks
                  </button>
                </div>

                {/* Main Textarea */}
                <div>
                  <textarea
                    rows={10}
                    placeholder="Outline the responsibilities, tech stack, day-to-day work, team context, and candidate qualifications..."
                    className={`w-full rounded-xl border bg-slate-50 dark:bg-[#0C1322] p-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono ${
                      errors.description ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700/80'
                    }`}
                    {...register('description', {
                      required: 'Job description is required',
                      minLength: { value: 50, message: 'Description must be at least 50 characters' },
                    })}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Minimum 50 characters required</span>
                    <span>{(watchedDescription || '').length} / 20,000</span>
                  </div>
                  {errors.description && (
                    <p className="text-[11px] text-rose-500 mt-0.5 font-medium">{String(errors.description.message)}</p>
                  )}
                </div>
              </div>

              {/* SECTION 3: REQUIRED TECHNICAL SKILLS */}
              <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Required Technical Skills</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Core technologies used by JobConnect's AI matching engine.</p>
                    </div>
                  </div>
                </div>

                {/* Active Skills Chips */}
                <div className="min-h-[44px] p-3 rounded-xl bg-slate-50/70 dark:bg-[#0C1322] border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap gap-2 items-center">
                  {skillsList.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      No skills added yet. Select from below or type a custom skill.
                    </span>
                  ) : (
                    skillsList.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Skill Field */}
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Type custom skill (e.g. Redis, Kubernetes, Next.js)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSkill()}
                    className="text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Quick Select Suggestions */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Add Common Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.map((sk) => {
                      const isAdded = skillsList.includes(sk.toLowerCase());
                      return (
                        <button
                          key={sk}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddSkill(sk)}
                          className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                            isAdded
                              ? 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600'
                          }`}
                        >
                          + {sk}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: COMPENSATION & SALARY RANGE */}
              <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Annual Compensation Range</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Transparent salary ranges receive 2.4x more qualified applicants.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Min Annual Salary (Optional)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      min={0}
                      placeholder="e.g. 800000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      {...register('salaryMin')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Max Annual Salary (Optional)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      min={0}
                      placeholder="e.g. 1600000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      {...register('salaryMax')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Currency
                    </label>
                    <select
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium"
                      {...register('currency')}
                    >
                      <option value="">Select Currency (Optional)</option>
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#101827] border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Candidate Display Preview:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatSalaryPreview()}
                  </span>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    if (isDirty && !window.confirm('You have unsaved changes. Discard and return to dashboard?')) {
                      return;
                    }
                    navigate('/recruiter/dashboard');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleSubmit((d) => handleJobSubmit(d, 'draft'))}
                    disabled={isDraftSaving || isPublishing}
                    className="flex-1 sm:flex-none text-xs font-semibold"
                  >
                    {isDraftSaving ? 'Saving Draft...' : 'Save as Draft'}
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isPublishing || isDraftSaving}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
                  >
                    {isPublishing ? 'Publishing Job...' : 'Publish Job Listing'}
                  </Button>
                </div>
              </div>

            </form>
          </div>

          {/* ================= RIGHT / SIDEBAR (32% / 4 Cols - Sticky) ================= */}
          <div className={`lg:col-span-4 space-y-6 lg:sticky lg:top-24 ${previewTabMobile === 'form' ? 'hidden lg:block' : 'block'}`}>
            
            {/* WIDGET 1: REAL-TIME JOB PREVIEW */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" /> Candidate View Preview
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                  Unpublished
                </span>
              </div>

              {/* Preview Card */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#101827]/60 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {profile?.logoUrl ? (
                      <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      (profile?.name?.[0] || 'C').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {watchedTitle || 'Job Title Placeholder'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>{profile?.name || 'Your Organization'}</span>
                      {profile?.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-500 inline" />}
                    </p>
                  </div>
                </div>

                {/* Subtitle meta */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                    {watchedLocation || 'Location'}
                  </span>
                  {watchedRemoteType && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{watchedRemoteType}</span>
                    </>
                  )}
                  {watchedEmploymentType && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{watchedEmploymentType}</span>
                    </>
                  )}
                  {(watchedExpMin !== '' || watchedExpMax !== '') && (
                    <>
                      <span>•</span>
                      <span>
                        {watchedExpMin !== '' && watchedExpMax !== ''
                          ? `${watchedExpMin}–${watchedExpMax} Yrs`
                          : watchedExpMin !== ''
                          ? `${watchedExpMin}+ Yrs`
                          : `Up to ${watchedExpMax} Yrs`}
                      </span>
                    </>
                  )}
                </div>

                {/* Salary badge */}
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatSalaryPreview()}
                </div>

                {/* Skills chips */}
                {skillsList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skillsList.slice(0, 4).map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {sk}
                      </span>
                    ))}
                    {skillsList.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-semibold self-center">
                        +{skillsList.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Description teaser */}
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/60 pt-2">
                  {watchedDescription || 'Job responsibilities and requirements preview will appear here as you type...'}
                </p>

                {/* Quick Apply Button preview */}
                <button
                  type="button"
                  disabled
                  className="w-full py-2 rounded-lg bg-blue-600/70 text-white font-bold text-xs cursor-default text-center"
                >
                  Quick Apply (Preview)
                </button>
              </div>
            </div>

            {/* WIDGET 2: AI COPILOT ASSISTANT */}
            <div className="bg-gradient-to-br from-indigo-900/90 to-slate-900 text-white rounded-2xl border border-indigo-700/50 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold text-white">AI Talent Copilot</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate full job specifications, skill recommendations, and responsibilities tailored to your role.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleOpenAiModal}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <Bot className="w-3.5 h-3.5 mr-1.5" /> Launch AI Assistant
              </Button>
            </div>

            {/* WIDGET 3: TIPS FOR BETTER RESULTS */}
            <div className="bg-white dark:bg-[#0D1220] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Tips for Better Results
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use specific titles like <strong>Senior Backend Engineer (Go)</strong> instead of generic terms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Including salary ranges attracts <strong>2.4x more qualified applicants</strong> on JobConnect.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>Add 4–6 core technical skills for higher precision candidate matching.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: AI JOB DESCRIPTION GENERATOR MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Job Description Generator"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Powered by JobConnect's AI engine. Enter key requirements and notes to generate a polished job overview, responsibilities, and qualifications.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Role Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={aiTitle}
              onChange={(e) => setAiTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Experience Years
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={aiExperience}
                onChange={(e) => setAiExperience(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Technologies
              </label>
              <input
                type="text"
                placeholder="React, TypeScript, Next.js"
                value={aiSkills}
                onChange={(e) => setAiSkills(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Raw Recruiter Notes / Key Priorities <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. We are building micro-frontends with high test coverage. Looking for candidates who understand web performance and state machines..."
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-[#0C1322] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => aiGenerateMutation.mutate()}
              isLoading={aiGenerateMutation.isPending}
              disabled={!aiTitle.trim() || aiGenerateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {aiGenerateMutation.isPending ? 'Generating with AI...' : 'Generate Description'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: AI OVERWRITE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={aiConflictModal}
        onClose={() => setAiConflictModal(false)}
        title="Apply AI Generated Content"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Your job description already has existing content. Would you like to replace the current text or append the AI content below it?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setAiConflictModal(false)}>
              Discard AI Result
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyAiContent(aiGeneratedData, 'append')}
            >
              Append to Existing
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => applyAiContent(aiGeneratedData, 'replace')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Replace Description
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
