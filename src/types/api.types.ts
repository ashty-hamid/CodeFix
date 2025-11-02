// Example User type - adjust this to match YOUR API
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// Example Product type - adjust this to match YOUR API
export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image?: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// For paginated responses (lists with pages)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// For error responses
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}
