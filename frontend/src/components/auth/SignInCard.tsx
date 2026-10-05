import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UseFormReturn } from 'react-hook-form';
import { LoginInput } from '@jobconnect/shared';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface SignInCardProps {
  form: UseFormReturn<LoginInput>;
  onSubmit: (data: LoginInput) => Promise<void>;
  serverError: string | null;
  onClearServerError: () => void;
  successNotice: string | null;
  onClearSuccessNotice: () => void;
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
  className?: string;
}

export const SignInCard: React.FC<SignInCardProps> = ({
  form,
  onSubmit,
  serverError,
  onClearServerError,
  successNotice,
  onClearSuccessNotice,
  rememberMe,
  onRememberMeChange,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form;

  const emailValue = watch('email') || '';
  const passwordValue = watch('password') || '';
  const isFormValid = emailValue.trim().length > 0 && passwordValue.length >= 6;

  // Helper to determine field error visibility cleanly (Rule 56)
  const getFieldError = (fieldName: 'email' | 'password') => {
    if (!errors[fieldName]) return null;
    if (fieldName === 'email' && !emailValue.trim()) return null;
    if (fieldName === 'password' && !passwordValue) return null;
    if (activeField && activeField !== fieldName) return null;
    return errors[fieldName]?.message;
  };

  const { ref: emailRef, ...emailRegister } = register('email', {
    onChange: (e) => {
      if (!e.target.value.trim()) {
        clearErrors('email');
      }
    },
  });

  const { ref: passwordRef, ...passwordRegister } = register('password', {
    onChange: (e) => {
      if (!e.target.value) {
        clearErrors('password');
      }
    },
  });

  const handleSocialClick = (provider: string) => {
    setSocialNotice(`${provider} authentication is coming soon. Please sign in with your email & password.`);
    setTimeout(() => setSocialNotice(null), 5000);
  };

  return (
    <div
      className={`w-full max-w-[430px] bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-purple-500/5 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all ${className}`}
    >
      {/* Top Shield Badge Icon (Centered) */}
      <div className="flex justify-center mb-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-100/90 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs border border-purple-200/60 dark:border-purple-800/60">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Heading & Subtitle (Centered) */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
          Sign in to continue to your account
        </p>
      </div>

      {/* Success Notice Banner (Rule 102) */}
      {successNotice && (
        <div
          role="status"
          className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={onClearSuccessNotice}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 ml-2 cursor-pointer p-0.5"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Server Error Alert Banner (Rule 57, 58) */}
      {serverError && (
        <div
          role="alert"
          className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-200"
        >
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-600 dark:text-red-400" />
            <span>{serverError}</span>
          </div>
          <button
            type="button"
            onClick={onClearServerError}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2 cursor-pointer p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Social Provider Notice */}
      {socialNotice && (
        <div
          role="status"
          className="mb-4 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in duration-200"
        >
          <span>{socialNotice}</span>
          <button
            type="button"
            onClick={() => setSocialNotice(null)}
            className="text-purple-500 hover:text-purple-700 ml-2 cursor-pointer p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form Area (Rule 60) */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Address Field (Rule 40, 41, 42, 43, 61) */}
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
              placeholder="name@example.com"
              aria-required="true"
              aria-invalid={!!getFieldError('email')}
              {...emailRegister}
              ref={emailRef}
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField(null)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
            />
          </div>
          {getFieldError('email') && (
            <p className="mt-1 text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
              {getFieldError('email')}
            </p>
          )}
        </div>

        {/* Password Field with Forgot Password aligned on same row (Rule 45, 46, 47) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <Link
              to={
                emailValue
                  ? `/forgot-password?email=${encodeURIComponent(emailValue)}`
                  : '/forgot-password'
              }
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/90 focus-within:border-purple-600 dark:focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-required="true"
              aria-invalid={!!getFieldError('password')}
              {...passwordRegister}
              ref={passwordRef}
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
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
          {getFieldError('password') && (
            <p className="mt-1 text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
              {getFieldError('password')}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox (Rule 48) */}
        <div className="flex items-center pt-0.5">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => onRememberMeChange(e.target.checked)}
            className="h-3.5 w-3.5 text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 rounded cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
          >
            Remember me on this device
          </label>
        </div>

        {/* Primary Action Button (Rule 49, 50, 51: blue -> purple gradient) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        {/* Divider - Perfectly Centered */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] font-medium">
            <span className="bg-white dark:bg-[#0F172A] px-3 text-slate-400 select-none">
              or
            </span>
          </div>
        </div>

        {/* Social Buttons - Side-by-Side (Rule 53, 54) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSocialClick('Google')}
            className="flex items-center justify-center py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27A7.19 7.19 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span className="truncate">Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialClick('GitHub')}
            className="flex items-center justify-center py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5 shrink-0 fill-current text-slate-800 dark:text-slate-200"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
              />
            </svg>
            <span className="truncate">Continue with GitHub</span>
          </button>
        </div>
      </form>

      {/* Footer Link (Rule 55) */}
      <div className="text-center mt-5 text-xs text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-colors"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
};
