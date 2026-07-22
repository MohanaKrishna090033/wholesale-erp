import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Dynamically use Vercel's environment variable in production, or localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message: string; errors?: Array<{ field: string; message: string }> }>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // Use the dynamic API_BASE_URL instead of hardcoding localhost
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.data.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    const message = error.response?.data?.message || 'An unexpected error occurred';
    if (error.response?.status === 403) {
      toast.error('Permission Denied: You do not have access to perform this action.');
    } else if (error.response?.status === 422) {
      toast.error(`Validation Error: ${message}`);
    } else if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);