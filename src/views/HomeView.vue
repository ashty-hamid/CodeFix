<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1 style="margin: 0 0 8px">Recent Error Posts</h1>
      <p style="color: var(--muted); margin: 0 0 20px">
        Find solutions to coding problems or help others with theirs.
      </p>

      <!-- TAG FILTER -->
      <div style="margin-bottom: 20px; display: flex; gap: 12px; align-items: center">
        <label style="color: var(--muted)">Filter by tag:</label>

        <select v-model="selectedTag" class="cf-search" style="width: 220px">
          <option value="">All Tags</option>
          <option v-for="tag in tags" :key="tag.id" :value="tag.name">
            {{ tag.name }}
          </option>
        </select>
      </div>

      <!-- POSTS LIST -->
      <div style="display: grid; gap: 20px">
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
            Posted by {{ post.author?.username ?? 'Unknown' }}
          </div>

          <!-- EXCERPT -->
          <p style="color: var(--muted); margin: 8px 0 12px">
            {{ post.excerpt }}
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
                v-for="t in post.tags"
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
              <span>💬 {{ post.answersCount }}</span>
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
import { computed, ref } from 'vue'
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
  return posts.value.filter((post) => post.tags.some((t) => t.name === selectedTag.value))
})

// count score of all answers inside a post
function totalVoteScore(postId: number) {
  const post = store.postById(postId)
  if (!post) return 0
  return post.answers.reduce((sum, ans) => sum + ans.score, 0)
}

// date formatting
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
</script>
