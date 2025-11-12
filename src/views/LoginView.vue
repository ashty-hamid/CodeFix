<template>
  <SimpleLayout>
    <h2 style="margin: 0 0 12px">Welcome Back</h2>
    <p class="cf-muted" style="margin: 0 0 16px">Sign in to your account</p>
    <button class="cf-btn cf-btn-primary" @click="handleLogin">Sign in (mock)</button>
  </SimpleLayout>
</template>
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import SimpleLayout from '@/components/layouts/SimpleLayout.vue'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

function handleLogin() {
  // mock login
  auth.loginMock()

  // redirect to previous page if exists or home
  const redirectTo = (route.query.redirect as string) || '/home'
  router.push(redirectTo)
}
</script>

<style scoped>
.cf-muted {
  color: var(--muted);
}
</style>
