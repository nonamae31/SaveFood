// src/types/auth.types.ts

export type UserRole = 'buyer' | 'store_owner' | 'admin';

export interface User {
  id:        string;
  email:     string;
  fullName:  string;
  avatarUrl: string | null;
  role:      UserRole;
  phone:     string | null;
  createdAt: string;
}

export interface LoginRequest {
  email:      string;
  password:   string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface GoogleLoginRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface LoginResponse {
  accessToken: string; // Thực tế không cần lưu accessToken này ở local storage vì đã có HttpOnly Cookie, nhưng API vẫn trả về
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  staffRole?: number | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  avatarFile?: File | null;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  status: string;
  createdAt: string;
  roles: string[];
  hasPassword: boolean;
  storeId?: string | null;
  staffRole?: number | null; // 0=Owner, 1=Manager, 2=Staff, null=không thuộc store nào
}
