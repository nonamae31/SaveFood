import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile, useChangePassword, useForgotPassword, useResetPassword } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, ClipboardList, Store, Clock, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/api/store.api';
import dayjs from 'dayjs';
import { useDropzone } from 'react-dropzone';

function InlineEditableInput({
  id,
  label,
  value,
  type = 'text',
  onSave,
  disabled = false,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  type?: string;
  onSave?: (val: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLocalValue(value);
  }, [value]);

  const handleBlur = async () => {
    if (disabled || !onSave) return;
    if (localValue === value) return; // no change
    setStatus('saving');
    try {
      await onSave(localValue);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (_error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      setLocalValue(value); // revert on error
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        label={label}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled || status === 'saving'}
        className={className}
      />
      {/* Indicator */}
      <div className="absolute right-3 top-9 flex items-center justify-center pointer-events-none">
        {status === 'saving' && <Loader2 className="animate-spin text-[--color-brand-600]" size={18} />}
        {status === 'success' && <CheckCircle className="text-green-500" size={18} />}
        {status === 'error' && <XCircle className="text-red-500" size={18} />}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthContext();
  
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();
  
  // Profile State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  
  const [showOtpForm, setShowOtpForm] = useState(false);

  // Fetch Store Registrations
  const { data: myRegistrations, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['myStoreRegistrations'],
    queryFn: storeApi.getMyRegistrations
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const onDropAvatar = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && user) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      setIsUploadingAvatar(true);
      setErrorMsg('');
      
      updateProfileMutation.mutate(
        { fullName: user.fullName, avatarFile: file },
        {
          onSettled: () => setIsUploadingAvatar(false),
          onError: (err) => {
             console.error(err);
             setAvatarUrl(user.avatarUrl || ''); // revert on error
             setErrorMsg('Lỗi khi tải ảnh lên.');
          }
        }
      );
    }
  }, [user, updateProfileMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAvatar,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false
  });

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleSaveField = async (field: 'fullName' | 'phoneNumber', val: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!user) return reject(new Error('User not found'));
      updateProfileMutation.mutate(
        {
          fullName: field === 'fullName' ? val : user.fullName,
          phoneNumber: field === 'phoneNumber' ? val : (user.phoneNumber || ''),
        },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        }
      );
    });
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
          <div 
            {...getRootProps()} 
            className={`relative group w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm flex-shrink-0 cursor-pointer ${isDragActive ? 'ring-2 ring-[--color-brand-500]' : ''}`}
          >
            <input {...getInputProps()} />
            {isUploadingAvatar ? (
              <div className="w-full h-full bg-black/20 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-500 flex items-center justify-center text-white text-heading-xl font-bold">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            {!isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium text-center px-1">Thay đổi</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-ink-primary">{user?.fullName}</h1>
            <p className="text-body-sm text-ink-secondary">{user?.email} • Vai trò: {user?.roles?.join(', ')}</p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="px-8 py-4 bg-white border-b border-gray-100 flex gap-4">
          <button 
            onClick={() => navigate(ROUTES.MY_WALLET)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors"
          >
            <Wallet size={18} /> Ví SaveFood (🚧)
          </button>
          <button 
            onClick={() => navigate(ROUTES.MY_ORDERS)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ClipboardList size={18} /> Đơn mua của tôi
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-heading-md font-bold mb-6">Thông tin cá nhân</h2>
          
          <div className="space-y-5">
            <InlineEditableInput
              id="email"
              label="Địa chỉ Email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-surface-muted text-ink-secondary"
            />

            <InlineEditableInput
              id="fullName"
              label="Họ và tên"
              type="text"
              value={user?.fullName || ''}
              onSave={(val) => handleSaveField('fullName', val)}
            />

            <InlineEditableInput
              id="phoneNumber"
              label="Số điện thoại"
              type="tel"
              value={user?.phoneNumber || ''}
              onSave={(val) => handleSaveField('phoneNumber', val)}
            />
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-expiry-urgent rounded-md text-body-sm">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: ĐƠN ĐĂNG KÝ CỬA HÀNG */}
      <div className="bg-[--color-surface-base] shadow-[--shadow-card] rounded-[1.5rem] overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-md font-bold flex items-center gap-2">
              <Store className="text-brand-600" /> Cửa hàng của tôi
            </h2>
            <button 
              onClick={() => navigate(ROUTES.STORE_REGISTER)}
              className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-sm"
            >
              + Đăng ký mới
            </button>
          </div>

          {isLoadingRegistrations ? (
            <div className="text-center text-gray-500 py-4">Đang tải...</div>
          ) : !myRegistrations || myRegistrations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-500 mb-2">Bạn chưa đăng ký cửa hàng nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRegistrations.map((reg) => (
                <div key={reg.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{reg.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{reg.detailedAddress}</p>
                    </div>
                    <div>
                      {reg.status === 0 && <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm font-bold"><Clock size={16} /> Chờ duyệt</span>}
                      {reg.status === 1 && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-bold"><CheckCircle size={16} /> Đã duyệt</span>}
                      {reg.status === 2 && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-bold"><XCircle size={16} /> Bị từ chối</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-xs text-gray-400">Đăng ký lúc: {dayjs(reg.createdAt).format('HH:mm DD/MM/YYYY')}</span>
                    {reg.status === 1 && (
                      <button 
                        onClick={() => navigate(ROUTES.DASHBOARD)}
                        className="text-sm text-brand-600 font-bold hover:underline"
                      >
                        Vào Dashboard &rarr;
                      </button>
                    )}
                  </div>
                  {reg.status === 2 && reg.rejectReason && (
                    <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                      <strong>Lý do từ chối:</strong> {reg.rejectReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

