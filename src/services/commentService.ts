import apiClient from './api';
import type {
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
  VoteCommentDto,
} from '@/types/api.types';

/**
 * Comment Service - handles all comment-related API calls
 * Abstracts API communication from Vue components
 */
export const commentService = {
  /**
   * Get all comments for a specific post
   * @param postId - Post ID
   * @returns Array of comments
   */
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/comments/post/${postId}`);
    return response.data;
  },

  /**
   * Create a new comment
   * @param commentData - Comment data (content and postId)
   * @returns Created comment
   */
  async createComment(commentData: CreateCommentDto): Promise<Comment> {
    const response = await apiClient.post<Comment>('/comments', commentData);
    return response.data;
  },

  /**
   * Update an existing comment
   * @param id - Comment ID
   * @param commentData - Updated comment data (partial)
   * @returns Updated comment
   */
  async updateComment(
    id: number,
    commentData: UpdateCommentDto,
  ): Promise<Comment> {
    const response = await apiClient.patch<Comment>(
      `/comments/${id}`,
      commentData,
    );
    return response.data;
  },

  /**
   * Delete a comment
   * @param id - Comment ID
   */
  async deleteComment(id: number): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  },

  /**
   * Vote on a comment (upvote or downvote)
   * @param id - Comment ID
   * @param voteData - Vote type (upvote or downvote)
   * @returns Updated comment with new score
   */
  async voteComment(id: number, voteData: VoteCommentDto): Promise<Comment> {
    const response = await apiClient.post<Comment>(
      `/comments/${id}/vote`,
      voteData,
    );
    return response.data;
  },

  /**
   * Remove vote from a comment
   * @param id - Comment ID
   * @returns Updated comment with adjusted score
   */
  async removeVote(id: number): Promise<Comment> {
    const response = await apiClient.delete<Comment>(`/comments/${id}/vote`);
    return response.data;
  },
};

