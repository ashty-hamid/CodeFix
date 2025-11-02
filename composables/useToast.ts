import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  isVisible: boolean
}

export const useToast = () => {
  const toasts = ref<Toast[]>([])
  const defaultDuration = 3000

  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const show = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = defaultDuration
  ) => {
    const id = generateId()
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      isVisible: true
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  const success = (message: string, duration?: number) => {
    return show(message, 'success', duration)
  }

  const error = (message: string, duration?: number) => {
    return show(message, 'error', duration)
  }

  const warning = (message: string, duration?: number) => {
    return show(message, 'warning', duration)
  }

  const info = (message: string, duration?: number) => {
    return show(message, 'info', duration)
  }

  const dismiss = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value[index].isVisible = false
      setTimeout(() => {
        toasts.value.splice(index, 1)
      }, 300) // Wait for animation
    }
  }

  const dismissAll = () => {
    toasts.value.forEach(toast => {
      toast.isVisible = false
    })
    setTimeout(() => {
      toasts.value = []
    }, 300)
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll
  }
}
