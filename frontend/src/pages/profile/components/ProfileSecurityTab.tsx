import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChangePassword, useForgotPassword, useResetPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ProfileSecurityTab() {
  const { user } = useAuthContext();
  
  const changePasswordMutation = useChangePassword();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  
  const [showOtpForm, setShowOtpForm] = useState(false);

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
          window.location.reload(); 
        },
        onError: (err: Error) => setPassErrorMsg(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.')
      }
    );
  };

  return (
    <div className="bg-white shadow-[--shadow-card] rounded-2xl overflow-hidden" data-testid="profile-security-tab">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-6">Bảo mật tài khoản</h2>
        
        {passSuccessMsg && (
          <div className="mb-6 p-4 bg-brand-50 border border-brand-100 text-brand-700 rounded-xl text-sm font-medium">
            {passSuccessMsg}
          </div>
        )}
        
        {passErrorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
            {passErrorMsg}
          </div>
        )}

        {user?.hasPassword ? (
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
          <div className="max-w-md">
            {!showOtpForm ? (
              <div className="space-y-5">
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Tài khoản của bạn hiện đang liên kết với Google và chưa có mật khẩu riêng. Bạn có muốn thiết lập mật khẩu để có thể đăng nhập bằng Email không?
                  </p>
                </div>
                <Button 
                  type="button" 
                  onClick={handleSendOtp} 
                  isLoading={forgotPasswordMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Gửi mã OTP qua Email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSetNewPasswordWithOtp} className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-100">
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

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button type="submit" isLoading={resetPasswordMutation.isPending} className="flex-1">
                    Thiết lập mật khẩu
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowOtpForm(false)} className="flex-1 sm:flex-none">
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
