import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { ShieldCheck, ArrowRight, RefreshCw, X } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyOtp } = useAuth();

  const userId = searchParams.get('userId') || '';
  const email = searchParams.get('email') || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer (Section 6A.38)
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digits (Section 6A.35)
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);

    // Auto-advance to next input
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
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await verifyOtp(userId || email, otpCode, 'email_verification');
      if (response.success) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid or expired OTP.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    try {
      await api.post('/auth/resend-otp', {
        identifier: userId || email,
        purpose: 'email_verification',
      });
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 flex justify-center items-center transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 text-center transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify your Email</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          We have dispatched a 6-digit security code to:
          <br />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{email || 'your registered email'}</span>
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-center">
            <X className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* 6-box Segmented OTP Inputs (Section 6A.35) */}
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
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
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all bg-white dark:bg-slate-800"
              />
            ))}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!isComplete || isLoading}
            className="w-full py-3"
          >
            Confirm & Access Portal <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          {/* Resend with 60s cooldown (Section 6A.38) */}
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
            {cooldown > 0 ? (
              <p>Resend code in <span className="font-bold text-slate-700 dark:text-slate-300">{cooldown}s</span></p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${resending ? 'animate-spin' : ''}`} />
                Resend Code Now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
