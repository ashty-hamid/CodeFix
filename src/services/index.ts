/**
 * Services Index
 * Central export point for all API services
 * This abstracts API calls from components - no raw Axios usage in views
 */

export { postService } from './postService';
export { commentService } from './commentService';
export { authService } from './authService';
export { userService } from './userService';
export { productService } from './productService';
export { tagService } from './tagService';
export { paymentService } from './paymentService';
export type { Payment } from './paymentService';
export { default as apiClient } from './api';

