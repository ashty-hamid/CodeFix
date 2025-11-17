<template>
  <DefaultLayout>
    <section class="cf-container">
      <h1 style="margin: 0 0 10px">Share Your Coding Error</h1>
      <p style="color: var(--muted); margin: 0 0 20px">
        Get help from the community by sharing your coding problem.
      </p>

      <!-- LOGIN REQUIRED -->
      <div
        v-if="!auth.isLoggedIn"
        style="
          background: #0b1220;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        "
      >
        <h2 style="margin-bottom: 10px">Login Required</h2>
        <p style="color: var(--muted); margin-bottom: 20px">
          You must be logged in to create a new post.
        </p>

        <RouterLink :to="{ name: 'login', query: { redirect: '/add' } }">
          <button class="cf-btn cf-btn-primary">Log In / Register</button>
        </RouterLink>
      </div>

      <!-- FORM -->
      <form
        v-else
        @submit.prevent="submit"
        style="
          background: #0b1220;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 24px;
        "
      >
        <!-- TITLE -->
        <label style="font-weight: 500">Title *</label>
        <input
          v-model="title"
          required
          class="cf-search"
          style="display: block; width: 100%; margin: 6px 0 16px"
          placeholder="Brief description of your coding error"
        />

        <!-- DESCRIPTION -->
        <label style="font-weight: 500">Description *</label>
        <textarea
          v-model="body"
          required
          rows="7"
          style="
            width: 100%;
            background: #111827;
            color: #e5e7eb;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 12px;
            margin: 6px 0 16px;
          "
          placeholder="Describe your coding error in detail."
        ></textarea>

        <!-- TAGS -->
        <label style="font-weight: 500">Tags (comma separated)</label>
        <input
          v-model="tags"
          class="cf-search"
          style="width: 100%; margin: 6px 0 20px"
          placeholder="e.g. javascript, vue, typescript"
        />

        <!-- BUTTONS -->
        <div style="display: flex; gap: 12px">
          <button type="button" class="cf-btn" @click="resetForm">Cancel</button>
          <button type="submit" class="cf-btn cf-btn-primary">Create Post</button>
        </div>
      </form>
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/components/layouts/DefaultLayout.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/postsStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const posts = usePostsStore()
const auth = useAuthStore()

const title = ref('')
const body = ref('')
const tags = ref('')

// RESET FORM
function resetForm() {
  title.value = ''
  body.value = ''
  tags.value = ''
}

// SUBMIT
function submit() {
  if (!auth.isLoggedIn) {
    return router.push({ name: 'login', query: { redirect: '/add' } })
  }

  // convert "tag1, tag2" → ["tag1", "tag2"]
  const tagNames = tags.value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  // add post
  const newPostId = posts.addPost({
    title: title.value.trim(),
    body: body.value.trim(),
    tagNames,
    authorId: auth.user!.id,
  })

  // redirect to the post page
  router.push(`/post/${newPostId}`)
}
</script>
