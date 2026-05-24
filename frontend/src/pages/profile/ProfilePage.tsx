import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAddress(user.address || '');
    }
  }, [user]);

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    updateProfileMutation.mutate(
      { fullName, phoneNumber, address },
      {
        onSuccess: () => setSuccessMsg('Cập nhật hồ sơ thành công!'),
        onError: (err: any) => setErrorMsg(err.message || 'Cập nhật thất bại. Vui lòng thử lại.')
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-surface-base shadow-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-50 px-8 py-6 border-b border-brand-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-brand-500 rounded-full flex items-center justify-center text-white text-heading-xl font-bold">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-ink-primary">{user?.fullName}</h1>
            <p className="text-body-sm text-ink-secondary">{user?.email} • Vai trò: {user?.roles?.join(', ')}</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-heading-md font-bold mb-6">Thông tin cá nhân</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <Input
              id="address"
              label="Địa chỉ giao hàng"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
