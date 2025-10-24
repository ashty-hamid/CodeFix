import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'



const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  }
]

const router = createRouter({
  // Use Vite's base URL so history works in production subpaths
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
export default router