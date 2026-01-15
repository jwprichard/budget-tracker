import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { HealthCheckResponse } from '../types';
import { AuthTokens } from '../types/auth.types';

const TOKEN_KEY = 'auth_tokens';

// Determine API base URL - use current hostname in production
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is set, use it (for development/custom config)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, use current hostname with backend port 3000
  // This works because frontend (port 80) and backend (port 3000) are on same server
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol; // http: or https:
    const hostname = window.location.hostname; // EC2 IP or domain
    return `${protocol}//${hostname}:3000/api`;
  }

  // Fallback for SSR/build time
  return 'http://localhost:3000/api';
};

// Create Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get tokens from localStorage
const getTokens = (): AuthTokens | null => {
  const tokens = localStorage.getItem(TOKEN_KEY);
  return tokens ? JSON.parse(tokens) : null;
};

// Helper to set tokens in localStorage
const setTokens = (tokens: AuthTokens): void => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

// Helper to clear tokens from localStorage
const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = getTokens();
      if (!tokens?.refreshToken) {
        // No refresh token, clear tokens and reject
        clearTokens();
        processQueue(new Error('No refresh token available'), null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/v1/auth/refresh`,
          { refreshToken: tokens.refreshToken }
        );

        const newTokens: AuthTokens = response.data.data.tokens;
        setTokens(newTokens);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

        processQueue(null, newTokens.accessToken);
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and reject
        clearTokens();
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors globally
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API service methods
export const healthCheck = async (): Promise<HealthCheckResponse> => {
  const response = await apiClient.get<HealthCheckResponse>('/health');
  return response.data;
};

export default apiClient;
