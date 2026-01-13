import apiClient from './api';
import { User, AuthTokens, LoginCredentials, RegisterData } from '../types/auth.types';

const TOKEN_KEY = 'auth_tokens';

export const authService = {
  // Store tokens in localStorage
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },

  // Get tokens from localStorage
  getTokens(): AuthTokens | null {
    const tokens = localStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  },

  // Clear tokens from localStorage
  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Register new user
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post('/v1/auth/register', data);
    return response.data.data;
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post('/v1/auth/login', credentials);
    return response.data.data;
  },

  // Refresh access token
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post('/v1/auth/refresh', { refreshToken });
    return response.data.data.tokens;
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/v1/auth/profile');
    return response.data.data.user;
  },

  // Logout (client-side only, tokens cleared)
  logout(): void {
    this.clearTokens();
  },
};
