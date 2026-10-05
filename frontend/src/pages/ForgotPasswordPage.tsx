import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, Sparkles, KeyRound } from 'lucide-react';
import { api } from '../lib/api.js';
import { AuthBranding, ForgotPasswordCard, HeroVisual } from '../components/auth/index.js';

const RECOVERY_BENEFITS = [
  {
    icon: ShieldCheck,
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/70 border-purple-200/80 dark:border-purple-800/60',
    title: 'Secure Account Recovery',
    description: 'Bank-grade OTP encryption protects your personal profile.',
  },
  {
    icon: Lock,
    iconColor: 'text-blue-600 dark:text-sky-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200/80 dark:border-blue-800/60',
    title: 'Instant Email Verification',
    description: 'Direct 6-digit one-time code with rapid delivery.',
  },
  {
    icon: Sparkles,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/60',
    title: 'Resume Career Journey',
    description: 'Regain instant access to your applications & matches.',
  },
  {
    icon: KeyRound,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200/80 dark:border-emerald-800/60',
    title: '24/7 Identity Protection',
    description: 'Real-time security auditing and session safeguards.',
  },
];

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Step 1: 'email' | Step 2: 'otp' | Step 3: 'new_password' | Step 4: 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'new_password' | 'success'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // SEO Page Title
  useEffect(() => {
    document.title = 'Reset Password | JobConnect';
  }, []);

  // Prefill email if provided in query param
  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  // Focus first input when moving to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto redirect on step 4 ('success')
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'success') {
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(`/login?reset=success&email=${encodeURIComponent(email)}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, navigate, email]);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Real-time password validation error
  const getPasswordError = () => {
    if (!password || password.trim() === '') return null;
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return 'Password must contain at least one letter, one number, and one special character (!@#$%^&*...).';
    }
    return null;
  };

  const getConfirmPasswordError = () => {
    if (!confirmPassword || confirmPassword.trim() === '') return null;
    if (confirmPassword !== password) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const passwordError = getPasswordError();
  const confirmPasswordError = getConfirmPasswordError();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      const data = response.data?.data;

      setMaskedEmail(data?.maskedEmail || email);
      setCooldown(60);
      setSuccessMsg(response.data?.message || 'A 6-digit OTP has been sent to your email.');
      setDigits(['', '', '', '', '', '']);
      setStep('otp');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to send OTP. Please check your email and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      await api.post('/auth/resend-otp', {
        identifier: email.trim().toLowerCase(),
        purpose: 'password_reset',
      });
      setCooldown(60);
      setSuccessMsg('A new OTP has been dispatched to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // OTP segmented inputs handling
  const handleDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const isOtpComplete = digits.every((d) => d !== '');

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });

      const token = response.data?.data?.resetToken;
      setResetToken(token);
      setSuccessMsg('Email verified successfully! Please enter your new password.');
      setStep('new_password');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Invalid or expired OTP code. Please verify the code and try again.'
      );
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and include letters, numbers, and symbols.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        resetToken: resetToken || undefined,
        otp: resetToken ? undefined : digits.join(''),
        password,
        confirmPassword,
      });

      setStep('success');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to reset password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-[#FAF8FC] via-[#F8F6FD] to-[#F3F0FA] dark:from-[#090D1A] dark:via-[#0B1020] dark:to-[#090D1A] flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Ambient Glow Background Orbs matching SignIn page */}
      <div className="absolute top-12 left-1/4 w-[420px] h-[420px] bg-purple-500/8 dark:bg-purple-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 right-1/4 w-[480px] h-[480px] bg-indigo-500/8 dark:bg-indigo-600/12 rounded-full blur-3xl pointer-events-none" />

      {/* Main 3-Column SaaS Container matching Target Page Composition */}
      <div className="max-w-[1380px] mx-auto w-full relative z-10 my-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-5 xl:gap-8">
          {/* Left Column: Security Value Proposition (~31% width) */}
          <div className="w-full lg:w-[31%] xl:w-[30%] flex justify-center lg:justify-start">
            <AuthBranding
              badgeText="Account Recovery"
              badgeIcon={ShieldCheck}
              titlePrimary="Reset your"
              titleHighlight="JobConnect"
              titleSecondary="password"
              subtitle="Safely recover access to your JobConnect profile, active job applications, and personalized recommendations."
              benefits={RECOVERY_BENEFITS}
            />
          </div>

          {/* Center Column: ForgotPasswordCard (~36% width) */}
          <div className="w-full lg:w-[36%] xl:w-[35%] flex justify-center">
            <ForgotPasswordCard
              step={step}
              onStepChange={setStep}
              email={email}
              onEmailChange={setEmail}
              maskedEmail={maskedEmail}
              digits={digits}
              onDigitChange={handleDigitChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              inputRefs={inputRefs}
              isOtpComplete={isOtpComplete}
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              isPasswordValid={isPasswordValid}
              passwordsMatch={passwordsMatch}
              passwordError={passwordError}
              confirmPasswordError={confirmPasswordError}
              error={error}
              onClearError={() => setError(null)}
              successMsg={successMsg}
              onClearSuccessMsg={() => setSuccessMsg(null)}
              isLoading={isLoading}
              cooldown={cooldown}
              resending={resending}
              redirectCountdown={redirectCountdown}
              onRequestOtp={handleRequestOtp}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={handleResendOtp}
              onResetPassword={handleResetPassword}
              onNavigateLogin={() =>
                navigate(`/login?reset=success&email=${encodeURIComponent(email)}`)
              }
            />
          </div>

          {/* Right Column: HeroVisual with Clean Image & Floating Cards (~34-36% width) */}
          <div className="hidden lg:flex w-full lg:w-[33%] xl:w-[36%] justify-center lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </div>
    </div>
  );
};
