// Global styles (Tailwind first, then custom CSS)
import '@/assets/styles/styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n/index'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)

// State management
const pinia = createPinia()
app.use(pinia)

// Initialize auth store (restore user from token)
const authStore = useAuthStore()
authStore.init()

// Routing
app.use(router)

// Internationalization
app.use(i18n)

// Mount
app.mount('#app')
