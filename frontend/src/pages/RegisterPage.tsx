import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RegisterSchema,
  RegisterInput,
  COUNTRIES,
  DEFAULT_COUNTRY,
  HIGHEST_QUALIFICATIONS,
  GENDER_OPTIONS,
  ROLES,
  calculateAge,
  VALIDATION_LIMITS,
  getPhoneValidationState,
  type CountryMetadata,
} from '@jobconnect/shared';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  Mail,
  Calendar,
  Users,
  GraduationCap,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Code2,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Plus,
  ChevronDown,
  Search,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  RegisterBranding,
  RoleSelectorCards,
  StepProgressBar,
} from '../components/auth/register/index.js';

const PRESET_SKILLS = {
  Languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Kotlin', 'Swift', 'SQL'],
  'Frontend & Mobile': ['React', 'Next.js', 'Vue.js', 'Angular', 'React Native', 'Flutter', 'Tailwind CSS', 'Redux'],
  'Backend & APIs': ['Node.js', 'Express', 'Spring Boot', 'Django', 'FastAPI', 'NestJS', 'GraphQL', 'REST APIs'],
  Databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase'],
  'Cloud & DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'Linux'],
};

const DRAFT_STORAGE_KEY = 'jobconnect_register_draft_v1';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAuth } = useAuth();

  // Multi-step onboarding state (1: Role, 2: Personal & Contact, 3: Education & Profile, 4: Security)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<number>(1);

  const [serverError, setServerError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstNameWarning, setFirstNameWarning] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [introCharCount, setIntroCharCount] = useState(0);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const maxDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // SEO Page Title
  useEffect(() => {
    document.title = 'Create Account | JobConnect';
  }, []);

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

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange',
    defaultValues: {
      countryCode: '+91',
      role: undefined as unknown as typeof ROLES.CANDIDATE,
      gender: undefined as unknown as 'Male',
      highestQualification: '' as unknown as typeof HIGHEST_QUALIFICATIONS[number],
      agreeTerms: false as unknown as true,
      agreePrivacy: true,
      shortIntro: '',
      skills: [],
    },
  });

  const { ref: dobRegisterRef, ...dobRegister } = register('dateOfBirth');

  const selectedRole = watch('role');
  const firstNameValue = watch('firstName') || '';
  const lastNameValue = watch('lastName') || '';
  const emailValue = watch('email') || '';
  const nationalNumberValue = watch('nationalNumber') || '';
  const dobValue = watch('dateOfBirth') || '';
  const genderValue = watch('gender');
  const highestQualificationValue = watch('highestQualification');
  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';
  const agreeTermsValue = watch('agreeTerms');

  // Load draft from sessionStorage on initial load (non-sensitive info only)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setValue('role', parsed.role, { shouldValidate: true });
        if (parsed.firstName) setValue('firstName', parsed.firstName);
        if (parsed.lastName) setValue('lastName', parsed.lastName);
        if (parsed.email) setValue('email', parsed.email);
        if (parsed.countryCode) {
          setValue('countryCode', parsed.countryCode);
          const found = COUNTRIES.find((c) => c.dialCode === parsed.countryCode);
          if (found) setSelectedCountry(found);
        }
        if (parsed.nationalNumber) setValue('nationalNumber', parsed.nationalNumber);
        if (parsed.dateOfBirth) setValue('dateOfBirth', parsed.dateOfBirth);
        if (parsed.gender) setValue('gender', parsed.gender);
        if (parsed.highestQualification) setValue('highestQualification', parsed.highestQualification);
        if (parsed.shortIntro) {
          setValue('shortIntro', parsed.shortIntro);
          setIntroCharCount(parsed.shortIntro.length);
        }
        if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
          setSelectedSkills(parsed.skills);
          setValue('skills', parsed.skills);
        }
      }
    } catch {
      // Ignore session storage errors
    }
  }, [setValue]);

  // Real-time country-specific phone validation state
  const phoneValidation = useMemo(
    () => getPhoneValidationState(selectedCountry, nationalNumberValue),
    [selectedCountry, nationalNumberValue]
  );

  // Age calculation
  const calculatedAge = dobValue ? calculateAge(dobValue) : null;
  const minRequiredAge =
    selectedRole === ROLES.RECRUITER
      ? VALIDATION_LIMITS.MIN_AGE_RECRUITER
      : VALIDATION_LIMITS.MIN_AGE_CANDIDATE;

  // Real-time Date of Birth error
  const dobError = useMemo(() => {
    if (!dobValue) {
      return submitAttempted ? (errors.dateOfBirth?.message || 'Date of Birth is required.') : null;
    }
    const inputDate = new Date(dobValue);
    const today = new Date();
    if (inputDate > today) {
      return 'Date of Birth cannot be a future date.';
    }
    if (calculatedAge === null || calculatedAge < 0) {
      return 'Please enter a valid date of birth.';
    }
    if (calculatedAge < minRequiredAge) {
      return selectedRole === ROLES.RECRUITER
        ? `Recruiters must be at least ${VALIDATION_LIMITS.MIN_AGE_RECRUITER} years old to register.`
        : `Candidates must be at least ${VALIDATION_LIMITS.MIN_AGE_CANDIDATE} years old to register.`;
    }
    if (calculatedAge > VALIDATION_LIMITS.MAX_AGE_YEARS) {
      return `Please enter a valid birth date (maximum age ${VALIDATION_LIMITS.MAX_AGE_YEARS} years).`;
    }
    return errors.dateOfBirth?.message || null;
  }, [dobValue, calculatedAge, minRequiredAge, selectedRole, submitAttempted, errors.dateOfBirth]);

  // Helper to determine whether an error should be shown.
  const getErrorMessage = (fieldName: keyof RegisterInput) => {
    if (fieldName === 'dateOfBirth') {
      return dobError;
    }

    if (fieldName === 'nationalNumber') {
      if (!nationalNumberValue || nationalNumberValue.trim() === '') {
        return submitAttempted ? (errors.nationalNumber?.message || 'Mobile number is required.') : null;
      }
      return !phoneValidation.valid ? (phoneValidation.reason || 'Invalid phone number.') : null;
    }

    const error = errors[fieldName];
    if (!error) return null;
    const val = watch(fieldName);

    // If it's a string value and cleared/empty, return null (starting normal state)
    if (typeof val === 'string') {
      if (val.trim() === '') return null;
    }

    // For boolean fields (e.g. agreeTerms), only show error after submit is attempted
    if (typeof val === 'boolean') {
      if (!submitAttempted && !val) return null;
    }

    // For non-string fields (like role, gender, qualifications), only show if submit was attempted
    if (!submitAttempted && (val === undefined || val === null || val === '')) {
      return null;
    }

    return error.message;
  };

  // Step 1 Validity
  const isStep1Valid = Boolean(selectedRole);

  // Step 2 Validity
  const isStep2Valid = Boolean(
    firstNameValue.trim().length >= 2 &&
    /^[A-Z][a-zA-Z]{1,49}$/.test(firstNameValue) &&
    lastNameValue.trim().length >= 2 &&
    /^[A-Za-z]+(\s[A-Za-z]+)*$/.test(lastNameValue.trim()) &&
    emailValue.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim()) &&
    phoneValidation.valid &&
    dobValue &&
    calculatedAge !== null &&
    calculatedAge >= minRequiredAge &&
    calculatedAge <= 120 &&
    genderValue
  );

  // Step 3 Validity
  const isStep3Valid = Boolean(highestQualificationValue);

  // Step 4 Validity
  const isStep4Valid = Boolean(
    passwordValue.length >= 6 &&
    /[A-Za-z]/.test(passwordValue) &&
    /\d/.test(passwordValue) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(passwordValue) &&
    confirmPasswordValue &&
    confirmPasswordValue === passwordValue &&
    agreeTermsValue === true
  );

  const isFormComplete = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;

  // Handle step advancement
  const handleNextStep = async () => {
    setServerError(null);

    if (currentStep === 1) {
      if (!selectedRole) {
        setServerError('Please choose whether you are a Job Seeker or Employer to continue.');
        return;
      }
      setCurrentStep(2);
      setMaxVisitedStep((prev) => Math.max(prev, 2));
      return;
    }

    if (currentStep === 2) {
      const valid = await trigger([
        'firstName',
        'lastName',
        'email',
        'countryCode',
        'nationalNumber',
        'dateOfBirth',
        'gender',
      ]);
      if (!valid || !phoneValidation.valid || calculatedAge === null || calculatedAge < minRequiredAge || calculatedAge > 120) {
        setServerError(
          `Please provide valid personal details. Minimum age for ${
            selectedRole === ROLES.RECRUITER ? 'Recruiters is 22' : 'Candidates is 18'
          } years.`
        );
        return;
      }
      setCurrentStep(3);
      setMaxVisitedStep((prev) => Math.max(prev, 3));
      return;
    }

    if (currentStep === 3) {
      const valid = await trigger(['highestQualification', 'shortIntro']);
      if (!valid || !highestQualificationValue) {
        setServerError('Please select your highest qualification to continue.');
        return;
      }
      setCurrentStep(4);
      setMaxVisitedStep((prev) => Math.max(prev, 4));
      return;
    }
  };

  const handlePrevStep = () => {
    setServerError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectStep = (targetStep: number) => {
    if (targetStep <= maxVisitedStep) {
      setServerError(null);
      setCurrentStep(targetStep);
    }
  };

  // Save non-sensitive draft to sessionStorage
  const handleSaveDraft = () => {
    try {
      const draftData = {
        role: selectedRole,
        firstName: firstNameValue,
        lastName: lastNameValue,
        email: emailValue,
        countryCode: selectedCountry.dialCode,
        nationalNumber: nationalNumberValue,
        dateOfBirth: dobValue,
        gender: genderValue,
        highestQualification: highestQualificationValue,
        shortIntro: watch('shortIntro'),
        skills: selectedSkills,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setDraftNotice('Registration progress saved locally.');
      setTimeout(() => setDraftNotice(null), 3500);
    } catch {
      // Ignore
    }
  };

  // Handle country selection
  const handleCountrySelect = (country: CountryMetadata) => {
    setSelectedCountry(country);
    setValue('countryCode', country.dialCode, { shouldValidate: true });

    const currentVal = (watch('nationalNumber') || '').replace(/\D/g, '');
    const maxDigits = Math.max(...country.digits);
    const truncated = currentVal.slice(0, maxDigits);
    setValue('nationalNumber', truncated, { shouldValidate: true });
    if (!truncated) {
      clearErrors('nationalNumber');
    }

    setIsCountryDropdownOpen(false);
    setCountrySearch('');
  };

  // Handle phone keydown
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      setPhoneWarning('Only digits (0-9) are allowed in mobile number.');
      setTimeout(() => setPhoneWarning(null), 3000);
    }
  };

  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, '');
    if (raw !== clean) {
      setPhoneWarning('Only digits (0-9) are allowed in mobile number.');
      setTimeout(() => setPhoneWarning(null), 3000);
    }
    const maxDigits = selectedCountry.digits ? Math.max(...selectedCountry.digits) : 10;
    const limited = clean.slice(0, maxDigits);
    setValue('nationalNumber', limited, { shouldValidate: true });
    if (!limited) {
      clearErrors('nationalNumber');
    }
  };

  // Handle phone paste
  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const clean = pasteData.replace(/\D/g, '');
    if (clean !== pasteData.trim()) {
      setPhoneWarning('Pasted text contained non-digits which were removed.');
      setTimeout(() => setPhoneWarning(null), 3000);
    }
    const maxDigits = selectedCountry.digits ? Math.max(...selectedCountry.digits) : 10;
    const limited = clean.slice(0, maxDigits);
    setValue('nationalNumber', limited, { shouldValidate: true });
  };

  // Handle keydown on first name to prevent spaces immediately
  const handleFirstNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      setFirstNameWarning('Spaces or gaps are not permitted in First Name.');
      setTimeout(() => setFirstNameWarning(null), 3000);
    }
  };

  // Handle first name change - auto-capitalize first letter and prevent all gaps
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const noSpaces = raw.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
    const capitalized = noSpaces.length > 0 ? noSpaces.charAt(0).toUpperCase() + noSpaces.slice(1) : '';
    setValue('firstName', capitalized, { shouldValidate: true });
    if (capitalized === '') {
      clearErrors('firstName');
    }
  };

  // Handle last name change - allow alphabetic words and single spaces
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/\s{2,}/g, ' ');
    setValue('lastName', sanitized, { shouldValidate: true });
    if (sanitized.trim() === '') {
      clearErrors('lastName');
    }
  };

  // Handle last name blur
  const handleLastNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value || '';
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    const formatted = trimmed
      ? trimmed
          .split(' ')
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
          .join(' ')
      : '';
    setValue('lastName', formatted, { shouldValidate: true });
    if (formatted === '') {
      clearErrors('lastName');
    }
    register('lastName').onBlur(e);
  };

  // Handle skills selection
  const handleToggleSkill = (skill: string) => {
    const normalized = skill.toLowerCase().trim();
    let updated: string[];
    if (selectedSkills.includes(normalized)) {
      updated = selectedSkills.filter((s) => s !== normalized);
    } else {
      updated = [...selectedSkills, normalized];
    }
    setSelectedSkills(updated);
    setValue('skills', updated);
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customSkillInput.trim().toLowerCase();
    if (clean && !selectedSkills.includes(clean)) {
      const updated = [...selectedSkills, clean];
      setSelectedSkills(updated);
      setValue('skills', updated);
      setCustomSkillInput('');
    }
  };

  const onInvalid = () => {
    setSubmitAttempted(true);
    setServerError('Please fill in all required fields marked with * before creating your account.');
  };

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const submissionData = {
        ...data,
        agreePrivacy: true,
        skills: selectedRole === ROLES.CANDIDATE ? selectedSkills : [],
      };
      const response = await registerAuth(submissionData);
      if (response.success) {
        // Clear saved draft on successful account registration
        try {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {}

        navigate(
          `/verify-otp?userId=${response.data.userId}&email=${encodeURIComponent(
            response.data.email
          )}`
        );
      }
    } catch (err: any) {
      setServerError(
        err.response?.data?.error?.message ||
          'Registration failed. Please check your details and try again.'
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto lg:overflow-hidden no-scrollbar bg-gradient-to-b from-[#FAF8FC] via-[#F8F6FD] to-[#F3F0FA] dark:from-[#090D1A] dark:via-[#0B1020] dark:to-[#090D1A] flex flex-col justify-start py-4 sm:py-6 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Subtle Ambient Glow Background Orbs */}
      <div className="absolute top-12 left-1/4 w-[420px] h-[420px] bg-purple-500/8 dark:bg-purple-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 right-1/4 w-[480px] h-[480px] bg-indigo-500/8 dark:bg-indigo-600/12 rounded-full blur-3xl pointer-events-none" />

      {/* Main 2-Column Split SaaS Container */}
      <div className="max-w-[1360px] mx-auto w-full relative z-10 lg:h-full flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-8 xl:gap-12">
        {/* Left Column: Brand Value Proposition & Career Setup Timeline (FIXED / NEVER SCROLLS on desktop) */}
        <div className="w-full lg:w-[38%] xl:w-[36%] shrink-0 lg:h-full lg:overflow-y-auto no-scrollbar flex flex-col justify-start py-2">
          <RegisterBranding
            currentStep={currentStep}
            onSelectStep={handleSelectStep}
          />
        </div>

        {/* Right Column: Premium Multi-Step Registration Form Card (ONLY THIS SCROLLS on desktop, scrollbar hidden) */}
        <div className="w-full lg:w-[62%] xl:w-[64%] lg:h-full lg:overflow-y-auto no-scrollbar flex flex-col justify-start py-2 pb-16">
          <div className="w-full bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/90 dark:border-slate-800 transition-colors">
            {/* Card Header & Dynamic Reference Stepper */}
            <StepProgressBar
              currentStep={currentStep}
              totalSteps={4}
              maxVisitedStep={maxVisitedStep}
              onSelectStep={handleSelectStep}
            />

              {/* Server Error Alert Banner */}
              {serverError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{serverError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServerError(null)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Draft Saved Banner */}
              {draftNotice && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{draftNotice}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                {/* ========================================================= */}
                {/* STEP 1: ACCOUNT TYPE */}
                {/* ========================================================= */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Step 1 of 4
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        Select Your Account Type
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Tell us how you plan to use JobConnect so we can tailor your experience.
                      </p>
                    </div>

                    <RoleSelectorCards
                      selectedRole={selectedRole}
                      onSelectRole={(role) => {
                        setValue('role', role as any, { shouldValidate: true });
                        if (!role) {
                          clearErrors('role');
                        }
                        setServerError(null);
                      }}
                      errorMessage={getErrorMessage('role')}
                    />

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={!isStep1Valid}
                        className={`py-2.5 px-6 rounded-xl text-xs font-semibold flex items-center transition-all ${
                          !isStep1Valid
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/20 active:scale-[0.99] cursor-pointer'
                        }`}
                      >
                        <span>Continue to Personal Info</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* STEP 2: PERSONAL INFORMATION & CONTACT */}
                {/* ========================================================= */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Step 2 of 4
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        Personal Info & Contact Details
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Enter your legal name, contact information, and date of birth.
                      </p>
                    </div>

                    {/* Section 1: Names */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">
                        1. Personal Identification
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <div
                            className={`relative rounded-xl border ${
                              getErrorMessage('firstName')
                                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                            } bg-white dark:bg-slate-800/80 transition-all`}
                          >
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Enter first name"
                              onKeyDown={handleFirstNameKeyDown}
                              {...register('firstName')}
                              onChange={handleFirstNameChange}
                              className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                            />
                          </div>
                          {firstNameWarning && (
                            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              {firstNameWarning}
                            </p>
                          )}
                          {getErrorMessage('firstName') && (
                            <p className="mt-1 text-[11px] text-red-500 font-medium">
                              {getErrorMessage('firstName')}
                            </p>
                          )}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <div
                            className={`relative rounded-xl border ${
                              getErrorMessage('lastName')
                                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                            } bg-white dark:bg-slate-800/80 transition-all`}
                          >
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Enter last name"
                              {...register('lastName')}
                              onChange={handleLastNameChange}
                              onBlur={handleLastNameBlur}
                              className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                            />
                          </div>
                          {getErrorMessage('lastName') && (
                            <p className="mt-1 text-[11px] text-red-500 font-medium">
                              {getErrorMessage('lastName')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Contact Details */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">
                        2. Contact & Identity
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Email Address */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              Email Address <span className="text-red-500">*</span>
                            </label>
                            <div
                              className={`relative rounded-xl border ${
                                getErrorMessage('email')
                                  ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                  : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                              } bg-white dark:bg-slate-800/80 transition-all`}
                            >
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail className="w-4 h-4" />
                              </div>
                              <input
                                type="email"
                                placeholder="name@example.com"
                                {...register('email')}
                                onChange={(e) => {
                                  register('email').onChange(e);
                                  if (!e.target.value || e.target.value.trim() === '') {
                                    clearErrors('email');
                                  }
                                }}
                                className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                              />
                            </div>
                            {getErrorMessage('email') && (
                              <p className="mt-1 text-[11px] text-red-500 font-medium">
                                {getErrorMessage('email')}
                              </p>
                            )}
                          </div>

                          {/* Mobile Number with Country Dial Code */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div
                                className={`flex rounded-xl border ${
                                  getErrorMessage('nationalNumber')
                                    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                    : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                                } bg-white dark:bg-slate-800/80 transition-all`}
                              >
                                {/* Country Selector */}
                                <div className="relative" ref={countryDropdownRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                                    className="h-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none flex items-center space-x-2 transition-colors cursor-pointer rounded-l-xl"
                                    aria-label="Select Country Code"
                                  >
                                    <img
                                      src={`https://flagcdn.com/w40/${selectedCountry.iso2.toLowerCase()}.png`}
                                      alt={selectedCountry.name}
                                      className="w-5 h-3.5 object-cover rounded shadow-2xs flex-shrink-0"
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
                                            placeholder="Search country or dial code..."
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                            autoFocus
                                          />
                                        </div>
                                      </div>
                                      <div className="overflow-y-auto max-h-60 divide-y divide-slate-50 dark:divide-slate-800">
                                        {filteredCountries.length === 0 ? (
                                          <div className="p-4 text-center text-xs text-slate-400">
                                            No country found
                                          </div>
                                        ) : (
                                          filteredCountries.map((c) => {
                                            const isSelected = selectedCountry.iso2 === c.iso2;
                                            return (
                                              <button
                                                key={c.iso2}
                                                type="button"
                                                onClick={() => handleCountrySelect(c)}
                                                className={`w-full px-3 py-2 flex items-center justify-between text-xs hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors text-left ${
                                                  isSelected
                                                    ? 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium'
                                                    : 'text-slate-700 dark:text-slate-200'
                                                }`}
                                              >
                                                <div className="flex items-center space-x-2.5 min-w-0">
                                                  <img
                                                    src={`https://flagcdn.com/w40/${c.iso2.toLowerCase()}.png`}
                                                    alt={c.name}
                                                    className="w-5 h-3.5 object-cover rounded shadow-2xs flex-shrink-0"
                                                    loading="lazy"
                                                  />
                                                  <span className="truncate">{c.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                                                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{c.dialCode}</span>
                                                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                                                </div>
                                              </button>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* National Phone Input */}
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={selectedCountry.digits ? Math.max(...selectedCountry.digits) : 10}
                                  placeholder={selectedCountry.placeholder || 'XXXXXXXXXX'}
                                  {...register('nationalNumber')}
                                  value={nationalNumberValue}
                                  onKeyDown={handlePhoneKeyDown}
                                  onChange={handlePhoneChange}
                                  onPaste={handlePhonePaste}
                                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-r-xl"
                                />
                              </div>
                            </div>

                            {phoneWarning && (
                              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                {phoneWarning}
                              </p>
                            )}
                            {getErrorMessage('nationalNumber') ? (
                              <div className="mt-1 flex items-start space-x-1.5 text-[11px] text-red-500 dark:text-red-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <span>{getErrorMessage('nationalNumber')}</span>
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                {selectedCountry.dialCode === '+91'
                                  ? '10-digit mobile number starting with 6, 7, 8, or 9.'
                                  : `Exact ${selectedCountry.digits ? selectedCountry.digits.join(' or ') : '10'} digits required.`}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* DOB & Gender Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Date of Birth */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <div
                              onClick={() => {
                                try {
                                  dobInputRef.current?.showPicker?.();
                                } catch {
                                  dobInputRef.current?.focus();
                                }
                              }}
                              className={`relative rounded-xl border cursor-pointer ${
                                dobError
                                  ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                  : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                              } bg-white dark:bg-slate-800/80 transition-all`}
                            >
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <input
                                type="date"
                                max={maxDate}
                                {...dobRegister}
                                ref={(e) => {
                                  dobRegisterRef(e);
                                  (dobInputRef as any).current = e;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try {
                                    (e.target as HTMLInputElement).showPicker?.();
                                  } catch {}
                                }}
                                onChange={(e) => {
                                  dobRegister.onChange(e);
                                  if (!e.target.value) {
                                    clearErrors('dateOfBirth');
                                  }
                                }}
                                className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl cursor-pointer"
                              />
                            </div>
                            {dobError ? (
                              <div className="mt-1 flex items-start space-x-1.5 text-[11px] text-red-500 dark:text-red-400 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>{dobError}</span>
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                {selectedRole === ROLES.RECRUITER
                                  ? 'Recruiters must be at least 22 years old.'
                                  : 'Candidates must be at least 18 years old.'}
                              </p>
                            )}
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                              <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              Gender <span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50/50 dark:bg-slate-800/50">
                              {GENDER_OPTIONS.map((opt) => {
                                const isSelected = genderValue === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setValue('gender', '' as any, { shouldValidate: true });
                                        clearErrors('gender');
                                      } else {
                                        setValue('gender', opt as any, { shouldValidate: true });
                                      }
                                    }}
                                    className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all select-none ${
                                      isSelected
                                        ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs border border-purple-200 dark:border-purple-800/60 font-semibold'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-transparent'
                                    }`}
                                  >
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full border mr-1.5 flex items-center justify-center transition-colors ${
                                        isSelected
                                          ? 'border-purple-600 bg-purple-600'
                                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {getErrorMessage('gender') && (
                              <p className="mt-1 text-[11px] text-red-500 font-medium">
                                {getErrorMessage('gender')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                      </button>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
                        </button>

                        <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={!isStep2Valid}
                          className={`py-2.5 px-6 rounded-xl text-xs font-semibold flex items-center transition-all ${
                            !isStep2Valid
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/20 active:scale-[0.99] cursor-pointer'
                          }`}
                        >
                          <span>Continue to Profile</span>
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* STEP 3: EDUCATION & SHORT INTRO & SKILLS */}
                {/* ========================================================= */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Step 3 of 4
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        Education & Professional Summary
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Add your educational background and a short introduction to showcase your expertise.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Highest Qualification */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          Highest Qualification <span className="text-red-500">*</span>
                        </label>
                        <div
                          className={`relative rounded-xl border ${
                            getErrorMessage('highestQualification')
                              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                              : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                          } bg-white dark:bg-slate-800/80 transition-all`}
                        >
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <select
                            {...register('highestQualification')}
                            defaultValue=""
                            className="w-full bg-transparent pl-10 pr-8 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 focus:outline-none rounded-xl cursor-pointer"
                          >
                            <option value="" disabled className="dark:bg-slate-800 dark:text-slate-400">
                              Select Highest Qualification
                            </option>
                            {HIGHEST_QUALIFICATIONS.map((q) => (
                              <option key={q} value={q} className="dark:bg-slate-800 dark:text-slate-100">
                                {q}
                              </option>
                            ))}
                          </select>
                        </div>
                        {getErrorMessage('highestQualification') && (
                          <p className="mt-1 text-[11px] text-red-500 font-medium">
                            {getErrorMessage('highestQualification')}
                          </p>
                        )}
                      </div>

                      {/* Short Intro / Message */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Short Intro / Message
                          </label>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {introCharCount}/500
                          </span>
                        </div>
                        <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950 transition-all">
                          <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <textarea
                            rows={3}
                            maxLength={500}
                            placeholder="Share a brief sentence or two about yourself, background, or goals..."
                            {...register('shortIntro')}
                            onChange={(e) => {
                              setIntroCharCount(e.target.value.length);
                              register('shortIntro').onChange(e);
                              if (!e.target.value || e.target.value.trim() === '') {
                                clearErrors('shortIntro');
                              }
                            }}
                            className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl resize-none"
                          />
                        </div>
                        {getErrorMessage('shortIntro') && (
                          <p className="mt-1 text-[11px] text-red-500 font-medium">
                            {getErrorMessage('shortIntro')}
                          </p>
                        )}
                      </div>

                      {/* Technical Skills & Stack (Candidate Only) */}
                      {selectedRole === ROLES.CANDIDATE && (
                        <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-slate-800/40 border border-purple-100 dark:border-slate-700 transition-all mt-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center space-x-2">
                              <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                Technical Skills & Stack
                              </h4>
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              Candidate
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Select or type your core languages, frameworks, databases, and tools:
                          </p>

                          {/* Selected Skills Chips */}
                          {selectedSkills.length > 0 && (
                            <div className="mb-3.5 flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-100 dark:border-slate-700">
                              {selectedSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 capitalize"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSkill(skill)}
                                    className="ml-1.5 text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 focus:outline-none"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Custom Skill Input */}
                          <div className="flex gap-2 mb-3.5">
                            <div className="relative flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950">
                              <input
                                type="text"
                                placeholder="Type custom skill and press Enter (e.g. Next.js, Redis)..."
                                value={customSkillInput}
                                onChange={(e) => setCustomSkillInput(e.target.value)}
                                onKeyDown={handleAddCustomSkill}
                                className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleAddCustomSkill}
                              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center transition-colors shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add
                            </button>
                          </div>

                          {/* Preset Categories */}
                          <div className="space-y-2.5">
                            {Object.entries(PRESET_SKILLS).map(([category, skills]) => (
                              <div key={category}>
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                  {category}:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {skills.map((s) => {
                                    const isSelected = selectedSkills.includes(s.toLowerCase());
                                    return (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleToggleSkill(s)}
                                        className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                                          isSelected
                                            ? 'bg-purple-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300 dark:hover:border-slate-600 hover:bg-purple-50/50 dark:hover:bg-slate-700'
                                        }`}
                                      >
                                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                        {s}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                      </button>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
                        </button>

                        <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={!isStep3Valid}
                          className={`py-2.5 px-6 rounded-xl text-xs font-semibold flex items-center transition-all ${
                            !isStep3Valid
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/20 active:scale-[0.99] cursor-pointer'
                          }`}
                        >
                          <span>Continue to Security</span>
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* STEP 4: SECURITY & CREDENTIALS */}
                {/* ========================================================= */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Step 4 of 4
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        Security & Credentials
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Create a secure password and review agreement terms to finalize your registration.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div
                            className={`relative rounded-xl border ${
                              getErrorMessage('password')
                                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                            } bg-white dark:bg-slate-800/80 transition-all`}
                          >
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter strong password"
                              {...register('password')}
                              onChange={(e) => {
                                register('password').onChange(e);
                                if (!e.target.value || e.target.value.trim() === '') {
                                  clearErrors('password');
                                } else {
                                  trigger('password');
                                }
                                if (confirmPasswordValue) {
                                  trigger('confirmPassword');
                                }
                              }}
                              className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {getErrorMessage('password') && (
                            <p className="mt-1 text-[11px] text-red-500 font-medium">
                              {getErrorMessage('password')}
                            </p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <div
                            className={`relative rounded-xl border ${
                              getErrorMessage('confirmPassword')
                                ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                                : 'border-slate-200 dark:border-slate-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-950'
                            } bg-white dark:bg-slate-800/80 transition-all`}
                          >
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Re-enter password"
                              {...register('confirmPassword')}
                              onChange={(e) => {
                                register('confirmPassword').onChange(e);
                                if (!e.target.value || e.target.value.trim() === '') {
                                  clearErrors('confirmPassword');
                                } else {
                                  trigger('confirmPassword');
                                }
                              }}
                              className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {getErrorMessage('confirmPassword') && (
                            <p className="mt-1 text-[11px] text-red-500 font-medium">
                              {getErrorMessage('confirmPassword')}
                            </p>
                          )}
                          {!getErrorMessage('confirmPassword') &&
                            confirmPasswordValue &&
                            confirmPasswordValue === passwordValue && (
                              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                                <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Passwords match
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Terms & Privacy Agreement */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="terms"
                            {...register('agreeTerms')}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <label
                            htmlFor="terms"
                            className="ml-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none leading-relaxed"
                          >
                            I agree to the{' '}
                            <span className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                              Terms of Service
                            </span>{' '}
                            and{' '}
                            <span className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                              Privacy Policy
                            </span>
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                        </div>
                        {getErrorMessage('agreeTerms') && (
                          <p className="mt-1.5 text-[11px] text-red-500 font-medium">
                            {getErrorMessage('agreeTerms')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                      </button>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
                        </button>

                        <button
                          type="submit"
                          disabled={!isFormComplete || isSubmitting}
                          className={`py-2.5 px-6 rounded-xl text-xs font-semibold flex items-center transition-all ${
                            !isFormComplete || isSubmitting
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white shadow-md shadow-purple-500/20 active:scale-[0.99] cursor-pointer'
                          }`}
                        >
                          {isSubmitting ? (
                            <span>Creating Account...</span>
                          ) : (
                            <span className="flex items-center">
                              Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Sign In Link */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };
