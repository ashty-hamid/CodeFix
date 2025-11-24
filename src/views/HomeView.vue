<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1 style="margin: 0 0 8px">{{ $t('home.title') }}</h1>
      <p style="color: var(--muted); margin: 0 0 20px">
        {{ $t('home.subtitle') }}
      </p>

      <!-- TAG FILTER -->
      <div style="margin-bottom: 20px; display: flex; gap: 12px; align-items: center">
        <label style="color: var(--muted)">{{ $t('common.filterByTag') }}</label>

        <select v-model="selectedTag" class="cf-search" style="width: 220px">
          <option value="">{{ $t('common.allTags') }}</option>
          <option v-for="tag in tags" :key="tag.id" :value="tag.name">
            {{ tag.name }}
          </option>
        </select>
      </div>

      <!-- LOADING STATE -->
      <div v-if="store.isLoading" style="padding: 20px; text-align: center; color: var(--muted)">
        Loading posts...
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="store.error" style="padding: 20px; background: rgba(255, 77, 77, 0.1); border: 1px solid rgb(255, 77, 77); border-radius: 8px; color: rgb(255, 120, 120)">
        {{ store.error }}
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="filteredPosts.length === 0" style="padding: 20px; text-align: center; color: var(--muted)">
        <p>No posts found.</p>
        <p style="font-size: 12px; margin-top: 8px;">Debug: Posts in store: {{ posts.length }}, Filtered: {{ filteredPosts.length }}</p>
      </div>

      <!-- POSTS LIST -->
      <div v-else style="display: grid; gap: 20px">
        <article
          v-for="post in filteredPosts"
          :key="post.id"
          class="card"
          style="
            background: #0b1220;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 16px;
          "
        >
          <!-- HEADER -->
          <header style="display: flex; justify-content: space-between; align-items: center">
            <h2 style="margin: 0; font-size: 18px">
              <RouterLink :to="`/post/${post.id}`" class="cf-link">
                {{ post.title }}
              </RouterLink>
            </h2>

            <small style="color: var(--muted)">
              {{ formatDate(post.createdAt) }}
            </small>
          </header>

          <!-- AUTHOR -->
          <div style="color: var(--muted); margin-top: 4px">
            {{ $t('common.postedBy') }} {{ post.author?.username ?? $t('common.unknown') }}
          </div>

          <!-- EXCERPT -->
          <p style="color: var(--muted); margin: 8px 0 12px">
            {{ post.excerpt || post.body?.slice(0, 150) }}
          </p>

          <!-- CODE PREVIEW -->
          <pre
            v-if="post.body"
            style="
              background: #111827;
              border: 1px solid var(--line);
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 12px;
              overflow: auto;
              color: #d1d5db;
            "
            >{{ post.body.slice(0, 150) }}{{ post.body.length > 150 ? '…' : '' }}
          </pre>

          <!-- FOOTER (TAGS + COUNT + SCORE) -->
          <footer
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 12px;
            "
          >
            <!-- TAGS -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap">
              <span
                v-for="t in (post.tags || []).filter(t => t && t.id && t.name)"
                :key="t.id"
                style="
                  background: #111827;
                  color: var(--muted);
                  padding: 4px 10px;
                  border-radius: 999px;
                  border: 1px solid var(--line);
                  font-size: 12px;
                "
              >
                {{ t.name }}
              </span>
            </div>

            <!-- RIGHT SIDE: ANSWERS + SCORE -->
            <div style="display: flex; gap: 18px; align-items: center; color: var(--muted)">
              <span>💬 {{ post.commentsCount || 0 }}</span>
              <span>⭐ {{ totalVoteScore(post.id) }}</span>
            </div>
          </footer>
        </article>
      </div>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { computed, ref, onMounted } from 'vue'
import { usePostsStore } from '@/stores/postsStore'

const store = usePostsStore()

// all tags
const tags = computed(() => store.allTags)

// selected tag
const selectedTag = ref('')

// all posts enriched with tags + answers count
const posts = computed(() => store.postsWithMeta)

// filter logic
const filteredPosts = computed(() => {
  if (!selectedTag.value) return posts.value
  return posts.value.filter((post) => 
    post.tags?.some((t) => t && t.name && t.name === selectedTag.value)
  )
})

// count score of all answers inside a post
function totalVoteScore(postId: number) {
  const post = store.postById(postId)
  if (!post?.answers) return 0
  return post.answers.reduce((sum, ans) => sum + ans.score, 0)
}

// date formatting
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

// Fetch posts on mount
onMounted(async () => {
  try {
    console.log('Fetching posts...')
    const response = await store.fetchPosts({ limit: 50 })
    console.log('Posts fetched:', response.data?.length || posts.value.length)
    console.log('Posts in store:', posts.value)
  } catch (e: any) {
    console.error('Failed to fetch posts:', e)
    console.error('Error details:', e.response?.data || e.message)
  }
})
</script>
