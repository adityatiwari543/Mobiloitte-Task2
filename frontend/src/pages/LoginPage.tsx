import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput, ROLES } from '@jobconnect/shared';
import { useAuth } from '../context/AuthContext.js';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setValue('email', emailParam, { shouldValidate: true });
    }
    if (searchParams.get('reset') === 'success') {
      setSuccessNotice('Password reset successfully! Please sign in with your new password.');
    }
  }, [searchParams, setValue]);

  const emailValue = watch('email') || '';
  const passwordValue = watch('password') || '';
  const isFormValid = emailValue.trim().length > 0 && passwordValue.length >= 6;

  // Auto-clear field error if user clears input completely
  useEffect(() => {
    if (!emailValue.trim()) {
      clearErrors('email');
    }
  }, [emailValue, clearErrors]);

  useEffect(() => {
    if (!passwordValue) {
      clearErrors('password');
    }
  }, [passwordValue, clearErrors]);

  // Helper to determine whether an error alert should be shown.
  // When a field is cleared/empty or user moves to fill another field, the alert turns off!
  const getFieldError = (fieldName: 'email' | 'password') => {
    if (!errors[fieldName]) return null;

    // If field is cleared/empty, turn off alert immediately
    if (fieldName === 'email' && !emailValue.trim()) return null;
    if (fieldName === 'password' && !passwordValue) return null;

    // If user is currently focused on the other field ("kuch aur fill karne chala jau"), turn off this alert
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

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await login(data);
      if (response.data?.pendingVerification) {
        navigate(
          `/verify-otp?userId=${response.data.userId}&email=${encodeURIComponent(
            response.data.email
          )}`
        );
        return;
      }

      // Automatically redirect based on user role from database
      const userRole = response.data?.user?.role;
      if (userRole === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else if (userRole === ROLES.RECRUITER) {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      if (!err.response || err.response.status >= 500) {
        setServerError('Cannot connect to backend server. Please ensure the backend server is running on port 5000.');
      } else {
        setServerError(
          err.response?.data?.error?.message || 'Invalid email or password.'
        );
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc] dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Main Form Center Card */}
      <div className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-8 sm:p-9 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
        {/* Top Login Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
            <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Heading and Subtitle */}
        <div className="text-center mb-7">
          <h1 className="text-3xl font-extrabold text-[#2b7fff] tracking-tight">
            Sign In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
            Access your personalized user profile and dashboard
          </p>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center justify-between">
            <span>{serverError}</span>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300 ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
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
                placeholder="name@example.com"
                {...emailRegister}
                ref={emailRef}
                onFocus={() => {
                  setActiveField('email');
                  clearErrors('password');
                }}
                onBlur={(e) => {
                  setActiveField(null);
                  if (!e.target.value.trim()) {
                    clearErrors('email');
                  }
                }}
                className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
              />
            </div>
            {getFieldError('email') && (
              <p className="mt-1 text-[11px] text-red-500 font-medium">
                {getFieldError('email')}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                to={emailValue ? `/forgot-password?email=${encodeURIComponent(emailValue)}` : '/forgot-password'}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...passwordRegister}
                ref={passwordRef}
                onFocus={() => {
                  setActiveField('password');
                  clearErrors('email');
                }}
                onBlur={(e) => {
                  setActiveField(null);
                  if (!e.target.value) {
                    clearErrors('password');
                  }
                }}
                className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {getFieldError('password') && (
              <p className="mt-1 text-[11px] text-red-500 font-medium">
                {getFieldError('password')}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center pt-0.5">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
            >
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
                  : 'bg-[#e2e8f0] dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span>Signing In...</span>
              ) : (
                <span className="flex items-center">
                  Sign In <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </span>
              )}
            </button>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2.5 font-normal">
              Please enter a valid email and password (min. 6 characters) to enable sign in
            </p>
          </div>

          {/* Bottom Register Link */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
