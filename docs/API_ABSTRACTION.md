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

// Check authentication status
const isAuthenticated = authService.isAuthenticated();
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
  sortBy: 'createdAt',
  order: 'DESC'
});

// Get single post
const post = await postService.getPostById(1);

// Create post
const newPost = await postService.createPost({
  title: 'My Post',
  body: 'Post content...',
  tags: [1, 2, 3]
});

// Update post
const updated = await postService.updatePost(1, {
  title: 'Updated Title'
});

// Delete post
await postService.deletePost(1);
```

### Comment Service (`commentService`)

```typescript
import { commentService } from '@/services';

// Get comments for a post
const comments = await commentService.getCommentsByPost(1);

// Create comment
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

// Vote on comment
const voted = await commentService.voteComment(1, {
  type: 'upvote' // or 'downvote'
});

// Remove vote
const unvoted = await commentService.removeVote(1);
```

### User Service (`userService`)

```typescript
import { userService } from '@/services';

// Get all users
const users = await userService.getUsers();

// Get user by ID
const user = await userService.getUserById(1);

// Create user (admin only)
const newUser = await userService.createUser({...});

// Update user
const updated = await userService.updateUser(1, {...});

// Delete user
await userService.deleteUser(1);
```

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

