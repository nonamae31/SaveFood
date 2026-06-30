import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, getProfile, verifyOtp, resendOtp } from '@/api/auth.api';

// Export constants for query keys
export const AUTH_QUERY_KEYS = {
  profile: ['auth', 'profile'] as const,
};

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Invalidate profile query to refetch user data after successful login
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile });
    },
  });
}

import { googleLogin } from '@/api/auth.api';

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: googleLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: register,
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: verifyOtp,
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: resendOtp,
  });
}

import { forgotPassword, resetPassword } from '@/api/auth.api';

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear user cache after logout
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, null);
      queryClient.removeQueries(); // Optionally remove all queries
    },
  });
}

// Lấy thông tin User profile dựa trên HttpOnly Cookie (được tự động đính kèm)
export function useProfile() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.profile,
    queryFn: getProfile,
    retry: false, // Do not retry on 401
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

import { updateProfile } from '@/api/auth.api';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Invalidate profile query to refetch user data after successful update
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile });
    },
  });
}

import { changePassword, updateLocation } from '@/api/auth.api';

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.profile });
    },
  });
}
