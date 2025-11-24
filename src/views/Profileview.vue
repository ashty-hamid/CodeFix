<template>
  <DefaultLayout>
    <section class="cf-container" style="padding-block: 32px">
      <div class="profile-card">
        <!-- Avatar + Name -->
        <div class="top-row">
          <div class="avatar">{{ initials }}</div>

          <div>
            <h2 class="name">{{ auth.user?.username }}</h2>
            <p class="username">@{{ usernameDisplay }}</p>
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

        <!-- Add New Post Button -->
        <div class="btn-row">
          <RouterLink to="/add">
            <button class="cf-btn cf-btn-primary">{{ $t('profile.addNewPost') }}</button>
          </RouterLink>
        </div>

        <!-- Delete Account Button -->
        <div class="btn-row" style="margin-top: 12px;">
          <button 
            class="cf-btn cf-btn-danger" 
            @click="showDeleteConfirm = true"
          >
            {{ $t('profile.deleteAccount') }}
          </button>
        </div>
      </div>

      <!-- USER POSTS SECTION -->
      <div class="posts-section">
        <h3>{{ $t('common.yourPosts') }} ({{ myPosts.length }})</h3>

        <!-- No posts yet -->
        <div v-if="myPosts.length === 0" class="empty-box">
          <div class="empty-avatar">👤</div>
          <p class="no-posts-title">{{ $t('common.noPostsYet') }}</p>
          <p class="no-posts-sub">{{ $t('common.shareFirstError') }}</p>

          <RouterLink to="/add">
            <button class="cf-btn cf-btn-primary">{{ $t('common.createFirstPost') }}</button>
          </RouterLink>
        </div>

        <!-- List of user posts -->
        <div v-else class="posts-list">
          <article v-for="post in myPosts" :key="post.id" class="post-card">
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
    </section>

    <!-- Toast Notifications -->
    <ToastNotification />

    <!-- Delete Account Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content">
        <h3>{{ $t('profile.confirmDeleteAccount') }}</h3>
        <p class="warning-text">{{ $t('profile.deleteAccountWarning') }}</p>
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" @click="showDeleteConfirm = false">
            {{ $t('common.cancel') }}
          </button>
          <button 
            class="cf-btn cf-btn-danger" 
            @click="handleDeleteAccount"
            :disabled="auth.isLoading"
          >
            {{ auth.isLoading ? '...' : $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { usePostsStore } from '@/stores/postsStore'
import { useToast } from '../../composables/useToast'
import ToastNotification from '../../components/ToastNotification.vue'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

const auth = useAuthStore()
const postsStore = usePostsStore()
const router = useRouter()
const { t } = useI18n()
const { success, error: showError } = useToast()
const showDeleteConfirm = ref(false)

// Fetch user's posts and all posts (to check for best answers) on mount
onMounted(async () => {
  if (auth.user) {
    try {
      await postsStore.fetchPosts({ authorId: auth.user.id })
      // Fetch all posts to check for best answers
      await postsStore.fetchPosts({ limit: 1000 })
      
      // Fetch comments only for posts where we don't already have the best answer comment
      const postsWithBestAnswer = postsStore.posts.filter(p => p.bestAnswerId)
      for (const post of postsWithBestAnswer) {
        // Check if we already have this comment in the store
        const hasComment = postsStore.comments.some(c => c.id === post.bestAnswerId)
        if (!hasComment) {
          try {
            // Fetch comments for this post to get the best answer comment
            await postsStore.fetchPostById(post.id)
          } catch (e) {
            // Silently continue if we can't fetch a post
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch user posts:', e)
    }
  }
})

const initials = computed(() => (auth.user?.username ? auth.user.username.slice(0, 1).toUpperCase() : 'U'))

const usernameDisplay = computed(() => auth.user?.username || 'user')

// stats - these will need to be calculated from posts/comments
const postsCount = computed(() => {
  if (!auth.user) return 0
  return postsStore.posts.filter(p => p.author?.id === auth.user!.id).length
})
const answersCount = computed(() => {
  if (!auth.user) return 0
  return postsStore.comments.filter(c => c.author?.id === auth.user!.id).length
})
const bestAnswersCount = computed(() => {
  if (!auth.user) return 0
  
  // Count how many of the user's comments are marked as best answers
  let count = 0
  
  // Get all posts that have a bestAnswerId
  const postsWithBestAnswer = postsStore.posts.filter(p => p.bestAnswerId)
  
  // For each post with a best answer, check if that comment belongs to the current user
  postsWithBestAnswer.forEach(post => {
    if (post.bestAnswerId) {
      // Find the comment in the store
      const bestComment = postsStore.comments.find(c => c.id === post.bestAnswerId)
      if (bestComment && bestComment.author?.id === auth.user!.id) {
        count++
      }
    }
  })
  
  return count
})

// current user's posts with meta (tags, answersCount, etc.)
const myPosts = computed(() => {
  if (!auth.user) return []
  return postsStore.postsWithMeta.filter((p) => p.author?.id === auth.user!.id)
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

async function handleDeleteAccount() {
  if (!auth.user) return
  
  try {
    await auth.deleteUser(auth.user.id)
    success(t('profile.accountDeleted'))
    showDeleteConfirm.value = false
    // Redirect to home after deletion (logout is handled in deleteUser)
    router.push('/home')
  } catch (e: any) {
    showError(e.response?.data?.message || e.message || 'Failed to delete account')
  }
}
</script>

<style scoped>
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

.btn-row {
  text-align: right;
  margin-top: 14px;
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

/* Delete Account Modal */
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

.cf-btn-danger:disabled {
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
</style>
