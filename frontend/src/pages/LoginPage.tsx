import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput, ROLES } from '@jobconnect/shared';
import { useAuth } from '../context/AuthContext.js';
import { AuthBranding, SignInCard, HeroVisual } from '../components/auth/index.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // SEO / Page Title (Rule 103)
  useEffect(() => {
    document.title = 'Sign In | JobConnect';
  }, []);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const { setValue } = form;

  // Handle URL query parameters (e.g. email prefill or password reset success notice)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setValue('email', emailParam, { shouldValidate: true });
    }
    if (searchParams.get('reset') === 'success') {
      setSuccessNotice('Password reset successfully! Please sign in with your new password.');
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await login(data);

      // Handle 2FA / OTP Verification challenge (Rule 74)
      if (response.data?.pendingVerification) {
        navigate(
          `/verify-otp?userId=${response.data.userId}&email=${encodeURIComponent(
            response.data.email
          )}`
        );
        return;
      }

      // Check for preserved return URL or protected route redirect (Rule 64, 73)
      const fromLocation = (location.state as any)?.from?.pathname;
      if (fromLocation && !fromLocation.includes('/login') && !fromLocation.includes('/register')) {
        navigate(fromLocation, { replace: true });
        return;
      }

      // Automatically redirect based on user role from database (Rule 64)
      const userRole = response.data?.user?.role;
      if (userRole === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === ROLES.RECRUITER) {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/candidate/dashboard', { replace: true });
      }
    } catch (err: any) {
      // Account enumeration protection & friendly error messages (Rule 57, 58)
      if (err.response?.status === 429) {
        setServerError('Too many sign-in attempts. Please wait a few moments and try again.');
      } else if (!err.response || err.response.status >= 500) {
        setServerError('Unable to connect to the authentication server. Please try again shortly.');
      } else {
        setServerError(
          err.response?.data?.error?.message || 'Invalid email or password. Please try again.'
        );
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-[#FAF8FC] via-[#F8F6FD] to-[#F3F0FA] dark:from-[#090D1A] dark:via-[#0B1020] dark:to-[#090D1A] flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Subtle Ambient Glow Background Orbs (Rule 36, 37, 39) */}
      <div className="absolute top-12 left-1/4 w-[420px] h-[420px] bg-purple-500/8 dark:bg-purple-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 right-1/4 w-[480px] h-[480px] bg-indigo-500/8 dark:bg-indigo-600/12 rounded-full blur-3xl pointer-events-none" />

      {/* Main 3-Column SaaS Container matching Target Page Composition (Rule 6, 87, 88) */}
      <div className="max-w-[1380px] mx-auto w-full relative z-10 my-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-5 xl:gap-8">
          {/* Left Column: Brand Value Proposition & 4 Benefits (~31% width) */}
          <div className="w-full lg:w-[31%] xl:w-[30%] flex justify-center lg:justify-start">
            <AuthBranding />
          </div>

          {/* Center Column: Premium Sign In Card (~36% width) */}
          <div className="w-full lg:w-[36%] xl:w-[35%] flex justify-center">
            <SignInCard
              form={form}
              onSubmit={onSubmit}
              serverError={serverError}
              onClearServerError={() => setServerError(null)}
              successNotice={successNotice}
              onClearSuccessNotice={() => setSuccessNotice(null)}
              rememberMe={rememberMe}
              onRememberMeChange={setRememberMe}
            />
          </div>

          {/* Right Column: HeroVisual with Clean Image & Independent Floating Cards (~34-36% width - enlarged!) */}
          <div className="hidden lg:flex w-full lg:w-[33%] xl:w-[36%] justify-center lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </div>
    </div>
  );
};
