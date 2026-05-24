import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { useVerifyOtp, useResendOtp } from '@/hooks/useAuth';

export function VerifyOtpPage() {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  useEffect(() => {
    if (!email) {
      // Nếu không có email (truy cập trực tiếp), quay lại đăng ký
      navigate(ROUTES.REGISTER);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP.');
      return;
    }

    if (email) {
      verifyMutation.mutate({ email, otpCode }, {
        onSuccess: () => {
          navigate(ROUTES.LOGIN, { state: { message: 'Xác nhận email thành công. Vui lòng đăng nhập!' } });
        },
        onError: (err: any) => {
          setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
        }
      });
    }
  };

  const handleResend = () => {
    if (!canResend || !email) return;
    
    setError('');
    setSuccess('');
    
    resendMutation.mutate({ email }, {
      onSuccess: () => {
        setSuccess('Đã gửi lại mã OTP. Vui lòng kiểm tra email (hoặc console).');
        setCountdown(60);
        setCanResend(false);
      },
      onError: (err: any) => {
        setError(err.message || 'Không thể gửi lại mã lúc này. Hãy thử lại sau.');
      }
    });
  };

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
            <Input
              id="otpCode"
              type="text"
              label="Mã OTP"
              placeholder="123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />

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
              disabled={otpCode.length !== 6}
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
