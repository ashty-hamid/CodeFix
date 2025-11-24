import apiClient from './api';
import type { User } from '@/types/api.types';

// User Service - handles all user-related API calls
export const userService = {

  // Get all users
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  // Get a single user by ID
  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  // Create a new user
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const response = await apiClient.post<User>('/users', userData);
    return response.data;
  },

  // Update an existing user
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, userData);
    return response.data;
  },

  // Delete a user
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  // Block a user (admin only)
  async blockUser(id: number): Promise<User> {
    const response = await apiClient.post<User>(`/users/${id}/block`);
    return response.data;
  },

  // Unblock a user (admin only)
  async unblockUser(id: number): Promise<User> {
    const response = await apiClient.post<User>(`/users/${id}/unblock`);
    return response.data;
  },
};
