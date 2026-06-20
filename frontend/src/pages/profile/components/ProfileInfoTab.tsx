import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ProfileInfoTab() {
  const { user } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="bg-white shadow-[--shadow-card] rounded-2xl overflow-hidden" data-testid="profile-info-tab">
      <div className="bg-brand-50 px-6 sm:px-8 py-6 border-b border-brand-100 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
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
          <h2 className="text-2xl font-bold text-ink-primary">{user?.fullName}</h2>
          <p className="text-body-sm text-ink-secondary">{user?.email}</p>
          <p className="text-xs text-ink-tertiary mt-1 bg-white inline-block px-2 py-0.5 rounded-full border border-gray-100">
            Vai trò: {user?.roles?.join(', ')}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold mb-6">Chỉnh sửa thông tin</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          <Input
            id="email"
            label="Địa chỉ Email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50 text-ink-secondary"
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
            <div className="p-3 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg text-sm font-medium">
              {successMsg}
            </div>
          )}
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
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
  );
}
