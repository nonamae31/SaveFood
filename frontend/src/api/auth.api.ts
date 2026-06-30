import { apiClient } from './client';
import type { LoginRequest, LoginResponse, UserProfileDTO } from '@/types/auth.types';

export const login = (data: LoginRequest): Promise<LoginResponse> =>
  apiClient('/Users/login', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });

export const register = (data: import('@/types/auth.types').RegisterRequest): Promise<{ message: string, userId: string }> =>
  apiClient('/Users/register', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });

export const googleLogin = (data: import('@/types/auth.types').GoogleLoginRequest): Promise<LoginResponse> =>
  apiClient('/Users/google-login', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const verifyOtp = (data: import('@/types/auth.types').VerifyOtpRequest): Promise<{ message: string }> =>
  apiClient('/Users/verify-otp', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const resendOtp = (data: import('@/types/auth.types').ResendOtpRequest): Promise<{ message: string }> =>
  apiClient('/Users/resend-otp', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const logout = (): Promise<{ message: string }> =>
  apiClient('/Users/logout', { 
    method: 'POST' 
  });

export const forgotPassword = (data: import('@/types/auth.types').ForgotPasswordRequest): Promise<{ message: string }> =>
  apiClient('/Users/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const resetPassword = (data: import('@/types/auth.types').ResetPasswordRequest): Promise<{ message: string }> =>
  apiClient('/Users/reset-password', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const getProfile = (): Promise<UserProfileDTO> =>
  apiClient('/Users/profile');

export const updateProfile = (data: import('@/types/auth.types').UpdateProfileRequest): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('fullName', data.fullName);
  if (data.phoneNumber) formData.append('phoneNumber', data.phoneNumber);
  if (data.avatarFile) formData.append('avatarFile', data.avatarFile);

  return apiClient('/Users/profile', {
    method: 'PUT',
    body: formData
  });
};

export const changePassword = (data: import('@/types/auth.types').ChangePasswordRequest): Promise<{ message: string }> =>
  apiClient('/Users/change-password', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const updateLocation = (data: import('@/types/auth.types').UpdateLocationRequest): Promise<{ message: string }> =>
  apiClient('/Users/location', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
