import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor untuk menambahkan XSRF-TOKEN dari cookie ke header
api.interceptors.request.use((config) => {
  const xsrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
  }

  return config;
});

export interface Role {
  role_id: number;
  role_name: string;
  display_name: string;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Mendapatkan CSRF cookie dari Sanctum.
 * Harus dipanggil sebelum login atau request POST lainnya.
 */
export async function getCsrfCookie(): Promise<void> {
  await api.get('/sanctum/csrf-cookie');
}

/**
 * Login user.
 */
export async function login(payload: LoginPayload): Promise<ApiResponse<{ user: User }>> {
  const response = await api.post<ApiResponse<{ user: User }>>('/api/login', payload);
  return response.data;
}

/**
 * Mendapatkan data user yang sedang login.
 */
export async function getMe(): Promise<ApiResponse<{ user: User }>> {
  const response = await api.get<ApiResponse<{ user: User }>>('/api/me');
  return response.data;
}

/**
 * Logout user.
 */
export async function logout(): Promise<ApiResponse<null>> {
  const response = await api.post<ApiResponse<null>>('/api/logout');
  return response.data;
}

export default api;
