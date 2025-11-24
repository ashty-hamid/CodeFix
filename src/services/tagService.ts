import apiClient from './api';
import type { Tag } from '@/types/api.types';

// Tag Service - handles all tag-related API calls
export const tagService = {
  /**
   * Get all tags
   * @returns Array of tags
   */
  async getTags(): Promise<Tag[]> {
    const response = await apiClient.get<Tag[]>('/tags');
    return response.data;
  },

  /**
   * Get a single tag by ID
   * @param id - Tag ID
   * @returns Tag details
   */
  async getTagById(id: number): Promise<Tag> {
    const response = await apiClient.get<Tag>(`/tags/${id}`);
    return response.data;
  },
};

