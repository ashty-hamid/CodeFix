<template>
  <header class="cf-nav">
    <nav class="cf-container cf-nav-row">
      <!-- BRAND -->
      <RouterLink to="/home" class="cf-brand">CodeFix</RouterLink>

      <!-- SEARCH -->
      <input
        class="cf-search"
        type="text"
        placeholder="Search posts, tags..."
        aria-label="Search"
      />

      <!-- NAV LINKS -->
      <div class="cf-nav-links">
        <RouterLink to="/home" class="cf-link" active-class="cf-link-active"> Home </RouterLink>

        <RouterLink to="/add" class="cf-link" active-class="cf-link-active"> Add Post </RouterLink>

        <RouterLink to="/profile" class="cf-link" active-class="cf-link-active">
          Profile
        </RouterLink>

        <!-- AUTH BUTTONS -->
        <template v-if="!auth.isLoggedIn">
          <RouterLink to="/login">
            <button class="cf-btn cf-btn-primary">Login / Register</button>
          </RouterLink>
        </template>

        <template v-else>
          <!-- USER AVATAR -->
          <button class="cf-avatar" title="User">
            {{ initials }}
          </button>

          <!-- LOGOUT -->
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

<style scoped>
/* ACTIVE LINK STYLE */
.cf-link-active {
  color: var(--brand);
  border-bottom: 2px solid var(--brand);
  padding-bottom: 2px;
  transition: all 0.2s ease;
}
</style>
