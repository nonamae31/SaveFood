import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useAuth';
import { InlineEditableInput } from '@/components/ui/InlineEditableInput';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
export function ProfileInfoTab() {
  const { user } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [genderStatus, setGenderStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSaveField = async (field: 'fullName' | 'phoneNumber', val: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!user) return reject(new Error('User not found'));
      updateProfileMutation.mutate(
        {
          fullName: field === 'fullName' ? val : user.fullName,
          phoneNumber: field === 'phoneNumber' ? val : (user.phoneNumber || ''),
          gender: user.gender,
        },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        }
      );
    });
  };

  const handleSaveGender = (val: number) => {
    if (!user) return;
    try {
      const validGender = z.union([z.literal(0), z.literal(1)]).parse(val) as number;
      setGenderStatus('saving');
      updateProfileMutation.mutate(
        {
          fullName: user.fullName,
          phoneNumber: user.phoneNumber || '',
          gender: validGender,
        },
        {
          onSuccess: () => {
            setGenderStatus('success');
            setTimeout(() => setGenderStatus('idle'), 2000);
          },
          onError: () => {
            setGenderStatus('error');
            setTimeout(() => setGenderStatus('idle'), 3000);
          },
        }
      );
    } catch (e) {
      console.error('Invalid gender', e);
    }
  };

  const onDropAvatar = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && user) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      setIsUploadingAvatar(true);
      setErrorMsg('');
      
      updateProfileMutation.mutate(
        { 
          fullName: user.fullName, 
          phoneNumber: user.phoneNumber || '',
          gender: user.gender,
          avatarFile: file 
        },
        {
          onSettled: () => setIsUploadingAvatar(false),
          onError: (err) => {
             console.error(err);
             setAvatarUrl(user.avatarUrl || ''); 
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

  return (
    <div className="bg-white shadow-[--shadow-card] rounded-2xl overflow-hidden" data-testid="profile-info-tab">
      <div className="bg-brand-50 px-6 sm:px-8 py-6 border-b border-brand-100 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
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
          <h2 className="text-2xl font-bold text-ink-primary">{user?.fullName}</h2>
          <p className="text-body-sm text-ink-secondary">{user?.email}</p>
          <p className="text-xs text-ink-tertiary mt-1 bg-white inline-block px-2 py-0.5 rounded-full border border-gray-100">
            Vai trò: {user?.roles?.join(', ')}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold mb-6">Chỉnh sửa thông tin</h3>
        
        <div className="space-y-5 max-w-lg">
          <InlineEditableInput
            id="email"
            label="Địa chỉ Email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50 text-ink-secondary"
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

          <fieldset className="space-y-2 relative">
            <legend className="block text-sm font-medium text-gray-700">Giới tính</legend>
            <div className="flex flex-row gap-6 h-10 items-center justify-start bg-white border border-gray-200 rounded-lg px-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={1}
                  checked={user?.gender === 1}
                  onChange={() => handleSaveGender(1)}
                  disabled={genderStatus === 'saving'}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Nam</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={0}
                  checked={user?.gender === 0}
                  onChange={() => handleSaveGender(0)}
                  disabled={genderStatus === 'saving'}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Nữ</span>
              </label>
            </div>
            <div className="absolute right-3 top-9 flex items-center justify-center pointer-events-none">
              {genderStatus === 'saving' && <Loader2 className="animate-spin text-[--color-brand-600]" size={18} />}
              {genderStatus === 'success' && <CheckCircle className="text-green-500" size={18} />}
              {genderStatus === 'error' && <XCircle className="text-red-500" size={18} />}
            </div>
          </fieldset>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
