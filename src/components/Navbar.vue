<template>
  <header class="cf-nav">
    <nav class="cf-container cf-nav-row">
      <!-- BRAND -->
      <RouterLink to="/home" class="cf-brand">{{ $t('navbar.brand') }}</RouterLink>

      <!-- SEARCH -->
      <input
        v-model="searchQuery"
        class="cf-search"
        type="text"
        :placeholder="$t('navbar.searchPlaceholder')"
        :aria-label="$t('navbar.searchAriaLabel')"
        @input="handleSearch"
        @keyup.enter="handleSearchSubmit"
      />

      <!-- NAV LINKS -->
      <div class="cf-nav-links">
        <RouterLink to="/home" class="cf-link" active-class="cf-link-active">
          {{ $t('common.home') }}
        </RouterLink>

        <RouterLink to="/add" class="cf-link" active-class="cf-link-active">
          {{ $t('common.addPost') }}
        </RouterLink>

        <RouterLink to="/profile" class="cf-link" active-class="cf-link-active">
          {{ $t('common.profile') }}
        </RouterLink>

        <!-- AUTH BUTTONS -->
        <template v-if="!auth.isLoggedIn">
          <RouterLink to="/login">
            <button class="cf-btn cf-btn-primary">{{ $t('common.loginRegister') }}</button>
          </RouterLink>
        </template>

        <template v-else>
          <!-- USER AVATAR -->
          <button class="cf-avatar" :title="$t('common.user')">
            {{ initials }}
          </button>

          <!-- LOGOUT -->
          <button class="cf-btn" @click="handleLogout">{{ $t('common.logout') }}</button>
        </template>

        <!-- LANGUAGE SWITCHER -->
        <select
          v-model="currentLocale"
          @change="changeLocale"
          class="cf-btn"
          style="margin-left: 12px; padding: 6px 10px; cursor: pointer"
        >
          <option value="en">EN</option>
          <option value="ar">AR</option>
          <option value="ku">KU</option>
        </select>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { locale } = useI18n()

const currentLocale = ref(locale.value)
const searchQuery = ref('')

// Debounce timer for search
let searchTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  currentLocale.value = locale.value
  // Initialize search query from route if on home page
  if (route.name === 'home' && route.query.search) {
    searchQuery.value = route.query.search as string
  }
})

// Watch for route changes to sync search query
watch(() => route.query.search, (newSearch) => {
  if (route.name === 'home') {
    searchQuery.value = (newSearch as string) || ''
  } else {
    searchQuery.value = ''
  }
})

function changeLocale() {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
}

function handleLogout() {
  auth.logout()
  router.push('/home')
}

// Handle search input with debouncing
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300) // 300ms debounce
}

// Handle search on Enter key
function handleSearchSubmit() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  performSearch()
}

// Navigate to home with search query
function performSearch() {
  const query: { search?: string } = {}
  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim()
  }
  
  // Navigate to home with search query
  router.push({ 
    name: 'home', 
    query: query 
  })
}

const initials = computed(() => (auth.user?.username ?? 'U').slice(0, 1).toUpperCase())
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
