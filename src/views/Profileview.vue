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
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { usePostsStore } from '@/stores/postsStore'
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'

const auth = useAuthStore()
const postsStore = usePostsStore()

// Fetch user's posts on mount
onMounted(async () => {
  if (auth.user) {
    try {
      await postsStore.fetchPosts({ authorId: auth.user.id })
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
const bestAnswersCount = computed(() => 0) // Not implemented yet

// current user's posts with meta (tags, answersCount, etc.)
const myPosts = computed(() => {
  if (!auth.user) return []
  return postsStore.postsWithMeta.filter((p) => p.author?.id === auth.user!.id)
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
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
</style>
