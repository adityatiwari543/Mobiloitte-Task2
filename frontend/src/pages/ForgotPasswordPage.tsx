import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Real-time password validation error (matching Registration Page behavior)
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-9 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
        
        {/* Step 1: Email Input */}
        {step === 'email' && (
          <>
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="text-center mb-7">
              <h1 className="text-3xl font-extrabold text-[#2b7fff] tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                Enter your registered email address to receive a 6-digit verification code.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!email || isLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                    email && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
                      : 'bg-[#e2e8f0] dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <span>Sending Code...</span>
                  ) : (
                    <span className="flex items-center">
                      Send Verification OTP <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </span>
                  )}
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          </>
        )}

        {/* Step 2: OTP Verification Only */}
        {step === 'otp' && (
          <>
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="text-center mb-5">
              <h1 className="text-2xl font-extrabold text-[#2b7fff] tracking-tight">
                Verify OTP Code
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                We sent a 6-digit verification code to{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {maskedEmail || email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  (Change)
                </button>
              </p>
            </div>

            {successMsg && !error && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
                <span>{successMsg}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="text-emerald-500 hover:text-emerald-700 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6-digit OTP Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
                  6-Digit Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-10 h-12 text-center text-lg font-bold text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Resend link */}
                <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  {cooldown > 0 ? (
                    <span>
                      Resend code in <strong className="text-slate-700 dark:text-slate-300">{cooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${resending ? 'animate-spin' : ''}`} />
                      Resend OTP Code
                    </button>
                  )}
                </div>
              </div>

              {/* Verify OTP Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isOtpComplete || isLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                    isOtpComplete && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
                      : 'bg-[#e2e8f0] dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <span className="flex items-center">
                      Verify Code <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </span>
                  )}
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: New Password Input (Only shown after OTP is verified) */}
        {step === 'new_password' && (
          <>
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="text-center mb-5">
              <h1 className="text-2xl font-extrabold text-[#2b7fff] tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Your email has been verified. Enter your new password below.
              </p>
            </div>

            {successMsg && !error && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
                <span>{successMsg}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="text-emerald-500 hover:text-emerald-700 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border ${
                    passwordError
                      ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                      : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30'
                  } bg-white dark:bg-slate-800/80 transition-all`}
                >
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Red alert message when criteria not met */}
                {passwordError && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border ${
                    confirmPasswordError
                      ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                      : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30'
                  } bg-white dark:bg-slate-800/80 transition-all`}
                >
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">
                    {confirmPasswordError}
                  </p>
                )}
                {confirmPassword.length > 0 && passwordsMatch && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                    <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isPasswordValid || !passwordsMatch || isLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                    isPasswordValid && passwordsMatch && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
                      : 'bg-[#e2e8f0] dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <span>Updating Password...</span>
                  ) : (
                    <span className="flex items-center">
                      Confirm & Reset Password <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </span>
                  )}
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 4: Success Screen */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Password Changed!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your password has been successfully reset. Please sign in to your account with your new credentials.
            </p>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => navigate(`/login?reset=success&email=${encodeURIComponent(email)}`)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center transition-all cursor-pointer"
              >
                Sign In Now <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-normal">
              Redirecting to Sign In in {redirectCountdown}s...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
