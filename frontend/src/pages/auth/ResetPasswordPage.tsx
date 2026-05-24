import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { useResetPassword, useForgotPassword } from '@/hooks/useAuth';

export function ResetPasswordPage() {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const resetPasswordMutation = useResetPassword();
  const forgotPasswordMutation = useForgotPassword();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  // Nếu không có email (người dùng gõ trực tiếp URL), đẩy về trang Quên mật khẩu
  if (!email) {
    return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!otpCode || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    resetPasswordMutation.mutate({ email, otpCode, newPassword }, {
      onSuccess: () => {
        // Chuyển hướng sang trang Login với thông báo
        navigate(ROUTES.LOGIN, { 
          state: { message: 'Khôi phục mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' } 
        });
      },
      onError: (err: any) => {
        setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    });
  };

  const handleResendOtp = () => {
    setError('');
    setMessage('');
    forgotPasswordMutation.mutate({ email }, {
      onSuccess: () => {
        setMessage('Mã khôi phục mới đã được gửi đến email của bạn.');
      },
      onError: (err: any) => {
        setError(err.message || 'Lỗi khi gửi lại mã OTP.');
      }
    });
  };

  return (
    <div className="min-h-screen flex w-full bg-surface-muted relative">
      
      {/* Nút Back to Forgot Password */}
      <Link 
        to={ROUTES.FORGOT_PASSWORD} 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-ink-secondary hover:text-brand-600 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại</span>
      </Link>

      {/* Cột trái: Form Reset */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="mx-auto w-full max-w-md bg-surface-base p-8 sm:p-10 rounded-2xl shadow-card border border-surface-border">
          
          <div className="mb-8 text-center">
            <Link to={ROUTES.HOME} className="inline-block">
              <span className="text-heading-xl font-bold font-display text-brand-600">
                SaveFood
              </span>
            </Link>
            <h1 className="mt-4 text-heading-lg font-bold text-ink-primary">
              Tạo mật khẩu mới
            </h1>
            <p className="mt-2 text-body-md text-ink-secondary">
              Vui lòng nhập mã gồm 6 chữ số được gửi đến email <br/>
              <span className="font-semibold text-ink-primary">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="otpCode"
              type="text"
              label="Mã xác nhận (OTP)"
              placeholder="Nhập mã 6 số"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              required
            />

            <Input
              id="newPassword"
              type="password"
              label="Mật khẩu mới"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Xác nhận mật khẩu mới"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md text-expiry-urgent text-body-sm">
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-3 bg-brand-50 border border-brand-100 rounded-md text-brand-700 text-body-sm">
                {message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-4 shadow-dropdown"
              size="lg"
              isLoading={resetPasswordMutation.isPending}
            >
              Cập nhật mật khẩu
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-sm text-ink-secondary mb-2">
              Chưa nhận được email?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={forgotPasswordMutation.isPending}
              onClick={handleResendOtp}
            >
              Gửi lại mã
            </Button>
          </div>

        </div>
      </div>

      {/* Cột phải: Hình ảnh Cover */}
      <div className="hidden lg:block relative flex-1 bg-brand-900">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
          alt="Fresh groceries background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <h2 className="text-display-lg font-display font-bold leading-tight mb-4 max-w-lg drop-shadow-lg">
            "Mỗi phần ăn được cứu là một phần trái đất được bảo vệ."
          </h2>
          <p className="text-body-lg text-gray-200 max-w-md drop-shadow-md">
            Hàng ngàn cửa hàng và siêu thị đang chờ bạn giải cứu những thực phẩm tươi ngon mỗi ngày.
          </p>
        </div>
      </div>

    </div>
  );
}
