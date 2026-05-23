import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempt with:', { email, password });
      // Ở đây sau này sẽ gọi useAuth() hook
    }, 1500);
  };

  return (
    <div className="min-h-screen flex w-full bg-surface-muted relative">
      
      {/* Nút Back to Home floating */}
      <Link 
        to={ROUTES.HOME} 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-ink-secondary hover:text-brand-600 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Về trang chủ</span>
      </Link>

      {/* Cột trái: Form Đăng nhập */}
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
              Chào mừng trở lại
            </h1>
            <p className="mt-2 text-body-md text-ink-secondary">
              Đăng nhập để tiếp tục giải cứu thức ăn.
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
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-body-sm font-medium text-ink-primary" htmlFor="password">
                  Mật khẩu
                </label>
                <Link 
                  to={ROUTES.FORGOT_PASSWORD} 
                  className="text-body-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md text-expiry-urgent text-body-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-4 shadow-dropdown"
              size="lg"
              isLoading={isLoading}
            >
              Đăng nhập
            </Button>
          </form>

          <p className="mt-8 text-center text-body-sm text-ink-secondary">
            Bạn chưa có tài khoản?{' '}
            <Link 
              to={ROUTES.REGISTER} 
              className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
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
