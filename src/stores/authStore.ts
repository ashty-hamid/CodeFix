import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import type { User } from '@/types/api.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Initialize: Check if user is already logged in via token
  async function init() {
    if (authService.isAuthenticated()) {
      try {
        // Verify token by fetching current user
        const currentUser = await authService.getCurrentUser()
        user.value = currentUser
      } catch (e: any) {
        // Token might be invalid or expired, clear it
        console.warn('Failed to restore user session:', e.response?.status, e.message)
        authService.logout()
        user.value = null
      }
    }
  }

  /** SIGN UP */
  async function signup(data: { username: string; email: string; password: string }) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
      })
      user.value = response.user
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Registration failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /** LOGIN */
  async function login(data: { email: string; password: string }) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      })
      user.value = response.user
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Login failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /** LOGOUT */
  function logout() {
    authService.logout()
    user.value = null
    error.value = null
  }

  /** SET USER */
  function setUser(userData: User | null) {
    user.value = userData
  }

  /** BOOLEAN */
  const isLoggedIn = computed(() => {
    return !!user.value && authService.isAuthenticated()
  })

  return {
    user,
    isLoading,
    error,
    signup,
    login,
    logout,
    setUser,
    init,
    isLoggedIn,
  }
})
