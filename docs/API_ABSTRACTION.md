# API Abstraction Guide

This document explains how API calls are abstracted in the frontend application. **No raw Axios calls should be made directly in Vue components or views.**

## Architecture

All API communication is centralized through service modules located in `src/services/`. Components should import and use these services instead of making direct API calls.

```
src/
├── services/
│   ├── api.ts              # Axios instance with interceptors
│   ├── authService.ts      # Authentication endpoints
│   ├── postService.ts      # Post CRUD operations
│   ├── commentService.ts   # Comment operations
│   ├── userService.ts      # User operations
│   ├── productService.ts   # Product operations (legacy)
│   └── index.ts            # Central export
└── views/
    └── *.vue               # ✅ No raw Axios - use services instead
```

## Available Services

All services are exported from `src/services/index.ts`:

```typescript
import { 
  postService, 
  commentService, 
  authService, 
  userService, 
  tagService, 
  productService,
  apiClient 
} from '@/services';
```

### Auth Service (`authService`)

```typescript
import { authService } from '@/services';

// Register a new user
const response = await authService.register({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'securepassword123'
});

// Login
const response = await authService.login({
  email: 'john@example.com',
  password: 'securepassword123'
});

// Logout
authService.logout();

// Get current authenticated user
const currentUser = await authService.getCurrentUser();

// Check authentication status
const isAuthenticated = authService.isAuthenticated();

// Logout (clears token and user data)
authService.logout();
```

### Post Service (`postService`)

```typescript
import { postService } from '@/services';

// Get all posts with pagination
const result = await postService.getPosts({
  page: 1,
  limit: 10,
  search: 'nestjs',
  tagId: 5,
  authorId: 1,
  sortBy: 'createdAt',
  order: 'DESC'
});

// Get single post
const post = await postService.getPostById(1);

// Create post
const newPost = await postService.createPost({
  title: 'My Post',
  body: 'Post content...',
  tags: [1, 2, 3] // Can be tag IDs (numbers) or tag names (strings)
});

// Update post
const updated = await postService.updatePost(1, {
  title: 'Updated Title',
  body: 'Updated content...',
  tags: [1, 2]
});

// Delete post
await postService.deletePost(1);

// Set best answer for a post
const postWithBestAnswer = await postService.setBestAnswer(1, 5); // postId, commentId

// Remove best answer from a post
const postWithoutBestAnswer = await postService.removeBestAnswer(1);
```

### Comment Service (`commentService`)

```typescript
import { commentService } from '@/services';

// Get comments for a post
const comments = await commentService.getCommentsByPost(1);

// Create comment/answer
const comment = await commentService.createComment({
  content: 'Great post!',
  postId: 1
});

// Update comment
const updated = await commentService.updateComment(1, {
  content: 'Updated content'
});

// Delete comment
await commentService.deleteComment(1);

// Vote on comment (upvote or downvote)
const voted = await commentService.voteComment(1, {
  type: 'upvote' // or 'downvote'
});

// Remove vote from comment
const unvoted = await commentService.removeVote(1);
```

**Note:** Voting automatically recalculates the comment score and may update the best answer if the post has auto-best-answer enabled.

### User Service (`userService`)

```typescript
import { userService } from '@/services';

// Get all users (requires authentication)
const users = await userService.getUsers();

// Get user by ID (requires authentication)
const user = await userService.getUserById(1);

// Update user (requires authentication, only owner or admin)
const updated = await userService.updateUser(1, {
  username: 'newusername',
  email: 'newemail@example.com',
  profileImageUrl: 'https://example.com/image.jpg'
  // Note: Regular users cannot change 'role' or 'blocked' status
});

// Delete user (requires authentication, owner or admin)
await userService.deleteUser(1);
```

**Note:** User creation is handled through `authService.register()`. The `userService` is primarily for managing existing users.

### Product Service (`productService`)

```typescript
import { productService } from '@/services';

// Get all products (public)
const products = await productService.getProducts();

// Get product by ID (public)
const product = await productService.getProductById(1);

// Create product (admin only)
const newProduct = await productService.createProduct({
  name: 'Product Name',
  description: 'Description',
  price: 99.99,
  stock: 100
});

// Update product (admin only)
const updated = await productService.updateProduct(1, {
  name: 'Updated Name',
  price: 89.99
});

// Delete product (admin only)
await productService.deleteProduct(1);
```

**Note:** Product service is legacy/admin functionality. Most applications will primarily use posts, comments, and tags.

## Usage in Vue Components

### ✅ Correct Usage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { postService } from '@/services';
import type { Post, PaginatedResponse } from '@/types/api.types';

const posts = ref<Post[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    loading.value = true;
    const result: PaginatedResponse<Post> = await postService.getPosts({
      page: 1,
      limit: 10
    });
    posts.value = result.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load posts';
  } finally {
    loading.value = false;
  }
});
</script>
```

### ❌ Incorrect Usage (Direct Axios)

```vue
<script setup lang="ts">
import axios from 'axios'; // ❌ DON'T DO THIS

// ❌ DON'T make direct API calls in components
const posts = await axios.get('/api/posts');
</script>
```

## Error Handling

All services use the centralized `apiClient` which includes error interceptors. Errors are automatically handled, but you should still wrap service calls in try-catch blocks:

```typescript
try {
  const post = await postService.getPostById(1);
} catch (error: any) {
  // Error is already logged by interceptor
  // Handle error UI feedback here
  if (error.response?.status === 401) {
    // Redirect to login
  }
}
```

## Authentication Token

The `apiClient` automatically adds the authentication token from `localStorage.getItem('authToken')` to all requests. The `authService` handles storing the token after login/register.

## Type Safety

All services use TypeScript types defined in `src/types/api.types.ts`. These types match the backend DTOs for type safety across the application.

## Benefits

1. **Single Source of Truth**: All API endpoints defined in one place
2. **Type Safety**: TypeScript types ensure correct usage
3. **Easier Testing**: Services can be easily mocked
4. **Consistent Error Handling**: Centralized interceptors
5. **Maintainability**: Changes to API only require service updates
6. **Reusability**: Services can be used across multiple components

