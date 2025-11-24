// ============================================
// Core Entity Types
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  profileImageUrl?: string;
  blocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Author {
  id: number;
  username: string;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Post {
  id: number;
  title: string;
  body: string;
  excerpt?: string;
  views: number;
  createdAt: string;
  author: Author;
  tags: Tag[];
  commentsCount: number;
  bestAnswerId?: number | null;
}

export interface Comment {
  id: number;
  content: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  postId: number;
  isBestAnswer?: boolean;
}

export type VoteType = 'upvote' | 'downvote';

export interface Vote {
  id: number;
  type: VoteType;
  createdAt: string;
  userId: number;
  commentId: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  createdAt?: string;
}

// ============================================
// Request DTOs
// ============================================

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreatePostDto {
  title: string;
  body: string;
  tags?: (number | string)[]; // Can be tag IDs (numbers) or tag names (strings)
}

export interface UpdatePostDto {
  title?: string;
  body?: string;
  tags?: (number | string)[]; // Can be tag IDs (numbers) or tag names (strings)
}

export interface CreateCommentDto {
  content: string;
  postId: number;
}

export interface UpdateCommentDto {
  content?: string;
}

export interface VoteCommentDto {
  type: VoteType;
}

export interface QueryPostsDto {
  page?: number;
  limit?: number;
  search?: string;
  authorId?: number;
  tagId?: number;
  sortBy?: 'createdAt' | 'views' | 'title';
  order?: 'ASC' | 'DESC';
}

// ============================================
// Response DTOs
// ============================================

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

// ============================================
// Generic API Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
