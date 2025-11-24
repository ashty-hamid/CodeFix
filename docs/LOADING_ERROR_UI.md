# Loading/Error UI Pattern Implementation

This implementation provides reusable composables and components for managing loading states, error handling, and toast notifications in the CodeFix application.

## Features

- Loading state management with multiple concurrent loaders
- Centralized error state handling
- Toast notifications with different types (success, error, warning, info)
- Animated transitions
- TypeScript support
- Easy to integrate and use

## File Structure

The composables are located in two places:
- Root level: `composables/` (shared across the project)
- Source level: `src/composables/` (if moved to src directory)

```
composables/
├── useLoadingState.ts    # Loading state management
├── useErrorState.ts       # Error state management
└── useToast.ts           # Toast notification system

components/
├── LoadingSpinner.vue     # Reusable spinner component
└── ToastNotification.vue  # Toast notification container
```

## Usage Examples

### 1. Using Loading State

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLoadingState } from '@/composables/useLoadingState'
import { postService } from '@/services'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { isLoading, startLoading, stopLoading, getLoadingMessage } = useLoadingState()
const posts = ref([])

const fetchData = async () => {
  startLoading('posts', 'Loading posts...')
  
  try {
    const response = await postService.getPosts({ page: 1, limit: 10 })
    posts.value = response.data
  } catch (error) {
    console.error('Failed to load posts:', error)
  } finally {
    stopLoading('posts')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <LoadingSpinner 
      v-if="isLoading('posts')" 
      size="medium"
      :message="getLoadingMessage('posts') || 'Loading...'"
    />
    <div v-else>
      <!-- Your content -->
      <div v-for="post in posts" :key="post.id">
        {{ post.title }}
      </div>
    </div>
  </div>
</template>
```

**Multiple Concurrent Loading States:**

```vue
<script setup lang="ts">
import { useLoadingState } from '@/composables/useLoadingState'

const { isLoading, startLoading, stopLoading, isAnyLoading } = useLoadingState()

const fetchPosts = async () => {
  startLoading('posts')
  try {
    await postService.getPosts()
  } finally {
    stopLoading('posts')
  }
}

const fetchTags = async () => {
  startLoading('tags')
  try {
    await tagService.getTags()
  } finally {
    stopLoading('tags')
  }
}

// Check if any operation is loading
const showGlobalLoader = isAnyLoading
</script>
```

### 2. Using Error State

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useErrorState } from '@/composables/useErrorState'
import { postService } from '@/services'

const { hasError, getError, addError, removeError, clearAll } = useErrorState()
const posts = ref([])

const fetchData = async () => {
  try {
    const response = await postService.getPosts()
    posts.value = response.data
    removeError('posts') // Clear any previous errors
  } catch (err: any) {
    addError('posts', err.response?.data?.message || 'Failed to load posts', 'error', err.response?.status)
  }
}
</script>

<template>
  <div>
    <div v-if="hasError('posts')" class="error-message">
      {{ getError('posts')?.message }}
    </div>
    <div v-else>
      <!-- Your content -->
    </div>
  </div>
</template>
```

### 3. Using Toast Notifications

```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { postService } from '@/services'

const { success, error, warning, info } = useToast()

const createPost = async (data: CreatePostDto) => {
  try {
    await postService.createPost(data)
    success('Post created successfully!')
  } catch (err: any) {
    error(err.response?.data?.message || 'Failed to create post')
  }
}

const handleWarning = () => {
  warning('Please check your input')
}

const showInfo = () => {
  info('New features available')
}
</script>

<template>
  <!-- Don't forget to add ToastNotification component to your layout -->
  <ToastNotification />
</template>
```

### 4. Combined Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useLoadingState } from '@/composables/useLoadingState'
import { useErrorState } from '@/composables/useErrorState'
import { useToast } from '@/composables/useToast'
import { postService } from '@/services'

const { isLoading, startLoading, stopLoading } = useLoadingState()
const { addError, getError, hasError } = useErrorState()
const { success, error } = useToast()
const posts = ref([])

const fetchPosts = async () => {
  startLoading('posts')
  try {
    const response = await postService.getPosts()
    posts.value = response.data
    success('Posts loaded successfully')
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Failed to load posts'
    addError('posts', errorMessage, 'error', err.response?.status)
    error(errorMessage)
  } finally {
    stopLoading('posts')
  }
}
</script>
```

## API Reference

### useLoadingState()

Returns an object with the following methods and properties:

| Method/Property | Parameters | Description |
|----------------|------------|-------------|
| `startLoading` | `key: string = 'default', message?: string` | Start loading for a specific key |
| `stopLoading` | `key: string = 'default'` | Stop loading for a specific key |
| `isLoading` | `key: string = 'default'` | Check if a specific key is loading |
| `getLoadingMessage` | `key: string = 'default'` | Get the loading message for a key |
| `clearAll` | - | Clear all loading states |
| `isAnyLoading` | - | Computed property: true if any key is loading |

**Example:**
```typescript
const { isLoading, startLoading, stopLoading, isAnyLoading } = useLoadingState()

startLoading('posts', 'Loading posts...')
startLoading('tags', 'Loading tags...')

console.log(isLoading('posts')) // true
console.log(isAnyLoading.value) // true

stopLoading('posts')
console.log(isAnyLoading.value) // true (tags still loading)
```

### useErrorState()

Returns an object with the following methods and properties:

| Method/Property | Parameters | Description |
|----------------|------------|-------------|
| `addError` | `key: string, message: string, type?: 'error' \| 'warning' \| 'info' \| 'success', code?: string \| number` | Add an error for a specific key |
| `removeError` | `key: string` | Remove error for a specific key |
| `getError` | `key: string` | Get error for a specific key |
| `hasError` | `key: string` | Check if a specific key has an error |
| `clearAll` | - | Clear all errors |
| `getAllErrors` | - | Get all errors as an array |
| `errors` | - | Reactive Map of all errors |

**Error State Interface:**
```typescript
interface ErrorState {
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  timestamp: number
  code?: string | number
}
```

**Example:**
```typescript
const { addError, getError, hasError, removeError } = useErrorState()

addError('posts', 'Failed to load posts', 'error', 500)
console.log(hasError('posts')) // true
console.log(getError('posts')?.message) // 'Failed to load posts'

removeError('posts')
console.log(hasError('posts')) // false
```


## Acceptance Criteria
Loading states managed via composables  
Error states managed via composables  
Toast notifications with different types  
Reusable spinner component with size variations  
TypeScript support with proper types  
Smooth animations and transitions  
Multiple concurrent loading states  
Error state with types and codes  
Toast auto-dismissal with configurable duration