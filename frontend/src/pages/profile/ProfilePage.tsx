import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile, useChangePassword, useForgotPassword, useResetPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthContext();
  
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  
  const [showOtpForm, setShowOtpForm] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    updateProfileMutation.mutate(
      { fullName, phoneNumber, avatarFile },
      {
        onSuccess: () => setSuccessMsg('Cập nhật hồ sơ thành công!'),
        onError: (err: Error) => setErrorMsg(err.message || 'Cập nhật thất bại. Vui lòng thử lại.')
      }
    );
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg('');
    setPassErrorMsg('');

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setPassErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    changePasswordMutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          setPassSuccessMsg('Đổi mật khẩu thành công!');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: (err: Error) => setPassErrorMsg(err.message || 'Lỗi khi đổi mật khẩu.')
      }
    );
  };

  const handleSendOtp = () => {
    setPassSuccessMsg('');
    setPassErrorMsg('');
    if (!user?.email) return;

    forgotPasswordMutation.mutate(
      { email: user.email },
      {
        onSuccess: () => {
          setShowOtpForm(true);
          setPassSuccessMsg('Đã gửi mã OTP đến email của bạn.');
        },
        onError: (err: Error) => setPassErrorMsg(err.message || 'Lỗi khi gửi OTP.')
      }
    );
  };

  const handleSetNewPasswordWithOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg('');
    setPassErrorMsg('');

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setPassErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    resetPasswordMutation.mutate(
      { email: user!.email, otpCode, newPassword },
      {
        onSuccess: () => {
          setPassSuccessMsg('Đã thiết lập mật khẩu thành công!');
          setShowOtpForm(false);
          setOtpCode('');
          setNewPassword('');
          setConfirmPassword('');
          // Refresh page or context to update user.hasPassword flag
          window.location.reload(); 
        },
        onError: (err: Error) => setPassErrorMsg(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.')
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div>
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[--color-ink-secondary] hover:text-[--color-brand-600] transition-colors font-medium text-sm mb-6"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-[3px] rounded-full bg-[--color-brand-500]"></div>
          <span className="text-sm font-medium text-[--color-brand-600] uppercase tracking-wider">Hồ sơ</span>
        </div>
        <h1 className="text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">Quản lý <span className="font-serif italic font-normal text-[--color-brand-600]">tài khoản</span></h1>
      </div>

      {/* SECTION: THÔNG TIN CÁ NHÂN */}
      <div className="bg-[--color-surface-base] shadow-[--shadow-card] rounded-[1.5rem] overflow-hidden">
        <div className="bg-brand-50 px-8 py-6 border-b border-brand-100 flex items-center gap-6">
          <div className="relative group w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm flex-shrink-0 cursor-pointer">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-500 flex items-center justify-center text-white text-heading-xl font-bold">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">Thay đổi</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Thay đổi ảnh đại diện"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onloadend = () => {
                  setAvatarUrl(reader.result as string);
                };
                reader.readAsDataURL(file);
                setAvatarFile(file);
              }}
            />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-ink-primary">{user?.fullName}</h1>
            <p className="text-body-sm text-ink-secondary">{user?.email} • Vai trò: {user?.roles?.join(', ')}</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-heading-md font-bold mb-6">Thông tin cá nhân</h2>
          
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <Input
              id="email"
              label="Địa chỉ Email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-surface-muted text-ink-secondary"
            />

            <Input
              id="fullName"
              label="Họ và tên"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              id="phoneNumber"
              label="Số điện thoại"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            {successMsg && (
              <div className="p-3 bg-brand-50 border border-brand-100 text-brand-700 rounded-md text-body-sm">
                {successMsg}
              </div>
            )}
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-expiry-urgent rounded-md text-body-sm">
                {errorMsg}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={updateProfileMutation.isPending}>
                Lưu thông tin
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION: ĐỔI MẬT KHẨU */}
      <div className="bg-[--color-surface-base] shadow-[--shadow-card] rounded-[1.5rem] overflow-hidden">
        <div className="p-8">
          <h2 className="text-heading-md font-bold mb-6">Bảo mật tài khoản</h2>
          
          {passSuccessMsg && (
            <div className="mb-6 p-3 bg-brand-50 border border-brand-100 text-brand-700 rounded-md text-body-sm">
              {passSuccessMsg}
            </div>
          )}
          
          {passErrorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-expiry-urgent rounded-md text-body-sm">
              {passErrorMsg}
            </div>
          )}

          {user?.hasPassword ? (
            // Form đổi mật khẩu cho người dùng đã có mật khẩu
            <form onSubmit={handleChangePasswordSubmit} className="space-y-5 max-w-md">
              <Input
                id="oldPassword"
                label="Mật khẩu hiện tại"
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />

              <Input
                id="newPassword"
                label="Mật khẩu mới"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                id="confirmPassword"
                label="Xác nhận mật khẩu mới"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="pt-2">
                <Button type="submit" isLoading={changePasswordMutation.isPending}>
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
          ) : (
            // Luồng tạo mật khẩu cho người dùng chưa có mật khẩu (e.g. đăng nhập qua Google)
            <div className="max-w-md">
              {!showOtpForm ? (
                <div className="space-y-4">
                  <p className="text-body-sm text-ink-secondary">
                    Tài khoản của bạn hiện đang liên kết với Google và chưa có mật khẩu riêng. Bạn có muốn thiết lập mật khẩu để có thể đăng nhập bằng Email không?
                  </p>
                  <Button 
                    type="button" 
                    onClick={handleSendOtp} 
                    isLoading={forgotPasswordMutation.isPending}
                  >
                    Gửi mã OTP qua Email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSetNewPasswordWithOtp} className="space-y-5">
                  <Input
                    id="otpCode"
                    label="Mã xác nhận (OTP)"
                    type="text"
                    placeholder="Nhập mã 6 số từ Email"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />

                  <Input
                    id="newPassword"
                    label="Mật khẩu mới"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  <Input
                    id="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <div className="pt-2 flex gap-3">
                    <Button type="submit" isLoading={resetPasswordMutation.isPending}>
                      Thiết lập mật khẩu
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowOtpForm(false)}>
                      Hủy
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
