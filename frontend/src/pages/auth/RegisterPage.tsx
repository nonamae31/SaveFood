import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { useRegister, useGoogleLoginMutation } from '@/hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLoginMutation();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setError('');
      googleLoginMutation.mutate(
        { token: codeResponse.access_token },
        {
          onSuccess: () => {
            navigate(ROUTES.HOME);
          },
          onError: (err: any) => {
            setError(err.message || 'Đăng nhập Google thất bại.');
          }
        }
      );
    },
    onError: (error) => {
      console.error('Google Login Failed', error);
      setError('Lỗi khi kết nối với Google.');
    }
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username) newErrors.username = 'Username là bắt buộc';
    else if (username.length < 3 || username.length > 20) newErrors.username = 'Username phải từ 3-20 ký tự';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = 'Username chỉ chứa chữ cái, số và dấu gạch dưới';

    if (!email) newErrors.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';

    if (!password) newErrors.password = 'Mật khẩu là bắt buộc';
    else if (password.length < 8) newErrors.password = 'Mật khẩu phải ít nhất 8 ký tự';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(password)) {
      newErrors.password = 'Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu và Nhập lại mật khẩu không khớp';
    }

    if (!fullName) newErrors.fullName = 'Họ và tên là bắt buộc';
    if (!phoneNumber) newErrors.phoneNumber = 'Số điện thoại là bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setErrors({});
    
    if (!validateForm()) return;

    registerMutation.mutate({ username, email, password, fullName, phoneNumber }, {
      onSuccess: () => {
        // Chuyển hướng sang trang nhập OTP và truyền email theo
        navigate(ROUTES.VERIFY_OTP, { state: { email } });
      },
      onError: (err: any) => {
        setGlobalError(err.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
      }
    });
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

      {/* Cột trái: Form Đăng ký */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative z-10 py-12">
        <div className="mx-auto w-full max-w-md bg-surface-base p-8 sm:p-10 rounded-2xl shadow-card border border-surface-border">
          
          <div className="mb-8 text-center">
            <Link to={ROUTES.HOME} className="inline-block">
              <span className="text-heading-xl font-bold font-display text-brand-600">
                SaveFood
              </span>
            </Link>
            <h1 className="mt-4 text-heading-lg font-bold text-ink-primary">
              Tạo tài khoản mới
            </h1>
            <p className="mt-2 text-body-md text-ink-secondary">
              Tham gia cùng chúng tôi để giải cứu thức ăn mỗi ngày.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                id="username"
                type="text"
                label="Username"
                placeholder="Ví dụ: nguyenvana_123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <Input
                id="fullName"
                type="text"
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Input
                id="phoneNumber"
                type="tel"
                label="Số điện thoại"
                placeholder="0912345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <Input
                id="password"
                type="password"
                label="Mật khẩu"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <Input
                id="confirmPassword"
                type="password"
                label="Xác nhận mật khẩu"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {globalError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md text-expiry-urgent text-body-sm">
                {globalError}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-6 shadow-dropdown"
              size="lg"
              isLoading={registerMutation.isPending}
            >
              Đăng ký
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <div className="relative flex justify-center text-body-sm">
                <span className="bg-surface-base px-2 text-ink-secondary">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                type="button"
                variant="outline" 
                className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                size="lg"
                isLoading={googleLoginMutation.isPending}
                onClick={() => handleGoogleLogin()}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center text-body-sm text-ink-secondary">
            Bạn đã có tài khoản?{' '}
            <Link 
              to={ROUTES.LOGIN} 
              className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Đăng nhập ngay
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <h2 className="text-display-lg font-display font-bold leading-tight mb-4 max-w-lg drop-shadow-lg">
            "Mỗi phần ăn được cứu là một phần trái đất được bảo vệ."
          </h2>
          <p className="text-body-lg text-gray-200 max-w-md drop-shadow-md">
            Hãy bắt đầu hành trình của bạn ngay hôm nay cùng SaveFood!
          </p>
        </div>
      </div>

    </div>
  );
}
