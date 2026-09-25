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
  Plus,
  Briefcase,
  Building,
  ChevronDown,
  Search,
  AlertCircle,
} from 'lucide-react';

const PRESET_SKILLS = {
  Languages: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Kotlin', 'Swift', 'SQL'],
  'Frontend & Mobile': ['React', 'Next.js', 'Vue.js', 'Angular', 'React Native', 'Flutter', 'Tailwind CSS', 'Redux'],
  'Backend & APIs': ['Node.js', 'Express', 'Spring Boot', 'Django', 'FastAPI', 'NestJS', 'GraphQL', 'REST APIs'],
  Databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase'],
  'Cloud & DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'Linux'],
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
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

  // Real-time country-specific phone validation state
  const phoneValidation = useMemo(
    () => getPhoneValidationState(selectedCountry, nationalNumberValue),
    [selectedCountry, nationalNumberValue]
  );

  // Helper to determine whether an error should be shown.
  // When a field is cleared / empty, it returns to the starting normal state without red validation!
  const getErrorMessage = (fieldName: keyof RegisterInput) => {
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

  // Age calculation
  const calculatedAge = dobValue ? calculateAge(dobValue) : null;

  // Check if all required details are filled and valid to enable the Create Account button
  const isFormComplete = Boolean(
    selectedRole &&
    firstNameValue.trim().length >= 2 &&
    /^[A-Z][a-zA-Z]{1,49}$/.test(firstNameValue) &&
    lastNameValue.trim().length >= 2 &&
    /^[A-Za-z]+(\s[A-Za-z]+)*$/.test(lastNameValue.trim()) &&
    emailValue.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim()) &&
    phoneValidation.valid &&
    dobValue &&
    calculatedAge !== null &&
    calculatedAge >= 13 &&
    calculatedAge <= 120 &&
    genderValue &&
    highestQualificationValue &&
    passwordValue.length >= 6 &&
    /[A-Za-z]/.test(passwordValue) &&
    /\d/.test(passwordValue) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(passwordValue) &&
    confirmPasswordValue &&
    confirmPasswordValue === passwordValue &&
    agreeTermsValue === true
  );

  // Handle country selection - auto-adjusts existing phone number to new country rules
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

  // Handle phone keydown to prevent non-digit input immediately
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

  // Handle phone change - enforce digits only, max length of selected country, and real-time validation
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

  // Handle phone paste - strip non-digits and slice to selected country max digits
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

  // Handle last name blur - automatically trim trailing space and format like "Kumar Tiwari"
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
      // If recruiter, omit skills
      const submissionData = {
        ...data,
        agreePrivacy: true,
        skills: selectedRole === ROLES.CANDIDATE ? selectedSkills : [],
      };
      const response = await registerAuth(submissionData);
      if (response.success) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex justify-center transition-colors duration-200">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 p-7 sm:p-9 rounded-[28px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/90 dark:border-slate-800 transition-colors">
        {/* Title & Subtitle */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-100/90 dark:border-blue-900 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center font-bold text-xl mb-3 shadow-sm">
            JC
          </div>
          <h1 className="text-3xl font-extrabold text-[#2b7fff] dark:text-blue-400 tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
            Join JobConnect to find your dream tech career or hire top engineering talent
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center">
              <X className="w-4 h-4 mr-2 flex-shrink-0" />
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

        {/* Role Selector Header */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            I am registering as: <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setValue('role', ROLES.CANDIDATE, { shouldValidate: true });
              }}
              className={`flex items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedRole === ROLES.CANDIDATE
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-400/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              Job Seeker / Candidate
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('role', ROLES.RECRUITER, { shouldValidate: true });
              }}
              className={`flex items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedRole === ROLES.RECRUITER
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-400/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Building className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              Employer / Recruiter
            </button>
          </div>
          {getErrorMessage('role') && (
            <p className="mt-2 text-[11px] text-red-500 font-medium">
              {getErrorMessage('role')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          {/* ========================================================= */}
          {/* 1. PERSONAL INFORMATION */}
          {/* ========================================================= */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2b7fff] dark:text-blue-400 mb-3.5">
              1. Personal Information
            </h2>
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
                      : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                  } bg-white dark:bg-slate-800 transition-all`}
                >
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter first name (e.g. Aditya)"
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
                      : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                  } bg-white dark:bg-slate-800 transition-all`}
                >
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter last name (e.g. Kumar Tiwari)"
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

          {/* ========================================================= */}
          {/* 2. CONTACT & IDENTITY */}
          {/* ========================================================= */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2b7fff] mb-3.5">
              2. Contact & Identity
            </h2>
            <div className="space-y-4">
              {/* Email & Mobile Number Row */}
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
                        : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                    } bg-white dark:bg-slate-800 transition-all`}
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

                {/* Mobile Number with Country Dial Code & Flag */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className={`flex rounded-xl border ${
                        getErrorMessage('nationalNumber')
                          ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                          : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                      } bg-white dark:bg-slate-800 transition-all`}
                    >
                      {/* Country Flag & Dial Code Selector Button */}
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                          className="h-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none flex items-center space-x-2 transition-colors cursor-pointer rounded-l-xl"
                          aria-label="Select Country Code"
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
                                  placeholder="Search country or dial code..."
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                                      className={`w-full px-3 py-2 flex items-center justify-between text-xs hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-left ${
                                        isSelected ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-200'
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
                                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{c.dialCode}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
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

                  {/* Real-time Mistake Messages */}
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
                        ? '10-digit mobile number starting with 6, 7, 8, or 9 (digits only).'
                        : `Exact ${selectedCountry.digits ? selectedCountry.digits.join(' or ') : '10'} digits required.`}
                    </p>
                  )}
                </div>
              </div>

              {/* DOB & Gender Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Date of Birth (DOB) <span className="text-red-500">*</span>
                    </label>
                    {calculatedAge !== null && calculatedAge >= 0 && (
                      <span
                        className={`text-[11px] font-semibold ${
                          calculatedAge >= 13 && calculatedAge <= 120
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        Age: {calculatedAge} yrs
                      </span>
                    )}
                  </div>
                  <div
                    onClick={() => {
                      try {
                        dobInputRef.current?.showPicker?.();
                      } catch {
                        dobInputRef.current?.focus();
                      }
                    }}
                    className={`relative rounded-xl border cursor-pointer ${
                      getErrorMessage('dateOfBirth')
                        ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                        : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                    } bg-white dark:bg-slate-800 transition-all`}
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
                  {getErrorMessage('dateOfBirth') && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">
                      {getErrorMessage('dateOfBirth')}
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
                    {GENDER_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center justify-center py-2 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          watch('gender') === opt
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600 font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          value={opt}
                          {...register('gender')}
                          className="mr-1.5 text-blue-600 focus:ring-blue-500"
                        />
                        {opt}
                      </label>
                    ))}
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

          {/* ========================================================= */}
          {/* 3. EDUCATION & SHORT INTRO */}
          {/* ========================================================= */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2b7fff] dark:text-blue-400 mb-3.5">
              3. Education & Short Intro
            </h2>
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
                      : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                  } bg-white dark:bg-slate-800 transition-all`}
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
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all">
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
            </div>
          </div>

          {/* ========================================================= */}
          {/* EXTRA: 4. TECHNICAL SKILLS & STACK (CANDIDATE ONLY) */}
          {/* When Recruiter is selected, this section is completely hidden */}
          {/* ========================================================= */}
          {selectedRole === ROLES.CANDIDATE && (
            <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-slate-800/40 border border-blue-100 dark:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#2b7fff] dark:text-blue-400">
                    4. Technical Skills & Technologies
                  </h2>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Candidate Only
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                Select your core languages, frameworks, databases, and tools to match with recruiters:
              </p>

              {/* Selected Skills Chips */}
              {selectedSkills.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 capitalize"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className="ml-1.5 text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Custom Skill Input */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950">
                  <input
                    type="text"
                    placeholder="Type a skill and press enter (e.g. Next.js, Kafka, Flutter)..."
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={handleAddCustomSkill}
                    className="w-full bg-transparent px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </button>
              </div>

              {/* Preset Skills Category Accordions / Chips */}
              <div className="space-y-3">
                {Object.entries(PRESET_SKILLS).map(([category, skills]) => (
                  <div key={category}>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
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
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-600 hover:bg-blue-50/50 dark:hover:bg-slate-700'
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

          {/* ========================================================= */}
          {/* SECURITY & CREDENTIALS */}
          {/* ========================================================= */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2b7fff] dark:text-blue-400 mb-3.5">
              {selectedRole === ROLES.CANDIDATE ? '5. ' : '4. '}Security & Credentials
            </h2>
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
                        : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                    } bg-white dark:bg-slate-800 transition-all`}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      {...register('password')}
                      onChange={(e) => {
                        register('password').onChange(e);
                        if (!e.target.value || e.target.value.trim() === '') {
                          clearErrors('password');
                        }
                      }}
                      className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                        : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950'
                    } bg-white dark:bg-slate-800 transition-all`}
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
                        }
                      }}
                      className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Privacy Agreement */}
          <div className="pt-2">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                {...register('agreeTerms')}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="ml-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none"
              >
                I agree to the{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Terms of Service & Privacy Policy
                </a>{' '}
                <span className="text-red-500">*</span>
              </label>
            </div>
            {getErrorMessage('agreeTerms') && (
              <p className="mt-1 text-[11px] text-red-500 font-medium">
                {getErrorMessage('agreeTerms')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormComplete || isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                !isFormComplete || isSubmitting
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <span>Creating Account...</span>
              ) : (
                <span className="flex items-center">
                  Create Account <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </button>
            {!isFormComplete && (
              <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                Please complete all required fields (*) to enable registration.
              </p>
            )}
          </div>

          {/* Bottom Login Link */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
