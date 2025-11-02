import apiClient from './api';
import type { RegisterDto, LoginDto, AuthResponse } from '@/types/api.types';

/**
 * Auth Service - handles all authentication-related API calls
 * Abstracts API communication from Vue components
 */
export const authService = {
  /**
   * Register a new user
   * @param registerData - User registration data (username, email, password)
   * @returns Authentication response with access token and user data
   */
  async register(registerData: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/register',
      registerData,
    );
    // Store token in localStorage if registration is successful
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Login an existing user
   * @param loginData - User login credentials (email, password)
   * @returns Authentication response with access token and user data
   */
  async login(loginData: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      loginData,
    );
    // Store token in localStorage if login is successful
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Logout the current user
   * Removes the auth token from localStorage
   */
  logout(): void {
    localStorage.removeItem('authToken');
  },

  /**
   * Get the current auth token from localStorage
   * @returns Auth token string or null
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  /**
   * Check if user is authenticated
   * @returns True if auth token exists
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

