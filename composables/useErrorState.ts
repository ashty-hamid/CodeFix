import { ref } from 'vue'

export interface ErrorState {
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  timestamp: number
  code?: string | number
}

export const useErrorState = () => {
  const errors = ref<Map<string, ErrorState>>(new Map())

  const addError = (
    key: string,
    message: string,
    type: ErrorState['type'] = 'error',
    code?: string | number
  ) => {
    errors.value.set(key, {
      message,
      type,
      timestamp: Date.now(),
      code
    })
  }

  const removeError = (key: string) => {
    errors.value.delete(key)
  }

  const getError = (key: string) => {
    return errors.value.get(key)
  }

  const hasError = (key: string) => {
    return errors.value.has(key)
  }

  const clearAll = () => {
    errors.value.clear()
  }

  const getAllErrors = () => {
    return Array.from(errors.value.entries()).map(([key, error]) => ({
      key,
      ...error
    }))
  }

  return {
    errors,
    addError,
    removeError,
    getError,
    hasError,
    clearAll,
    getAllErrors
  }
}
