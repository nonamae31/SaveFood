import React, { useState, useEffect, useCallback } from 'react';
import { X, User, MapPin, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateProfile, useUpdateLocation } from '@/hooks/useAuth';
import { InlineEditableInput } from '@/components/ui/InlineEditableInput';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminProfileModal({ isOpen, onClose }: AdminProfileModalProps) {
  const { user } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  const updateLocationMutation = useUpdateLocation();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [genderStatus, setGenderStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user && isOpen) {
      setAvatarUrl(user.avatarUrl || '');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  const handleSaveField = async (field: 'fullName' | 'phoneNumber' | 'address', val: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!user) return reject(new Error('User not found'));

      if (field === 'address') {
        updateLocationMutation.mutate(
          { address: val },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          }
        );
        return;
      }

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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Admin Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col items-center mb-6">
            <div 
              {...getRootProps()}
              className={`relative group w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0 cursor-pointer ${isDragActive ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <input {...getInputProps()} />
              {isUploadingAvatar ? (
                <div className="w-full h-full bg-black/20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt={user.fullName} className="w-full h-full object-cover bg-indigo-100" />
              ) : (
                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              {!isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium text-center px-1">Thay đổi</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">{user.email}</p>
          </div>

          <div className="space-y-4">
            <InlineEditableInput
              id="fullName"
              label="Full Name"
              type="text"
              value={user.fullName || ''}
              onSave={(val) => handleSaveField('fullName', val)}
            />

            <InlineEditableInput
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              value={user.phoneNumber || ''}
              onSave={(val) => handleSaveField('phoneNumber', val)}
            />

            <InlineEditableInput
              id="address"
              label="Address"
              type="text"
              value={user.address || ''}
              onSave={(val) => handleSaveField('address', val)}
            />

            <fieldset className="space-y-2 relative">
              <legend className="block text-sm font-medium text-gray-700">Giới tính</legend>
              <div className="flex flex-row gap-6 h-10 items-center justify-start bg-white border border-gray-200 rounded-lg px-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="admin_gender"
                    value={1}
                    checked={user.gender === 1}
                    onChange={() => handleSaveGender(1)}
                    disabled={genderStatus === 'saving'}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Nam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="admin_gender"
                    value={0}
                    checked={user.gender === 0}
                    onChange={() => handleSaveGender(0)}
                    disabled={genderStatus === 'saving'}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Nữ</span>
                </label>
              </div>
              <div className="absolute right-3 top-9 flex items-center justify-center pointer-events-none">
                {genderStatus === 'saving' && <Loader2 className="animate-spin text-indigo-600" size={18} />}
                {genderStatus === 'success' && <CheckCircle className="text-green-500" size={18} />}
                {genderStatus === 'error' && <XCircle className="text-red-500" size={18} />}
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}
