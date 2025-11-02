import { ref, computed } from 'vue'

export interface LoadingState {
  isLoading: boolean
  message?: string
}

export const useLoadingState = () => {
  const loadingStates = ref<Map<string, LoadingState>>(new Map())

  const isAnyLoading = computed(() => {
    return Array.from(loadingStates.value.values()).some(state => state.isLoading)
  })

  const startLoading = (key: string = 'default', message?: string) => {
    loadingStates.value.set(key, { isLoading: true, message })
  }

  const stopLoading = (key: string = 'default') => {
    loadingStates.value.set(key, { isLoading: false })
  }

  const isLoading = (key: string = 'default') => {
    return loadingStates.value.get(key)?.isLoading || false
  }

  const getLoadingMessage = (key: string = 'default') => {
    return loadingStates.value.get(key)?.message
  }

  const clearAll = () => {
    loadingStates.value.clear()
  }

  return {
    isAnyLoading,
    isLoading,
    startLoading,
    stopLoading,
    getLoadingMessage,
    clearAll
  }
}
