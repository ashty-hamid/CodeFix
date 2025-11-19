import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePostsStore } from '@/stores/postsStore'
import sample from '@/data/sampleData.json'

interface User {
  id: number
  name: string
  email: string
  password: string
  postsCount: number
  answersCount: number
  bestAnswersCount: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  // local mock users (only newly registered account users)
  const users = ref<User[]>([])

  // ❗ start AFTER the sample users to avoid id collisions (banaz, sara, ...)
  let nextId = (sample.users?.length || 0) + 1

  /** SIGN UP */
  function signup(data: { name: string; email: string; password: string }) {
    const exists = users.value.find((u) => u.email === data.email)
    if (exists) throw new Error('Email already registered')

    const newUser: User = {
      id: nextId++,
      name: data.name,
      email: data.email,
      password: data.password,
      postsCount: 0,
      answersCount: 0,
      bestAnswersCount: 0,
    }

    // save new user in auth store
    users.value.push(newUser)
    user.value = newUser

    // 🔥 Sync new user into postsStore.users so posts show correct author
    const postsStore = usePostsStore()
    postsStore.users.push({
      id: newUser.id,
      username: newUser.name, // simple username (you can change later)
      email: newUser.email,
      profileImageUrl: '',
      role: 'user',
      password: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
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

  /** BOOLEAN */
  const isLoggedIn = computed(() => user.value !== null)

  return {
    user,
    users,
    signup,
    login,
    logout,
    isLoggedIn,
  }
})
