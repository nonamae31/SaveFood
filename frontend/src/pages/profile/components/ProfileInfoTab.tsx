import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

function InlineEditableInput({
  id, label, value, type = 'text', onSave, disabled = false, className = ''
}: {
  id: string; label: string; value: string; type?: string; onSave?: (val: string) => Promise<void>; disabled?: boolean; className?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => { setLocalValue(value); }, [value]);

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
        id={id} label={label} type={type} value={localValue}
        onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur}
        disabled={disabled || status === 'saving'} className={className}
      />
      <div className="absolute right-3 top-9 flex items-center justify-center pointer-events-none">
        {status === 'saving' && <Loader2 className="animate-spin text-[--color-brand-600]" size={18} />}
        {status === 'success' && <CheckCircle className="text-green-500" size={18} />}
        {status === 'error' && <XCircle className="text-red-500" size={18} />}
      </div>
    </div>
  );
}

export function ProfileInfoTab() {
  const { user } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        }
      );
    });
  };

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
