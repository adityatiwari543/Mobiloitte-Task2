import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-react';
import { PasswordStrengthMeter } from './register/PasswordStrengthMeter.js';

export interface ForgotPasswordCardProps {
  step: 'email' | 'otp' | 'new_password' | 'success';
  onStepChange: (step: 'email' | 'otp' | 'new_password' | 'success') => void;
  email: string;
  onEmailChange: (val: string) => void;
  maskedEmail: string;
  digits: string[];
  onDigitChange: (index: number, val: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  isOtpComplete: boolean;
  password: string;
  onPasswordChange: (val: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  isPasswordValid: boolean;
  passwordsMatch: boolean;
  passwordError: string | null;
  confirmPasswordError: string | null;
  error: string | null;
  onClearError: () => void;
  successMsg: string | null;
  onClearSuccessMsg: () => void;
  isLoading: boolean;
  cooldown: number;
  resending: boolean;
  redirectCountdown: number;
  onRequestOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
  onResendOtp: () => void;
  onResetPassword: (e: React.FormEvent) => void;
  onNavigateLogin: () => void;
  className?: string;
}

export const ForgotPasswordCard: React.FC<ForgotPasswordCardProps> = ({
  step,
  onStepChange,
  email,
  onEmailChange,
  maskedEmail,
  digits,
  onDigitChange,
  onKeyDown,
  onPaste,
  inputRefs,
  isOtpComplete,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  isPasswordValid,
  passwordsMatch,
  passwordError,
  confirmPasswordError,
  error,
  onClearError,
  successMsg,
  onClearSuccessMsg,
  isLoading,
  cooldown,
  resending,
  redirectCountdown,
  onRequestOtp,
  onVerifyOtp,
  onResendOtp,
  onResetPassword,
  onNavigateLogin,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Stepper metadata
  const stepsList = [
    { key: 'email', label: '1. Email' },
    { key: 'otp', label: '2. Verify OTP' },
    { key: 'new_password', label: '3. New Password' },
  ];

  const currentStepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : step === 'new_password' ? 2 : 3;

  return (
    <div
      className={`w-full max-w-[430px] bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-purple-500/5 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all ${className}`}
    >
      {/* Top Step Progress Bar (Shown during Steps 1-3) */}
      {step !== 'success' && (
        <div className="flex items-center justify-between mb-5 px-1">
          {stepsList.map((item, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <React.Fragment key={item.key}>
                <div className="flex items-center space-x-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/30 ring-2 ring-purple-100 dark:ring-purple-950'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.label.split('. ')[1]}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                      idx < currentStepIndex
                        ? 'bg-emerald-400 dark:bg-emerald-600'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Top Shield/Key Badge Icon (Centered) */}
      <div className="flex justify-center mb-3">
        {step === 'email' && (
          <div className="w-10 h-10 rounded-2xl bg-purple-100/90 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs border border-purple-200/60 dark:border-purple-800/60">
            <KeyRound className="w-5 h-5" />
          </div>
        )}
        {step === 'otp' && (
          <div className="w-10 h-10 rounded-2xl bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs border border-indigo-200/60 dark:border-indigo-800/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
        )}
        {step === 'new_password' && (
          <div className="w-10 h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs border border-blue-200/60 dark:border-blue-800/60">
            <Lock className="w-5 h-5" />
          </div>
        )}
        {step === 'success' && (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Heading & Subtitle (Centered) */}
      <div className="text-center mb-6">
        {step === 'email' && (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Forgot Password?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              Enter your email to receive a 6-digit verification code
            </p>
          </>
        )}
        {step === 'otp' && (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Verify OTP Code
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
              We sent a code to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {maskedEmail || email}
              </span>
              <button
                type="button"
                onClick={() => {
                  onStepChange('email');
                  onClearError();
                  onClearSuccessMsg();
                }}
                className="ml-2 text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
              >
                (Change)
              </button>
            </p>
          </>
        )}
        {step === 'new_password' && (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              Choose a strong, unique password to secure your account
            </p>
          </>
        )}
        {step === 'success' && (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Password Changed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              Your password has been reset successfully. You can now sign in.
            </p>
          </>
        )}
      </div>

      {/* Success Notice Banner */}
      {successMsg && !error && (
        <div
          role="status"
          className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={onClearSuccessMsg}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 ml-2 cursor-pointer p-0.5"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Server Error Alert Banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2 cursor-pointer p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: EMAIL INPUT */}
      {/* ========================================================================= */}
      {step === 'email' && (
        <form onSubmit={onRequestOtp} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/90 focus-within:border-purple-600 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  onEmailChange(e.target.value);
                  if (error) onClearError();
                }}
                className="w-full pl-10 pr-3.5 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send Verification OTP</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: OTP VERIFICATION */}
      {/* ========================================================================= */}
      {step === 'otp' && (
        <form onSubmit={onVerifyOtp} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
              6-Digit Verification Code <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center gap-2" onPaste={onPaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => onKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/90 focus:border-purple-600 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all shadow-2xs"
                />
              ))}
            </div>

            {/* Resend Link & Timer */}
            <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              {cooldown > 0 ? (
                <span>
                  Resend code in <strong className="text-purple-600 dark:text-purple-400">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={resending}
                  className="inline-flex items-center text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${resending ? 'animate-spin' : ''}`} />
                  Resend OTP Code
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isOtpComplete || isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify & Proceed</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => onStepChange('email')}
              className="inline-flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Change Email
            </button>
            <Link
              to="/login"
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CREATE NEW PASSWORD */}
      {/* ========================================================================= */}
      {step === 'new_password' && (
        <form onSubmit={onResetPassword} className="space-y-4" noValidate>
          {/* New Password */}
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <div
              className={`relative rounded-xl border ${
                passwordError
                  ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                  : 'border-slate-300 dark:border-slate-700 focus-within:border-purple-600 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20'
              } bg-slate-50/50 dark:bg-slate-900/90 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-2xs`}
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new strong password"
                value={password}
                onChange={(e) => {
                  onPasswordChange(e.target.value);
                  if (error) onClearError();
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Real-time Password Strength Meter */}
            <PasswordStrengthMeter password={password} />

            {passwordError && (
              <p className="mt-1 text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div
              className={`relative rounded-xl border ${
                confirmPasswordError
                  ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-950'
                  : 'border-slate-300 dark:border-slate-700 focus-within:border-purple-600 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20'
              } bg-slate-50/50 dark:bg-slate-900/90 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-2xs`}
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  onConfirmPasswordChange(e.target.value);
                  if (error) onClearError();
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {confirmPasswordError && (
              <p className="mt-1 text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
                {confirmPasswordError}
              </p>
            )}

            {confirmPassword.length > 0 && passwordsMatch && (
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center animate-in fade-in duration-150">
                <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || !passwordsMatch || isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Confirm & Reset Password</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              to="/login"
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-colors"
            >
              Cancel and return to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SUCCESS CONFIRMATION */}
      {/* ========================================================================= */}
      {step === 'success' && (
        <div className="text-center py-2 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your credentials have been securely updated. You can now use your new password to sign into JobConnect.
          </p>

          <button
            type="button"
            onClick={onNavigateLogin}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Redirecting automatically in <strong className="text-purple-600 dark:text-purple-400">{redirectCountdown}s</strong>...
          </p>
        </div>
      )}
    </div>
  );
};
