// src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7251/api';

export class ApiError extends Error {
  public details?: any;
  constructor(public status: number, public code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}
//
//
//
export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const defaultHeaders: HeadersInit = isFormData ? {} : { 'Content-Type': 'application/json' };

  const res = await fetch(`${BASE_URL}${path}`, {
    // RẤT QUAN TRỌNG ĐỂ GỬI VÀ NHẬN HTTPONLY COOKIE
    credentials: 'include',
    headers: { 
      ...defaultHeaders,
      ...options?.headers 
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.message || err.title || 'Request failed';
    throw new ApiError(res.status, err.code ?? 'UNKNOWN', message, err);
  }

  // Handle empty responses (like 204 No Content or empty 200 OK)
  const text = await res.text();
  if (!text) return {} as T;
  const json = JSON.parse(text);
  // Backend dùng ApiResponse<T> wrapper { success, data, message } ở một số endpoint
  return (json.data ?? json) as T;
}
