import apiClient from './api';
import type {
  Post,
  CreatePostDto,
  UpdatePostDto,
  QueryPostsDto,
  PaginatedResponse,
} from '@/types/api.types';

/**
 * Post Service - handles all post-related API calls
 * Abstracts API communication from Vue components
 */
export const postService = {
  /**
   * Get all posts with pagination and filtering
   * @param query - Query parameters for pagination, search, and filtering
   * @returns Paginated response with posts
   */
  async getPosts(query?: QueryPostsDto): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<PaginatedResponse<Post>>('/posts', {
      params: query,
    });
    return response.data;
  },

  /**
   * Get a single post by ID
   * @param id - Post ID
   * @returns Post details with comments and tags
   */
  async getPostById(id: number): Promise<Post> {
    const response = await apiClient.get<Post>(`/posts/${id}`);
    return response.data;
  },

  /**
   * Create a new post
   * @param postData - Post data (title, body, optional tags)
   * @returns Created post
   */
  async createPost(postData: CreatePostDto): Promise<Post> {
    const response = await apiClient.post<Post>('/posts', postData);
    return response.data;
  },

  /**
   * Update an existing post
   * @param id - Post ID
   * @param postData - Updated post data (partial)
   * @returns Updated post
   */
  async updatePost(
    id: number,
    postData: UpdatePostDto,
  ): Promise<Post> {
    const response = await apiClient.patch<Post>(`/posts/${id}`, postData);
    return response.data;
  },

  /**
   * Delete a post
   * @param id - Post ID
   */
  async deletePost(id: number): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },
};

