<template>
  <DefaultLayout>
    <section class="cf-container" style="padding-block: 32px">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <p>{{ $t('common.loading') }}...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <RouterLink to="/home">
          <button class="cf-btn cf-btn-primary">{{ $t('common.backToHome') }}</button>
        </RouterLink>
      </div>

      <!-- User Profile -->
      <template v-else-if="user">
        <div class="profile-card">
          <!-- Avatar + Name -->
          <div class="top-row">
            <div class="avatar">{{ initials }}</div>

            <div>
              <h2 class="name">{{ user.username }}</h2>
              <p class="username">@{{ user.username }}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-box">
              <h3>{{ postsCount }}</h3>
              <p>{{ $t('profile.postsCount') }}</p>
            </div>
            <div class="stat-box">
              <h3>{{ answersCount }}</h3>
              <p>{{ $t('profile.answersCount') }}</p>
            </div>
            <div class="stat-box">
              <h3>{{ bestAnswersCount }}</h3>
              <p>{{ $t('profile.bestAnswersCount') }}</p>
            </div>
          </div>

          <!-- Blocked Status Badge -->
          <div v-if="user.blocked" class="blocked-badge">
            <span>🚫 {{ $t('admin.blocked') }}</span>
          </div>

          <!-- Admin Controls -->
          <div v-if="isAdmin && !isOwnProfile" class="admin-controls">
            <button 
              v-if="!user.blocked"
              class="cf-btn cf-btn-warning" 
              @click="handleBlockUser"
              :disabled="isLoadingAction"
            >
              {{ $t('admin.blockUser') }}
            </button>
            <button 
              v-else
              class="cf-btn cf-btn-success" 
              @click="handleUnblockUser"
              :disabled="isLoadingAction"
            >
              {{ $t('admin.unblockUser') }}
            </button>
            <button 
              class="cf-btn cf-btn-danger" 
              @click="showDeleteConfirm = true"
              :disabled="isLoadingAction"
            >
              {{ $t('admin.deleteUser') }}
            </button>
          </div>
        </div>

        <!-- USER POSTS SECTION -->
        <div class="posts-section">
          <h3>{{ $t('userProfile.userPosts') }} ({{ userPosts.length }})</h3>

          <!-- No posts yet -->
          <div v-if="userPosts.length === 0" class="empty-box">
            <div class="empty-avatar">👤</div>
            <p class="no-posts-title">{{ $t('userProfile.noPostsYet') }}</p>
            <p class="no-posts-sub">{{ $t('userProfile.userHasNoPosts') }}</p>
          </div>

          <!-- List of user posts -->
          <div v-else class="posts-list">
            <article v-for="post in userPosts" :key="post.id" class="post-card">
              <header class="post-header">
                <h4 class="post-title">
                  <RouterLink :to="`/post/${post.id}`" class="cf-link">
                    {{ post.title }}
                  </RouterLink>
                </h4>
                <small class="post-date">{{ formatDate(post.createdAt) }}</small>
              </header>

              <p class="post-excerpt">
                {{ post.excerpt || post.body?.slice(0, 150) }}
              </p>

              <footer class="post-footer">
                <div class="tags">
                  <span v-for="t in (post.tags || []).filter(t => t && t.id && t.name)" :key="t.id" class="tag-pill">
                    {{ t.name }}
                  </span>
                </div>

                <div class="meta-right">
                  <span class="meta-item">💬 {{ post.commentsCount || 0 }}</span>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </template>
    </section>

    <!-- Toast Notifications -->
    <ToastNotification />

    <!-- Delete User Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content">
        <h3>{{ $t('admin.confirmDeleteUser') }}</h3>
        <p class="warning-text">{{ $t('admin.deleteUserWarning', { username: user?.username }) }}</p>
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" @click="showDeleteConfirm = false">
            {{ $t('common.cancel') }}
          </button>
          <button 
            class="cf-btn cf-btn-danger" 
            @click="handleDeleteUser"
            :disabled="isLoadingAction"
          >
            {{ isLoadingAction ? '...' : $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { usePostsStore } from '@/stores/postsStore'
import { userService } from '@/services/userService'
import { useToast } from '../../composables/useToast'
import ToastNotification from '../../components/ToastNotification.vue'
import type { User } from '@/types/api.types'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const postsStore = usePostsStore()

const user = ref<User | null>(null)
const isLoading = ref(false)
const isLoadingAction = ref(false)
const error = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const { t } = useI18n()
const { success, error: showError } = useToast()

const userId = computed(() => {
  const id = parseInt(route.params.id as string)
  return isNaN(id) ? null : id
})

const isAdmin = computed(() => auth.user?.role === 'admin')
const isOwnProfile = computed(() => auth.user?.id === userId.value)

// Check if viewing own profile and redirect
onMounted(async () => {
  if (!userId.value) {
    error.value = 'Invalid user ID'
    return
  }

  // If viewing own profile, redirect to profile page
  if (auth.user && auth.user.id === userId.value) {
    router.replace('/profile')
    return
  }

  await loadUserProfile()
})

async function loadUserProfile() {
  if (!userId.value) return

  isLoading.value = true
  error.value = null

  try {
    // Fetch user data
    const userData = await userService.getUserById(userId.value)
    user.value = userData

    // Fetch user's posts
    await postsStore.fetchPosts({ authorId: userId.value })
    
    // Fetch all posts to check for best answers
    await postsStore.fetchPosts({ limit: 1000 })
    
    // Fetch comments for posts with best answers
    const postsWithBestAnswer = postsStore.posts.filter(p => p.bestAnswerId)
    for (const post of postsWithBestAnswer) {
      const hasComment = postsStore.comments.some(c => c.id === post.bestAnswerId)
      if (!hasComment) {
        try {
          await postsStore.fetchPostById(post.id)
        } catch (e) {
          // Silently continue if we can't fetch a post
        }
      }
    }
  } catch (e: any) {
    console.error('Failed to load user profile:', e)
    error.value = e.response?.data?.message || e.message || 'Failed to load user profile'
  } finally {
    isLoading.value = false
  }
}

const initials = computed(() => {
  if (!user.value) return 'U'
  return user.value.username ? user.value.username.slice(0, 1).toUpperCase() : 'U'
})

// Stats calculations
const postsCount = computed(() => {
  if (!userId.value) return 0
  return postsStore.posts.filter(p => p.author?.id === userId.value).length
})

const answersCount = computed(() => {
  if (!userId.value) return 0
  return postsStore.comments.filter(c => c.author?.id === userId.value).length
})

const bestAnswersCount = computed(() => {
  if (!userId.value) return 0
  
  let count = 0
  const postsWithBestAnswer = postsStore.posts.filter(p => p.bestAnswerId)
  
  postsWithBestAnswer.forEach(post => {
    if (post.bestAnswerId) {
      const bestComment = postsStore.comments.find(c => c.id === post.bestAnswerId)
      if (bestComment && bestComment.author?.id === userId.value) {
        count++
      }
    }
  })
  
  return count
})

// User's posts
const userPosts = computed(() => {
  if (!userId.value) return []
  return postsStore.postsWithMeta.filter((p) => p.author?.id === userId.value)
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

async function handleBlockUser() {
  if (!userId.value || !isAdmin.value) return

  isLoadingAction.value = true
  try {
    const updatedUser = await userService.blockUser(userId.value)
    user.value = updatedUser
    success(t('admin.userBlocked', { username: updatedUser.username }))
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || 'Failed to block user')
  } finally {
    isLoadingAction.value = false
  }
}

async function handleUnblockUser() {
  if (!userId.value || !isAdmin.value) return

  isLoadingAction.value = true
  try {
    const updatedUser = await userService.unblockUser(userId.value)
    user.value = updatedUser
    success(t('admin.userUnblocked', { username: updatedUser.username }))
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || 'Failed to unblock user')
  } finally {
    isLoadingAction.value = false
  }
}

async function handleDeleteUser() {
  if (!userId.value || !isAdmin.value || !user.value) return

  isLoadingAction.value = true
  try {
    await userService.deleteUser(userId.value)
    success(t('admin.userDeleted', { username: user.value.username }))
    showDeleteConfirm.value = false
    // Redirect to home after deletion
    router.push('/home')
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || 'Failed to delete user')
  } finally {
    isLoadingAction.value = false
  }
}
</script>

<style scoped>
.loading-container,
.error-container {
  text-align: center;
  padding: 40px 20px;
}

.error-container p {
  color: var(--muted);
  margin-bottom: 20px;
}

.profile-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 26px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
}

.avatar {
  width: 64px;
  height: 64px;
  background: var(--brand);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 26px;
  color: white;
}

.name {
  font-size: 20px;
  margin: 0;
}

.username {
  margin: 0;
  color: var(--muted);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.stat-box {
  width: 32%;
  background: #1f2937;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}

.stat-box h3 {
  margin: 0;
  font-size: 20px;
}

.stat-box p {
  margin: 4px 0 0;
  color: var(--muted);
}

.posts-section h3 {
  margin-bottom: 14px;
}

/* Empty state */
.empty-box {
  text-align: center;
  padding: 40px 20px;
}

.empty-avatar {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  margin: 0 auto 12px;
  font-size: 28px;
}

.no-posts-title {
  font-size: 18px;
  margin: 6px 0;
}

.no-posts-sub {
  color: var(--muted);
  margin-bottom: 16px;
}

/* Posts list */
.posts-list {
  display: grid;
  gap: 16px;
}

.post-card {
  background: #0b1220;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-title {
  margin: 0;
  font-size: 16px;
}

.post-date {
  color: var(--muted);
}

.post-excerpt {
  color: var(--muted);
  margin: 8px 0 12px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-pill {
  background: #111827;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--muted);
}

.meta-right {
  display: flex;
  gap: 12px;
  color: var(--muted);
}

.meta-item {
  font-size: 14px;
}

/* Blocked Badge */
.blocked-badge {
  margin-top: 16px;
  padding: 12px;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  text-align: center;
  color: #fca5a5;
}

.blocked-badge span {
  font-weight: 500;
}

/* Admin Controls */
.admin-controls {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cf-btn-warning {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.cf-btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-success:hover:not(:disabled) {
  background: #059669;
}

.cf-btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.cf-btn-danger:disabled,
.cf-btn-warning:disabled,
.cf-btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cf-btn-secondary {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--line);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cf-btn-secondary:hover {
  background: var(--panel);
}

/* Delete User Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 16px;
  font-size: 20px;
  color: var(--text);
}

.warning-text {
  color: var(--muted);
  margin: 0 0 24px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>

