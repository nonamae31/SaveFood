import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { useForgotPassword } from '@/hooks/useAuth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const forgotPasswordMutation = useForgotPassword();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    forgotPasswordMutation.mutate({ email }, {
      onSuccess: () => {
        // Chuyển hướng sang trang Reset Password, truyền email qua state
        navigate(ROUTES.RESET_PASSWORD, { state: { email } });
      },
      onError: (err: any) => {
        setError(err.message || 'Có lỗi xảy ra khi gửi yêu cầu khôi phục mật khẩu.');
      }
    });
  };

  return (
    <div className="min-h-screen flex w-full bg-surface-muted relative">
      
      {/* Nút Back to Login floating */}
      <Link 
        to={ROUTES.LOGIN} 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-ink-secondary hover:text-brand-600 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại Đăng nhập</span>
      </Link>

      {/* Cột trái: Form Quên mật khẩu */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="mx-auto w-full max-w-md bg-surface-base p-8 sm:p-10 rounded-2xl shadow-card border border-surface-border">
          
          {/* Logo / Tên ứng dụng */}
          <div className="mb-8 text-center">
            <Link to={ROUTES.HOME} className="inline-block">
              <span className="text-heading-xl font-bold font-display text-brand-600">
                SaveFood
              </span>
            </Link>
            <h1 className="mt-4 text-heading-lg font-bold text-ink-primary">
              Khôi phục mật khẩu
            </h1>
            <p className="mt-2 text-body-md text-ink-secondary">
              Nhập email của bạn để nhận mã khôi phục mật khẩu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              isLoading={forgotPasswordMutation.isPending}
            >
              Gửi mã khôi phục
            </Button>
          </form>

        </div>
      </div>

      {/* Cột phải: Hình ảnh Cover */}
      <div className="hidden lg:block relative flex-1 bg-brand-900">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
          alt="Fresh groceries background"
        />
        {/* Lớp phủ gradient đen từ dưới lên để chữ hiển thị rõ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Quote overlay */}
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
