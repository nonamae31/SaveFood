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

export const getProfile = (): Promise<UserProfileDTO> =>
  apiClient('/Users/profile');

export const updateProfile = (data: import('@/types/auth.types').UpdateProfileRequest): Promise<{ message: string }> =>
  apiClient('/Users/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
