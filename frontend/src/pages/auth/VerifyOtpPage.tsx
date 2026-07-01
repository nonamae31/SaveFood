import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { useVerifyOtp, useResendOtp } from '@/hooks/useAuth';

export function VerifyOtpPage() {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;
  const autoSend = location.state?.autoSend as boolean | undefined;
  const hasAutoSent = useRef(false);

  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  useEffect(() => {
    if (!email) {
      // Nếu không có email (truy cập trực tiếp), quay lại đăng ký
      navigate(ROUTES.REGISTER);
    } else if (autoSend && !hasAutoSent.current) {
      hasAutoSent.current = true;
      resendMutation.mutate({ email }, {
        onSuccess: () => {
          setSuccess('Đã tự động gửi mã OTP mới tới email của bạn.');
        },
        onError: (err: Error) => {
          setError(err.message || 'Không thể tự động gửi mã. Hãy bấm Gửi lại.');
        }
      });
    }
  }, [email, navigate, autoSend]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifySubmit = (code: string) => {
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP.');
      return;
    }

    if (email) {
      verifyMutation.mutate({ email, otpCode: code }, {
        onSuccess: () => {
          navigate(ROUTES.LOGIN, { state: { message: 'Xác nhận email thành công. Vui lòng đăng nhập!' } });
        },
        onError: (err: Error) => {
          setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
        }
      });
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifySubmit(otpValues.join(''));
  };

  const handleChange = (index: number, value: string) => {
    const newValue = value.replace(/[^0-9]/g, '');
    if (!newValue) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    const digit = newValue.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      handleVerifySubmit(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    if (nextFocusIndex < 6) {
      inputRefs.current[nextFocusIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }

    if (pastedData.length === 6) {
      handleVerifySubmit(pastedData);
    }
  };

  const handleResend = () => {
    if (!canResend || !email) return;
    
    setError('');
    setSuccess('');
    
    resendMutation.mutate({ email }, {
      onSuccess: () => {
        setSuccess('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
        setCountdown(60);
        setCanResend(false);
        setOtpValues(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      },
      onError: (err: Error) => {
        setError(err.message || 'Không thể gửi lại mã lúc này. Hãy thử lại sau.');
      }
    });
  };

  const isComplete = otpValues.join('').length === 6;

  return (
    <div className="min-h-screen flex w-full bg-surface-muted relative">
      <Link 
        to={ROUTES.REGISTER} 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-ink-secondary hover:text-brand-600 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại Đăng ký</span>
      </Link>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="mx-auto w-full max-w-md bg-surface-base p-8 sm:p-10 rounded-2xl shadow-card border border-surface-border">
          <div className="mb-8 text-center">
            <h1 className="mt-4 text-heading-lg font-bold text-ink-primary">
              Xác thực tài khoản
            </h1>
            <p className="mt-2 text-body-md text-ink-secondary">
              Vui lòng nhập mã OTP 6 số đã được gửi tới email <br/>
              <span className="font-medium text-ink-primary">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="flex justify-center gap-2 sm:gap-3 mb-6">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-heading-md font-bold text-ink-primary border border-surface-border rounded-xl bg-surface-base focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                  value={value}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  required
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md text-expiry-urgent text-body-sm text-center">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-brand-50 border border-brand-100 rounded-md text-brand-700 text-body-sm text-center">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-4 shadow-dropdown"
              size="lg"
              isLoading={verifyMutation.isPending}
              disabled={!isComplete}
            >
              Xác nhận
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-sm text-ink-secondary mb-2">
              Chưa nhận được mã?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || resendMutation.isPending}
              isLoading={resendMutation.isPending}
            >
              {canResend ? 'Gửi lại mã' : `Gửi lại sau ${countdown}s`}
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative flex-1 bg-brand-900">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
          alt="Fresh groceries background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <h2 className="text-display-lg font-display font-bold leading-tight mb-4 max-w-lg drop-shadow-lg">
            "Sắp hoàn tất rồi!"
          </h2>
          <p className="text-body-lg text-gray-200 max-w-md drop-shadow-md">
            Xác thực email để bắt đầu giải cứu thức ăn ngay hôm nay.
          </p>
        </div>
      </div>
    </div>
  );
}
