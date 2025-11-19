import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  // mock database
  const users = ref<User[]>([])
  let nextId = 1

  /** SIGN UP */
  function signup(data: { name: string; email: string; password: string }) {
    // check duplicate email
    const exists = users.value.find((u) => u.email === data.email)
    if (exists) throw new Error('Email already registered')

    const newUser: User = {
      id: nextId++,
      name: data.name,
      email: data.email,
      password: data.password,
    }

    // save new user
    users.value.push(newUser)

    // auto-login after signup
    user.value = newUser
  }

  /** LOGIN */
  function login(data: { email: string; password: string }) {
    const found = users.value.find((u) => u.email === data.email && u.password === data.password)

    if (!found) throw new Error('Invalid email or password')

    user.value = found
  }

  /** LOGOUT */
  function logout() {
    user.value = null
  }

  /** DERIVED STATE */
  const isLoggedIn = computed(() => user.value !== null)

  return { user, users, signup, login, logout, isLoggedIn }
})
