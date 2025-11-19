// Global styles (Tailwind first, then custom CSS)
import '@/assets/styles/styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// State management
app.use(createPinia())

// Routing
app.use(router)

// Mount
app.mount('#app')
