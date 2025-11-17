<template>
  <header class="cf-nav">
    <nav class="cf-container cf-nav-row">
      <RouterLink to="/home" class="cf-brand">CodeFix</RouterLink>

      <input
        class="cf-search"
        type="text"
        placeholder="Search posts, tags..."
        aria-label="Search"
      />

      <div class="cf-nav-links">
        <RouterLink to="/home" class="cf-link" active-class="cf-link-active"> Home </RouterLink>
        <RouterLink to="/add" class="cf-link" active-class="cf-link-active">Add Post</RouterLink>
        <RouterLink to="/profile" class="cf-link" active-class="cf-link-active">Profile</RouterLink>

        <template v-if="!auth.isLoggedIn">
          <RouterLink to="/login">
            <button class="cf-btn cf-btn-primary">Login / Register</button>
          </RouterLink>
        </template>
        <template v-else>
          <button class="cf-avatar" title="User">{{ initials }}</button>
          <button class="cf-btn" @click="auth.logout()">Logout</button>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
const auth = useAuthStore()
const initials = computed(() => (auth.user?.name ?? 'U').slice(0, 1).toUpperCase())
</script>
