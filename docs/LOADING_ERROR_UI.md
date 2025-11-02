# Loading/Error UI Pattern Implementation

This implementation provides reusable composables and components for managing loading states, error handling, and toast notifications in the CodeFix application.

## Features

- ✅ Loading state management with multiple concurrent loaders
- ✅ Centralized error state handling
- ✅ Toast notifications with different types (success, error, warning, info)
- ✅ Animated transitions
- ✅ TypeScript support
- ✅ Easy to integrate and use

## File Structure
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
<script setup>
import { useLoadingState } from '@/composables/useLoadingState'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { isLoading, startLoading, stopLoading } = useLoadingState()

const fetchData = async () => {
  startLoading('mydata', 'Loading data...')
  
  try {
    // Your API call here
    await api.fetchData()
  } finally {
    stopLoading('mydata')
  }
}
</script>

<template>
  <div>
    <LoadingSpinner 
      v-if="isLoading('mydata')" 
      size="medium"
      message="Loading..."
    />
    <div v-else>
      <!-- Your content -->
    </div>
  </div>
</template>
```

### 2. Using Toast Notifications
```vue
<script setup>
import { useToast } from '@/composables/useToast'

const { success, error, warning, info } = useToast()

const handleSuccess = () => {
  success('Operation completed successfully!')
}
</script>
```

## API Reference

### useLoadingState()

| Method | Parameters | Description |
|--------|------------|-------------|
| `startLoading` | `key: string, message?: string` | Start loading for a specific key |
| `stopLoading` | `key: string` | Stop loading for a specific key |
| `isLoading` | `key: string` | Check if a specific key is loading |

### useToast()

| Method | Parameters | Description |
|--------|------------|-------------|
| `success` | `message: string, duration?: number` | Show success toast |
| `error` | `message: string, duration?: number` | Show error toast |
| `warning` | `message: string, duration?: number` | Show warning toast |
| `info` | `message: string, duration?: number` | Show info toast |

## Acceptance Criteria

✅ Loading states managed via composables  
✅ Error states managed via composables  
✅ Toast notifications with different types  
✅ Reusable spinner component with size variations  
✅ TypeScript support with proper types  
✅ Smooth animations and transitions