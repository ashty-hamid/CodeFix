import { createRouter, createWebHistory } from 'vue-router'
// import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from '@/stores/authStore'

const HomeView = () => import('@/views/HomeView.vue')
const PostdetailView = () => import('@/views/PostdetailView.vue')
const AddPostView = () => import('@/views/AddPostView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const SignupView = () => import('@/views/SignupView.vue')
const ProfileView = () => import('@/views/Profileview.vue')
const SupportView = () => import('@/views/SupportView.vue')

const routes = [
  { path: '/', redirect: '/home' }, // landing
  { path: '/home', name: 'home', component: HomeView },
  { path: '/post/:id', name: 'post', component: PostdetailView, props: true },

  // protected routes (login required)
  { path: '/add', name: 'add', component: AddPostView, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },

  // public auth
  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/support', name: 'support', component: SupportView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// simple guard using the mock store
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
